"""
ai_insights.py

AI-driven financial insights for Boogasi Financial Assistant (offline).
Functions:
 - generate_expense_summary(data)
 - forecast_cash_flow(data)
 - flag_unusual_transactions(data)
 - generate_weekly_report(data)
 - generate_combined_insights(data)
 - generate_insights(data, feature)  # router

Accepts `data` as either:
 - list of transaction dicts, or
 - a dict containing {"data": {"transactions": [...]}} or similar.

Each transaction must be:
{ "date": "YYYY-MM-DD", "description": "text", "amount": float, "type": "expense"|"income", "category": "string" }

Requires: pandas, numpy
"""
from __future__ import annotations
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import re
from pathlib import Path

# Placeholder for future LLM text generation (offline-friendly stub)
def _llm_generate_summary_stub(prompt: str) -> str:
    # Future: call local LLM / template engine here. For now return the prompt headlined.
    return prompt.strip() if prompt else ""

def _extract_transactions(data: Any) -> List[Dict[str, Any]]:
    """Normalize input into a list of transaction dicts."""
    if data is None:
        return []
    # If already a list of transactions
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # Common shapes: top-level has 'transactions' or data->transactions
        if 'transactions' in data and isinstance(data['transactions'], list):
            return data['transactions']
        if 'data' in data and isinstance(data['data'], dict):
            d = data['data']
            if 'transactions' in d and isinstance(d['transactions'], list):
                return d['transactions']
        # If passed a wrapper with many top-level keys, try to find first list of dicts
        for v in data.values():
            if isinstance(v, list) and v and isinstance(v[0], dict):
                return v
    return []

def _parse_date_flexible(val):
    """Try several common date formats, fall back to pandas parser, return NaT on failure."""
    if pd.isna(val) or val is None:
        return pd.NaT
    s = str(val).strip()
    # quick direct ISO match
    m = re.search(r'(\d{4}-\d{2}-\d{2})', s)
    if m:
        try:
            return pd.to_datetime(m.group(1), format='%Y-%m-%d', errors='coerce')
        except:
            return pd.NaT
    # try several likely formats
    for fmt in ('%Y-%m-%d', '%Y/%m/%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%m-%d-%Y'):
        try:
            return pd.to_datetime(s, format=fmt, errors='coerce')
        except Exception:
            pass
    # final fallback to pandas generic parser (may still be NaT)
    try:
        return pd.to_datetime(s, errors='coerce')
    except Exception:
        return pd.NaT

def _to_dataframe(transactions: List[Dict[str, Any]]) -> pd.DataFrame:
    """Convert transactions list to pandas DataFrame and coerce types."""
    df = pd.DataFrame(transactions).copy()
    if df.empty:
        # return standard columns
        return pd.DataFrame(columns=["date", "description", "amount", "type", "category"])
    # Ensure columns exist
    for col in ["date", "description", "amount", "type", "category"]:
        if col not in df.columns:
            df[col] = None
    # Preserve raw date and attempt flexible parsing per-row (avoids global infer warnings)
    df['date_raw'] = df['date']
    df['date'] = df['date'].apply(_parse_date_flexible)
    # Amount numeric
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
    # Normalize type/category
    df['type'] = df['type'].fillna('').str.lower().replace({'in': 'income'})
    df['category'] = df['category'].fillna('').astype(str)
    # Add sign-consistent value: positive for income, negative for expenses
    def signed_amount(row):
        if row['type'] == 'expense':
            return -abs(row['amount'])
        if row['type'] == 'income':
            return abs(row['amount'])
        # fallback: use amount sign as-is
        return float(row['amount'])
    df['signed_amount'] = df.apply(signed_amount, axis=1)
    return df

def generate_expense_summary(data: Any) -> Dict[str, Any]:
    """Group expenses by category and return totals, percentages, top categories and an insight text."""
    txns = _extract_transactions(data)
    df = _to_dataframe(txns)
    expenses = df[df['type'] == 'expense'].copy()
    total_expenses = expenses['amount'].sum()
    if total_expenses == 0 or expenses.empty:
        insight_text = "No expense transactions available to summarize."
        return {
            "feature": "expense_summary",
            "summary": {},
            "top_category": None,
            "insight_text": insight_text
        }
    grouped = expenses.groupby('category', sort=False)['amount'].sum().sort_values(ascending=False)
    summary = {}
    for cat, total in grouped.items():
        summary[cat or "uncategorized"] = {
            "total": round(float(total), 2),
            "percentage": round(float((total / total_expenses) * 100), 2)
        }
    top_category = grouped.index[0] if not grouped.empty else None
    pct = round(float((grouped.iloc[0] / total_expenses) * 100), 1) if not grouped.empty else 0.0
    insight_text = f"Your highest spending period was on {top_category}, accounting for {pct}% of total expenses." if top_category else "No clear top spending category."
    # Placeholder for LLM-enhanced text (future)
    insight_text = _llm_generate_summary_stub(insight_text)
    return {
        "feature": "expense_summary",
        "summary": summary,
        "top_category": top_category,
        "insight_text": insight_text
    }

def forecast_cash_flow(data: Any, weeks_for_ma: int = 4) -> Dict[str, Any]:
    """
    Legacy name kept for compatibility — delegate to the corrected implementation
    that performs safe weekly aggregation (generate_cash_flow_forecast).
    """
    return generate_cash_flow_forecast(data)

def flag_unusual_transactions(data: Any, z_threshold: float = 2.0) -> Dict[str, Any]:
    """
    Identify transactions that deviate from category mean by more than z_threshold*std.
    Returns flagged items and an AI-style summary.
    """
    txns = _extract_transactions(data)
    df = _to_dataframe(txns)
    if df.empty:
        return {
            "feature": "flag_unusual_transactions",
            "flags": [],
            "summary_text": "No transactions to analyze for anomalies."
        }
    flags = []
    # Use absolute amounts per category to measure magnitude
    df['abs_amount'] = df['amount'].abs()
    categories = df['category'].fillna('uncategorized').unique()
    for cat in categories:
        sub = df[df['category'].fillna('uncategorized') == cat]
        if len(sub) < 2:
            continue
        mean = sub['abs_amount'].mean()
        std = sub['abs_amount'].std(ddof=0)
        upper = mean + z_threshold * std
        lower = max(0.0, mean - z_threshold * std)  # don't allow negative lower bound for amounts
        # Flagging: for expenses, unusually high absolute amounts > upper
        for _, row in sub.iterrows():
            amt = float(row['abs_amount'])
            reason = None
            if amt > upper:
                reason = f"Unusually high amount for category '{cat}' (>{round(upper,2)})."
            elif amt < lower:
                reason = f"Unusually low amount for category '{cat}' (<{round(lower,2)})."
            if reason:
                flags.append({
                    "date": (row['date'].strftime('%Y-%m-%d') if not pd.isna(row['date']) else row.get('date_raw')),
                    "description": row.get('description', '')[:200],
                    "amount": float(row['amount']),
                    "type": row.get('type'),
                    "category": cat,
                    "reason": reason
                })
    summary_text = f"{len(flags)} unusual transaction(s) detected."
    summary_text = _llm_generate_summary_stub(summary_text)
    return {
        "feature": "flag_unusual_transactions",
        "flags": flags,
        "summary_text": summary_text
    }

def generate_weekly_report(data: Any) -> Dict[str, Any]:
    """Combine expense summary, cash flow forecast and flagged transactions into a weekly report JSON."""
    expense = generate_expense_summary(data)
    # use the safe generator implementation
    forecast = generate_cash_flow_forecast(data)
    flags = flag_unusual_transactions(data)
    report = {
        "feature": "weekly_report",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "expense_summary": expense,
        "cash_flow_forecast": forecast,
        "flagged_transactions": flags
    }
    return report

def generate_combined_insights(data: Any) -> Dict[str, Any]:
    """Provide a compact unified overview combining main findings for dashboards."""
    expense = generate_expense_summary(data)
    forecast = generate_cash_flow_forecast(data)
    flags = flag_unusual_transactions(data)
    top_cats = list(expense.get('summary', {}).keys())[:3]
    anomalies_count = len(flags.get('flagged', []))
    insight_text = f"Top categories: {', '.join(top_cats)}. Next week's net forecast: {forecast.get('overall_summary', {}).get('total_net')}. {anomalies_count} anomalies detected."
    insight_text = _llm_generate_summary_stub(insight_text)
    return {
        "feature": "combined_insights",
        "top_categories": top_cats,
        "forecast": {
            "projected_next_week_net": forecast.get('overall_summary', {}).get('total_net'),
            "projected_cumulative_balance": forecast.get('overall_summary', {}).get('total_net')
        },
        "anomalies_count": anomalies_count,
        "insight_text": insight_text,
        "details": {
            "expense_summary": expense.get('summary'),
            "flagged_transactions": flags.get('flagged')
        }
    }

def load_learned_patterns(patterns_file: str | Path) -> Dict[str, Any]:
    """Load categorization patterns from JSON file"""
    try:
        with open(patterns_file) as f:
            patterns = json.load(f)
            print(f"🤖 Loading patterns from {patterns_file}")
            print(f"✓ Merchant categories: {len(patterns.get('merchant_categories', {}))}")
            print(f"✓ Category patterns: {len(patterns.get('category_patterns', {}))}")
            return patterns
    except Exception as e:
        print(f"⚠️ Warning: Could not load patterns from {patterns_file}: {e}")
        return {
            "merchant_categories": {},
            "category_patterns": {}
        }

def generate_insights(transactions: List[Dict], feature: str) -> Dict[str, Any]:
    if not transactions:
        return {
            "feature": feature,
            "error": "No transactions provided",
            "summary": {},
            "insight_text": "No transactions available for analysis."
        }

    # Convert to DataFrame for analysis
    df = pd.DataFrame(transactions)

    if feature == "cash_flow_forecast":
        # Call the corrected implementation (uses _to_dataframe and safe resampling)
        return generate_cash_flow_forecast(transactions)

    # Normalise fields we rely on
    if "amount" not in df.columns:
        df["amount"] = 0.0
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    # Normalise category and type
    if "category" not in df.columns:
        df["category"] = "uncategorized"
    else:
        df["category"] = df["category"].fillna("uncategorized")
    if "type" not in df.columns:
        df["type"] = ""
    else:
        df["type"] = df["type"].fillna("").astype(str)

    # Consider a transaction an expense if amount < 0 OR explicit type == 'expense'
    is_expense_mask = (df["amount"] < 0) | (df["type"].str.lower() == "expense")
    is_income_mask = (df["amount"] > 0) | (df["type"].str.lower() == "income")

    if feature == "expense_summary":
        expenses_df = df[is_expense_mask].copy()
        
        if expenses_df.empty:
            return {
                "feature": "expense_summary",
                "summary": {},
                "top_category": None,
                "insight_text": "No expense transactions found in the provided data."
            }

        # Group by category and calculate totals (use absolute totals for display)
        category_totals = expenses_df.groupby("category")["amount"].sum().abs()
        total_expenses = float(category_totals.sum())

        if total_expenses == 0:
            return {
                "feature": "expense_summary",
                "summary": {},
                "top_category": None,
                "insight_text": "Could not calculate expense summary - totals are zero."
            }

        summary = {
            cat: {
                "total": float(total),
                "percentage": round(float(total / total_expenses * 100), 2)
            }
            for cat, total in category_totals.items()
        }

        top_category = max(summary.items(), key=lambda x: x[1]["total"])[0]

        return {
            "feature": "expense_summary",
            "summary": summary,
            "top_category": top_category,
            "insight_text": f"Your highest spending was in {top_category}, accounting for {summary[top_category]['percentage']}% of total expenses.",
            "transactions": transactions
        }

    if feature == "flag_unusual_transactions":
        return flag_unusual_transactions(transactions)

    return {
        "feature": feature,
        "error": f"Feature '{feature}' not implemented",
        "insight_text": "The requested analysis feature is not available."
    }

def generate_cash_flow_forecast(transactions):
    # Normalize input and coercions
    df = _to_dataframe(transactions)

    # Ensure date column is datetime-like ( _to_dataframe already attempts parsing )
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['amount'] = pd.to_numeric(df.get('amount', 0), errors='coerce').fillna(0)

    # Drop rows without valid dates before resampling
    df = df.dropna(subset=['date'])
    if df.empty:
        return {
            "feature": "cash_flow_forecast",
            "overall_summary": {"total_income": 0.0, "total_expenses": 0.0, "total_net": 0.0},
            "weekly_series": [],
            "summary_text": "No valid transactions for forecast."
        }

    df = df.set_index('date').sort_index()

    # explicit weekly aggregation that returns a DataFrame (avoids nested renamer)
    weekly = df.resample('W').apply(
        lambda g: pd.Series({
            'income': g.loc[g['amount'] >= 0, 'amount'].sum(),
            'expense': abs(g.loc[g['amount'] < 0, 'amount'].sum()),
            'net': g['amount'].sum()
        })
    ).fillna(0)

    # Build weekly_series list (keep last 4 weeks; if fewer, return what's available)
    series = []
    for dt, row in weekly.iterrows():
        series.append({
            "week_start": dt.strftime("%Y-%m-%d"),
            "income": float(row.get('income', 0) or 0.0),
            "expense": float(row.get('expense', 0) or 0.0),
            "net": float(row.get('net', 0) or 0.0)
        })

    weekly_series = series[-4:]

    total_income = float(df.loc[df['amount'] >= 0, 'amount'].sum())
    total_expenses = float(abs(df.loc[df['amount'] < 0, 'amount'].sum()))
    total_net = float(df['amount'].sum())

    return {
        "feature": "cash_flow_forecast",
        "overall_summary": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "total_net": total_net
        },
        "weekly_series": weekly_series,
        "summary_text": f"Monthly Summary: Total Income: {total_income:.2f} Total Expenses: {total_expenses:.2f} Net: {total_net:.2f}"
    }

# Replace any duplicated implementations with this single unified function
def flag_unusual_transactions(transactions: Any, window_days: int = 90) -> Dict[str, Any]:
    """
    Robust, single implementation for flagging unusual transactions.
    Returns {"feature":"flag_unusual_transactions","flagged":[...],"summary":{...}}
    """
    txns = _extract_transactions(transactions)
    df = _to_dataframe(txns)
    # ensure date/amount types
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df['amount'] = pd.to_numeric(df.get('amount', 0), errors='coerce').fillna(0.0)
    if df.empty:
        return {"feature": "flag_unusual_transactions", "flagged": [], "summary": {"total_checked": 0, "flagged_count": 0}}

    # baseline window
    max_date = df['date'].max()
    cutoff = max_date - pd.Timedelta(days=window_days)
    baseline = df[df['date'] >= cutoff] if len(df) >= 10 else df.copy()

    # use median + MAD for robustness
    med = float(baseline['amount'].median())
    mad = float((np.abs(baseline['amount'] - med)).median() or 1.0)

    flagged = []
    # Prepare lower-case description series for comparisons (handle missing descriptions)
    df['desc_norm'] = df['description'].fillna('').astype(str).str.strip().str.lower()
    baseline_desc_counts = baseline['description'].fillna('').astype(str).str.strip().str.lower().value_counts()

    for idx, row in df.iterrows():
        amt = float(row['amount'])
        # normalized distance using MAD
        z_mad = abs(amt - med) / mad
        reasons = []
        score = 0.0

        # amount outlier
        if z_mad > 3:
            reasons.append('amount_outlier')
            score += 0.6
        elif z_mad > 2:
            reasons.append('possible_amount_outlier')
            score += 0.35

        # rare payee/merchant
        payee = row['desc_norm']
        payee_count = int(baseline_desc_counts.get(payee, 0))
        if payee_count <= 1 and payee != '':
            reasons.append('rare_payee')
            score += 0.2

        # duplicate / reversal: same amount & description within 2 days
        if payee:
            window = df[
                (df['desc_norm'] == payee) &
                (df['amount'] == amt) &
                (abs((df['date'] - row['date']).dt.days) <= 2)
            ]
            if len(window) > 1:
                reasons.append('possible_duplicate_or_reversal')
                score += 0.2

        # time-based anomaly: transaction on unusual weekday for this payee (optional)
        try:
            dow = int(row['date'].dayofweek)
            hist_weekdays = baseline[baseline['desc_norm'] == payee]['date'].dt.dayofweek.value_counts()
            if payee and not hist_weekdays.empty:
                if hist_weekdays.get(dow, 0) == 0 and hist_weekdays.sum() >= 3:
                    reasons.append('unusual_weekday_for_payee')
                    score += 0.15
        except Exception:
            pass

        if reasons:
            severity = 'low' if score < 0.4 else 'medium' if score < 0.8 else 'high'
            flagged.append({
                "id": int(row.get('index', -1)) if row.get('index', None) is not None else None,
                "index": int(idx),
                "date": row['date'].strftime('%Y-%m-%d') if not pd.isna(row['date']) else row.get('date_raw'),
                "amount": float(amt),
                "currency": row.get('currency') if 'currency' in row else None,
                "type": row.get('type'),
                "category": row.get('category'),
                "description": row.get('description'),
                "score": round(min(score, 1.0), 2),
                "severity": severity,
                "reasons": reasons,
                "baseline": {
                    "median": med,
                    "mad": mad,
                    "baseline_count": int(len(baseline))
                }
            })

    summary = {"total_checked": int(len(df)), "flagged_count": int(len(flagged))}
    return {"feature": "flag_unusual_transactions", "flagged": flagged, "summary": summary}

def generate_weekly_report(data: Any) -> Dict[str, Any]:
    expense = generate_expense_summary(data)
    # use the safe generator implementation
    forecast = generate_cash_flow_forecast(data)
    flags = flag_unusual_transactions(data)
    report = {
        "feature": "weekly_report",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "expense_summary": expense,
        "cash_flow_forecast": forecast,
        "flagged_transactions": flags
    }
    return report

def generate_combined_insights(data: Any) -> Dict[str, Any]:
    expense = generate_expense_summary(data)
    forecast = generate_cash_flow_forecast(data)
    flags = flag_unusual_transactions(data)
    top_cats = list(expense.get('summary', {}).keys())[:3]
    anomalies_count = len(flags.get('flagged', []))
    insight_text = f"Top categories: {', '.join(top_cats)}. Next week's net forecast: {forecast.get('overall_summary', {}).get('total_net')}. {anomalies_count} anomalies detected."
    insight_text = _llm_generate_summary_stub(insight_text)
    return {
        "feature": "combined_insights",
        "top_categories": top_cats,
        "forecast": {
            "projected_next_week_net": forecast.get('overall_summary', {}).get('total_net'),
            "projected_cumulative_balance": forecast.get('overall_summary', {}).get('total_net')
        },
        "anomalies_count": anomalies_count,
        "insight_text": insight_text,
        "details": {
            "expense_summary": expense.get('summary'),
            "flagged_transactions": flags.get('flagged')
        }
    }

def load_learned_patterns(patterns_file: str | Path) -> Dict[str, Any]:
    """Load categorization patterns from JSON file"""
    try:
        with open(patterns_file) as f:
            patterns = json.load(f)
            print(f"🤖 Loading patterns from {patterns_file}")
            print(f"✓ Merchant categories: {len(patterns.get('merchant_categories', {}))}")
            print(f"✓ Category patterns: {len(patterns.get('category_patterns', {}))}")
            return patterns
    except Exception as e:
        print(f"⚠️ Warning: Could not load patterns from {patterns_file}: {e}")
        return {
            "merchant_categories": {},
            "category_patterns": {}
        }
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
    Compute weekly income/expense and forecast next week's net using simple moving average.
    Returns projected net change and natural-language summary.

    If no valid dates are found, fall back to a simple heuristic:
      - projected_next_week_net = total_net / 4 (approx monthly breakdown)
      - note included in summary_text
    """
    txns = _extract_transactions(data)
    df = _to_dataframe(txns)
    # If no valid parsed dates, provide a fallback projection (keeps module usable for noisy OCR)
    valid_dates_count = int(df['date'].notna().sum()) if not df.empty else 0
    if valid_dates_count == 0:
        total_income = df[df['type'] == 'income']['signed_amount'].sum()
        total_expense = df[df['type'] == 'expense']['signed_amount'].sum()
        total_net = float((total_income + total_expense) if not np.isnan(total_income + total_expense) else 0.0)
        # Simple fallback: assume the available transactions cover ~1 month and project next week as quarter of net
        proj = round(total_net / 4.0, 2)
        projected_balance = round(total_net + proj, 2)
        weekly_series = [{
            "week_start": None,
            "income": round(float(total_income), 2),
            "expense": round(float(total_expense), 2),
            "net": round(float(total_net), 2)
        }] if not df.empty else []
        summary_text = ("No parseable dates found in transactions. Using fallback projection based on "
                        "total net across available transactions divided by 4 (approx monthly -> weekly).")
        summary_text = _llm_generate_summary_stub(summary_text)
        return {
            "feature": "cash_flow_forecast",
            "projected_next_week_net": float(proj),
            "projected_cumulative_balance": float(projected_balance),
            "weekly_series": weekly_series,
            "summary_text": summary_text,
            "note": "fallback_no_dates"
        }

    # Continue with normal weekly aggregation when dates exist
    df = df.dropna(subset=['date']).sort_values('date')
    # Weekly aggregation (week starting Monday)
    df.set_index('date', inplace=True)
    # income and expense separate
    income_weekly = df[df['type'] == 'income']['signed_amount'].resample('W-MON').sum().rename('income')
    expense_weekly = df[df['type'] == 'expense']['signed_amount'].resample('W-MON').sum().rename('expense')
    # signed amounts: income positive, expense negative
    combined = pd.concat([income_weekly, expense_weekly], axis=1).fillna(0.0)
    combined['net'] = combined['income'].fillna(0.0) + combined['expense'].fillna(0.0)
    net_series = combined['net']
    # Use simple moving average on net changes
    if len(net_series) == 0:
        proj = 0.0
    else:
        window = min(weeks_for_ma, len(net_series))
        proj = float(net_series.tail(window).mean())
    last_cumulative = float(net_series.cumsum().iloc[-1]) if not net_series.empty else 0.0
    projected_balance = last_cumulative + proj
    weekly_series = []
    for idx, row in combined.reset_index().iterrows():
        weekly_series.append({
            "week_start": row['date'].strftime('%Y-%m-%d') if not pd.isna(row['date']) else None,
            "income": round(float(row.get('income', 0.0)), 2),
            "expense": round(float(row.get('expense', 0.0)), 2),
            "net": round(float(row.get('net', 0.0)), 2)
        })
    summary_text = f"Forecasted next week's net cash flow is {round(proj,2)}. Projected cumulative balance (relative) is {round(projected_balance,2)}."
    summary_text = _llm_generate_summary_stub(summary_text)
    return {
        "feature": "cash_flow_forecast",
        "projected_next_week_net": round(proj, 2),
        "projected_cumulative_balance": round(projected_balance, 2),
        "weekly_series": weekly_series,
        "summary_text": summary_text
    }

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
    forecast = forecast_cash_flow(data)
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
    forecast = forecast_cash_flow(data)
    flags = flag_unusual_transactions(data)
    top_cats = list(expense.get('summary', {}).keys())[:3]
    anomalies_count = len(flags.get('flags', []))
    insight_text = f"Top categories: {', '.join(top_cats)}. Next week's net forecast: {forecast.get('projected_next_week_net')}. {anomalies_count} anomalies detected."
    insight_text = _llm_generate_summary_stub(insight_text)
    return {
        "feature": "combined_insights",
        "top_categories": top_cats,
        "forecast": {
            "projected_next_week_net": forecast.get('projected_next_week_net'),
            "projected_cumulative_balance": forecast.get('projected_cumulative_balance')
        },
        "anomalies_count": anomalies_count,
        "insight_text": insight_text,
        "details": {
            "expense_summary": expense.get('summary'),
            "flagged_transactions": flags.get('flags')
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
    """Generate AI insights for given transactions and feature"""
    
    if not transactions:
        return {
            "feature": feature,
            "error": "No transactions provided",
            "summary": {},
            "insight_text": "No transactions available for analysis."
        }

    # Convert to DataFrame for analysis
    df = pd.DataFrame(transactions)

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
            # include original transactions for UI convenience
            "transactions": transactions
        }

    elif feature == "cash_flow_forecast":
        # ...existing cash flow code (keeps same improvements) ...
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date"])
        if df.empty:
            return {
                "feature": "cash_flow_forecast",
                "projected_next_week_net": 0.0,
                "projected_cumulative_balance": 0.0,
                "weekly_series": [],
                "summary_text": "No transactions available for forecast."
            }
        weekly = df.set_index("date").resample("W")["amount"].sum().fillna(0)
        series = []
        for date, net in weekly.tail(4).items():
            net = float(net)
            series.append({
                "week_start": date.strftime("%Y-%m-%d"),
                "income": max(net, 0.0),
                "expense": min(net, 0.0),
                "net": net
            })
        projected_next = float(weekly.mean())
        cumulative = float(weekly.sum() + projected_next)
        return {
            "feature": "cash_flow_forecast",
            "projected_next_week_net": projected_next,
            "projected_cumulative_balance": cumulative,
            "weekly_series": series,
            "summary_text": f"Forecasted next week's net cash flow is {projected_next:.2f}. Projected cumulative balance is {cumulative:.2f}.",
            "transactions": transactions
        }

    return {
        "feature": feature,
        "error": f"Feature '{feature}' not implemented",
        "insight_text": "The requested analysis feature is not available."
    }
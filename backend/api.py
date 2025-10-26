from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from pathlib import Path

# Update import to use new function
from boogasi_ai_model.ai_insights import generate_insights, load_learned_patterns
from boogasi_ai_model.ocr_system import BankStatementParser

# Initialize AI components with learned patterns
BASE_DIR = Path(__file__).parent.parent
PATTERNS_FILE = BASE_DIR / "learned_patterns.json"
MODEL_FILE = BASE_DIR / "model_artifacts.json"

# Load patterns at startup
try:
    patterns = load_learned_patterns(PATTERNS_FILE)
    print(f"✅ Loaded {len(patterns.get('merchant_categories', {}))} merchant categories")
    print(f"✅ Loaded {len(patterns.get('category_patterns', {}))} category patterns")
except Exception as e:
    print(f"⚠️ Warning: Could not load patterns: {e}")
    patterns = {"merchant_categories": {}, "category_patterns": {}}

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransactionBase(BaseModel):
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    type: Optional[str] = None

class InsightRequest(BaseModel):
    feature: str
    transactions: List[TransactionBase]

@app.post("/api/insights")
async def get_insights(request: InsightRequest):
    """Generate AI insights for transactions"""
    try:
        # Convert Pydantic models to dicts for ai_insights
        transactions = [dict(t) for t in request.transactions]
        result = generate_insights(transactions, request.feature)
        print(f"🤖 Generated {request.feature} insights for {len(transactions)} transactions")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# NEW: parse uploaded/raw statement then return normalized transactions and optional AI feature
@app.post("/api/parse-and-insights")
async def parse_and_insights(
    feature: Optional[str] = Form(None),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Accepts either:
      - UploadFile (attempt to decode as UTF-8 text), or
      - raw_text (text extracted client-side)
    Returns parsed/normalized transactions and, if `feature` provided, the AI insight JSON.
    """
    try:
        # Get text content
        text = raw_text if raw_text else await file.read().decode("utf-8") if file else None
        if not text:
            raise HTTPException(status_code=400, detail="No content provided")

        # Initialize parser with loaded patterns
        parser = BankStatementParser(
            learned_patterns=patterns,
            model_artifacts=MODEL_FILE
        )
        
        # Parse with pattern matching
        parsed = parser.parse(text)
        
        # Debug log
        print(f"🔍 Parsed {len(parsed.get('formattedTransactions', []))} transactions")
        
        # Get transactions with categories
        txns = parsed.get("formattedTransactions", [])

        # Normalize transactions to ai_insights expected shape
        normalized = []
        for t in txns:
            amount_raw = t.get("amount", 0)
            try:
                amount = float(amount_raw)
            except Exception:
                # try string cleanup
                try:
                    amount = float(str(amount_raw).replace(",", "").replace("₱", "").replace("$", "").strip())
                except Exception:
                    amount = 0.0
            tx_type = t.get("type") or ("expense" if amount < 0 else "income")
            category = t.get("category") or ""
            # If parser has categorization helper use it for missing categories
            if not category and hasattr(parser, "categorize_transaction"):
                try:
                    category = parser.categorize_transaction(t.get("description", "") or "")
                except Exception:
                    category = ""
            normalized.append({
                "date": t.get("date"),
                "description": t.get("description") or "",
                "amount": amount,
                "type": tx_type,
                "category": category or "uncategorized",
                **({ "sourceFile": file.filename } if file is not None else {})
            })

        response = {
            "parsed": parsed,
            "transactions": normalized
        }

        if feature:
            # call ai_insights router with normalized transactions
            ai_result = generate_insights(normalized, feature)
            response["insight_feature"] = feature
            response["insight_result"] = ai_result

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
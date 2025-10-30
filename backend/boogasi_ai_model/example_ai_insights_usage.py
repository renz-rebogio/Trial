import json
from pathlib import Path
import sys
from ai_insights import generate_insights  # added import

# Project root (one level up from this script)
ROOT = Path(__file__).resolve().parent.parent
LABELED_DIR = ROOT / "boogasi_ai_data" / "labeled"
PARSED_DIR = ROOT / "boogasi_ai_data" / "parsed"

def find_json_file(folder: Path) -> Path | None:
    if not folder.exists():
        return None
    files = sorted(folder.glob("*.json"))
    return files[0] if files else None

# prefer labeled, fallback to parsed
file_path = find_json_file(LABELED_DIR) or find_json_file(PARSED_DIR)
if not file_path:
    print("No JSON files found in boogasi_ai_data/labeled or /parsed. Check filenames.", file=sys.stderr)
    sys.exit(1)

print(f"Using file: {file_path.relative_to(ROOT)}")

with open(file_path, 'r', encoding='utf-8') as f:
    parsed = json.load(f)

txns = parsed.get('data', {}).get('transactions', parsed.get('transactions', []))
print(f"Loaded {len(txns)} transactions\n")
for i, t in enumerate(txns, 1):
    print(i, {
        "date": t.get("date"),
        "amount": t.get("amount"),
        "type": t.get("type"),
        "category": t.get("category"),
        "description": (t.get("description") or "")[:60]
    })

# --- ADDED: run AI insights on the loaded transactions ---
features = [
    "expense_summary",
    "cash_flow_forecast",
    "flag_unusual_transactions",
    "weekly_report",
    "combined_insights"
]

print("\n" + "="*60)
print("Running AI insights...")
for feat in features:
    out = generate_insights(txns, feature=feat)
    print("\n" + "-"*60)
    print(f"FEATURE: {feat}")
    print("-"*60)
    print(json.dumps(out, indent=2, ensure_ascii=False))
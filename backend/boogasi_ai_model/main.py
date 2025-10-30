"""
Boogasi Financial Assistant - Complete Workflow
Combines training and OCR processing
"""

import os
from pathlib import Path

# --- ADD THESE LINES ---
BASE_DIR = Path(__file__).resolve().parent.parent  # project root: "Boogasi (New)"
LABELED_DIR = BASE_DIR / 'boogasi_ai_data' / 'labeled'
RAW_DIR = BASE_DIR / 'boogasi_ai_data' / 'raw'
RECEIPTS_DIR = BASE_DIR / 'boogasi_ai_data' / 'receipts'
PARSED_DIR = BASE_DIR / 'boogasi_ai_data' / 'parsed'  # Add this line

# Create required directories if they don't exist
for dir_path in [LABELED_DIR, RAW_DIR, RECEIPTS_DIR, PARSED_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Import your existing trainer
from model_trainer import BoogasiModelTrainer

# Import the new OCR system
from ocr_system import BoogasiOCRSystem


def setup_boogasi():
    """Complete setup workflow for Boogasi."""
    
    print("="*60)
    print("🏦 BOOGASI FINANCIAL ASSISTANT - SETUP")
    print("="*60)
    
    # Step 1: Train on labeled data
    print("\n📚 STEP 1: Training on labeled data...")
    print("-"*60)
    
    trainer = BoogasiModelTrainer(
        labeled_data_dir=str(LABELED_DIR)
    )
    
    # Load labeled statements
    statements = trainer.load_labeled_statements()
    
    if statements:
        trainer.show_training_summary()
        
        # Save learned patterns for OCR system to use
        trainer.save_learned_patterns("learned_patterns.json")
        
        # Save model artifacts
        trainer.save_model_artifacts("model_artifacts.json")
        
        print("\n✅ Training complete!")
    else:
        print("\n⚠️  No labeled data found. OCR will use default categorization rules.")
    
    # Step 2: Initialize OCR system
    print("\n"+"="*60)
    print("🔧 STEP 2: Initializing OCR system...")
    print("-"*60)
    
    ocr_system = BoogasiOCRSystem(
        patterns_file="learned_patterns.json"  # Load learned patterns
    )
    
    print("\n✅ Setup complete! Boogasi is ready to process documents.")
    
    return trainer, ocr_system


def process_new_documents(ocr_system):
    """Process new bank statements and receipts."""
    
    print("\n"+"="*60)
    print("📄 PROCESSING NEW DOCUMENTS")
    print("="*60)
    
    # Process bank statements
    raw_dir = RAW_DIR
    if raw_dir.exists():
        print("\n🏦 Processing bank statements...")
        results = ocr_system.batch_process(
            str(raw_dir), 
            "*.jpg",
            output_dir=str(PARSED_DIR)  # Add output directory parameter
        )
        print(f"\n✅ Processed {len(results)} bank statements")
    
    # Process receipts
    receipts_dir = RECEIPTS_DIR
    if receipts_dir.exists():
        print("\n🧾 Processing receipts...")
        results = ocr_system.batch_process(
            str(receipts_dir), 
            "*.jpg",
            output_dir=str(PARSED_DIR)  # Add output directory parameter
        )
        print(f"\n✅ Processed {len(results)} receipts")


def demo_single_document(ocr_system, file_path: str):
    """Demo: Process a single document and show results."""
    
    print("\n"+"="*60)
    print("🎬 DEMO: Processing Single Document")
    print("="*60)
    
    result = ocr_system.process_document(file_path)
    
    if result['success']:
        print(f"\n📊 Document Type: {result['document_type']}")
        print(f"📅 Processed: {result['processed_at']}")
        
        if result['document_type'] == 'bank_statement':
            data = result['data']
            print(f"\n💳 Account: {data.get('account_info', {}).get('account_number', 'N/A')}")
            print(f"📈 Transactions: {data.get('summary', {}).get('total_transactions', 0)}")
            print(f"💰 Net Change: ₱{data.get('summary', {}).get('net_change', 0):,.2f}")
            
            # Show first 3 transactions
            transactions = data.get('transactions', [])[:3]
            if transactions:
                print("\n📝 Sample Transactions:")
                for txn in transactions:
                    print(f"   • {txn['date']} - {txn['description'][:30]}")
                    print(f"     Amount: ₱{txn['amount']:,.2f} | Category: {txn['category']}")
        
        elif result['document_type'] == 'receipt':
            data = result['data']
            print(f"\n🏪 Merchant: {data.get('merchant_info', {}).get('name', 'N/A')}")
            print(f"📅 Date: {data.get('transaction_info', {}).get('date', 'N/A')}")
            print(f"🛒 Items: {len(data.get('items', []))}")
            print(f"💰 Total: ₱{data.get('totals', {}).get('total', 0):,.2f}")
    else:
        print(f"\n❌ Error: {result.get('error', 'Unknown error')}")


def interactive_menu():
    """Interactive menu for Boogasi operations."""
    
    print("\n"+"="*60)
    print("🏦 BOOGASI FINANCIAL ASSISTANT")
    print("="*60)
    print("\nSelect an option:")
    print("1. Setup (Train + Initialize)")
    print("2. Process New Documents (Batch)")
    print("3. Process Single Document")
    print("4. Demo Analysis")
    print("5. Exit")
    
    return input("\nEnter choice (1-5): ").strip()


if __name__ == "__main__":
    
    # Option 1: Automatic Setup and Processing
    print("="*60)
    print("🚀 BOOGASI - AUTOMATIC MODE")
    print("="*60)
    
    # Setup: Train and initialize
    trainer, ocr_system = setup_boogasi()
    
    # Process any new documents
    process_new_documents(ocr_system)
    
    # Interactive mode
    print("\n"+"="*60)
    print("💡 NEXT STEPS")
    print("="*60)
    print("\n1. Place bank statements in: boogasi_ai_data/raw/")
    print("2. Place receipts in: boogasi_ai_data/receipts/")
    print("3. Run this script again to process them")
    print("\nOr use the functions directly:")
    print("   result = ocr_system.process_document('path/to/file.jpg')")
    
    # Example: Process a specific file
    # demo_single_document(ocr_system, "../boogasi_ai_data/raw/sample_statement.jpg")
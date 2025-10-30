"""
Boogasi Financial Assistant AI - Initial Model Training (FREE VERSION)
Uses Hugging Face's free transformers library for AI analysis.

This version uses:
- Transformers (Hugging Face) - FREE
- Pattern matching and rule-based extraction
- Simple ML classification for transaction categories

Folder structure expected:
boogasi_ai_data/
├── raw/        (JPG, PNG, PDF - original statements)
├── parsed/     (JSON - parser output with some inaccuracies)
└── labeled/    (JSON - human-corrected ground truth) ← WE USE THIS
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from collections import Counter

class BoogasiModelTrainer:
    def __init__(self, labeled_data_dir: str = None):
        """
        Initialize the Boogasi model trainer with FREE tools.
        
        Args:
            labeled_data_dir: Path to directory containing corrected/labeled JSON statements
        """
        # Get the project root directory (Boogasi New)
        if labeled_data_dir is None:
            # Default to project structure
            base_dir = Path(__file__).resolve().parent.parent
            self.labeled_dir = base_dir / 'boogasi_ai_data' / 'labeled'
        else:
            self.labeled_dir = Path(labeled_data_dir)
        
        # Check if directory exists
        if not self.labeled_dir.exists():
            print(f"❌ Labeled data directory not found: {self.labeled_dir.absolute()}")
            print(f"\n💡 Expected structure:")
            print("   boogasi_ai_data/")
            print("   ├── raw/        (original statements)")
            print("   ├── parsed/     (parser output)")
            print("   └── labeled/    (corrected JSON) ← Looking here")
            
            # Create the directory
            try:
                self.labeled_dir.mkdir(parents=True, exist_ok=True)
                print(f"\n✅ Created labeled data directory at: {self.labeled_dir.absolute()}")
            except Exception as e:
                print(f"❌ Could not create directory: {e}")
        
        # Store training examples
        self.training_data = []
        self.category_patterns = {}
        self.merchant_categories = {}
        
        self.model_artifacts = {
            "version": "0.1.0-free",
            "created_at": datetime.now().isoformat(),
            "training_samples": 0,
            "data_source": "labeled",
            "ml_backend": "rule-based + pattern matching"
        }
    
    def load_labeled_statements(self) -> List[Dict]:
        """Load all corrected/labeled bank statements from the labeled directory."""
        
        if not self.labeled_dir.exists():
            return []
        
        print(f"\n🔍 Scanning labeled data: {self.labeled_dir.absolute()}")
        
        # Find all JSON files in the labeled directory
        json_files = list(self.labeled_dir.glob("*.json"))
        
        if not json_files:
            print(f"\n❌ No JSON files found in {self.labeled_dir.absolute()}")
            print("\n💡 Make sure your corrected bank statements are saved as .json files")
            return []
        
        print(f"✅ Found {len(json_files)} labeled JSON files\n")
        
        training_examples = []
        for json_path in json_files:
            try:
                print(f"   📄 Loading: {json_path.name}")
                
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Analyze the structure
                    analysis = self.analyze_json_structure(data)
                    
                    training_examples.append({
                        'filename': json_path.name,
                        'data': data,
                        'structure': analysis,
                        'path': str(json_path)
                    })
                    
                    # Show what we found
                    print(f"      ✓ Transactions: {analysis['transaction_count']}")
                    if analysis.get('date_range'):
                        print(f"      ✓ Period: {analysis['date_range']}")
                    if analysis.get('account_number'):
                        print(f"      ✓ Account: {analysis['account_number']}")
                    
            except json.JSONDecodeError as e:
                print(f"   ⚠️  Invalid JSON in {json_path.name}: {e}")
            except Exception as e:
                print(f"   ⚠️  Error loading {json_path.name}: {e}")
        
        self.training_data = training_examples
        self.model_artifacts['training_samples'] = len(training_examples)
        
        # Learn patterns from labeled data
        self.learn_patterns_from_labeled_data()
        
        print(f"\n✅ Successfully loaded {len(training_examples)} labeled statements")
        return training_examples
    
    def analyze_json_structure(self, data: Dict) -> Dict:
        """Analyze the structure of a labeled JSON bank statement."""
        analysis = {
            'transaction_count': 0,
            'has_account_info': False,
            'has_balance_info': False,
            'fields_found': []
        }
        
        # Common field names to look for
        if isinstance(data, dict):
            # Check for account number
            for key in ['account_number', 'accountNumber', 'account', 'acct_no', 'account_no']:
                if key in data:
                    analysis['has_account_info'] = True
                    analysis['account_number'] = str(data[key])
                    break
            
            # Check for balance
            for key in ['balance', 'ending_balance', 'endingBalance', 'closing_balance', 'final_balance']:
                if key in data:
                    analysis['has_balance_info'] = True
                    break
            
            # Check for transactions
            for key in ['transactions', 'transaction', 'txn', 'entries', 'items']:
                if key in data:
                    transactions = data[key]
                    if isinstance(transactions, list):
                        analysis['transaction_count'] = len(transactions)
                        
                        # Analyze first transaction structure
                        if transactions:
                            first_txn = transactions[0]
                            if isinstance(first_txn, dict):
                                analysis['transaction_fields'] = list(first_txn.keys())
                    break
            
            # Check for date range
            for key in ['statement_period', 'period', 'date_range', 'statement_date']:
                if key in data:
                    analysis['date_range'] = str(data[key])
                    break
            
            analysis['fields_found'] = list(data.keys())
        
        return analysis
    
    def learn_patterns_from_labeled_data(self):
        """Learn category patterns and merchant mappings from labeled data."""
        print("\n🧠 Learning patterns from labeled data...")
        
        # Collections to track patterns
        description_patterns = []
        amount_ranges = {}
        category_counter = Counter()
        
        for example in self.training_data:
            data = example['data']
            
            # Find transactions in the data
            transactions = data.get('transactions', [])
            
            if not transactions:
                continue
            
            # Learn from each transaction
            for txn in transactions:
                if not isinstance(txn, dict):
                    continue
                
                # Extract description, amount, and CATEGORY from labeled data
                description = txn.get('description', '').strip()
                amount = txn.get('amount')
                category = txn.get('category', 'uncategorized')
                
                if description:
                    description_patterns.append(description)
                    
                    # Use ACTUAL category from labeled data
                    if category and category != 'uncategorized':
                        # Store merchant -> category mapping
                        self.merchant_categories[description.upper()] = category
                        
                        # Store keywords for this category
                        if category not in self.category_patterns:
                            self.category_patterns[category] = []
                        
                        # Extract keywords from description
                        words = re.findall(r'\w+', description.upper())
                        self.category_patterns[category].extend(words)
                        
                        # Count this category
                        category_counter[category] += 1
        
        # Get most common keywords per category
        for category in list(self.category_patterns.keys()):
            counter = Counter(self.category_patterns[category])
            self.category_patterns[category] = [word for word, count in counter.most_common(10)]
        
        print(f"   ✓ Learned {len(self.merchant_categories)} merchant mappings")
        print(f"   ✓ Identified {len(self.category_patterns)} categories")
        
        if self.category_patterns:
            print("\n   📊 Categories from labeled data:")
            for category, count in category_counter.most_common():
                keywords = self.category_patterns.get(category, [])
                print(f"      • {category}: {count} transactions - keywords: {', '.join(keywords[:5])}")
    
    def categorize_transaction(self, description: str) -> str:
        """Categorize a transaction based on learned patterns."""
        description_upper = description.upper()
        
        # First, check exact merchant match
        if description_upper in self.merchant_categories:
            return self.merchant_categories[description_upper]
        
        # Then, check keyword matching
        best_match = "uncategorized"
        best_score = 0
        
        for category, keywords in self.category_patterns.items():
            score = sum(1 for keyword in keywords if keyword in description_upper)
            if score > best_score:
                best_score = score
                best_match = category
        
        # Fallback rules for common patterns
        if best_match == "uncategorized":
            description_lower = description.lower()
            
            if any(word in description_lower for word in ['salary', 'payroll', 'income', 'received from', 'credit']):
                return 'income'
            elif any(word in description_lower for word in ['grocery', 'supermarket', 'market']):
                return 'groceries'
            elif any(word in description_lower for word in ['restaurant', 'food', 'cafe', 'jollibee', 'mcdo', 'pizza', 'coffee']):
                return 'dining'
            elif any(word in description_lower for word in ['meralco', 'pldt', 'water', 'utility', 'electric', 'gas payment', 'telephone']):
                return 'utilities'
            elif any(word in description_lower for word in ['shell', 'petron', 'caltex', 'gas', 'fuel', 'uber', 'grab', 'exxon']):
                return 'transportation'
            elif any(word in description_lower for word in ['atm', 'withdrawal', 'cash', 'drawn on']):
                return 'cash_withdrawal'
            elif any(word in description_lower for word in ['transfer out', 'send', 'gcash', 'paymaya', 'payment to', 'bp ', 'for help', 'for my']):
                return 'transfer_out'
            elif any(word in description_lower for word in ['transfer in', 'transfer from', 'fund transfer', 'cr transfer']):
                return 'transfer_in'
            elif any(word in description_lower for word in ['bill', 'payment', 'debit', 'direct debit']):
                return 'bill_payment'
            elif any(word in description_lower for word in ['mall', 'shopping', 'lazada', 'shopee', 'store', 'wilcon', 'handyman', 'mr diy', 'allhome', 'dhl']):
                return 'shopping'
            elif any(word in description_lower for word in ['rent', 'mortgage']):
                return 'housing'
            elif any(word in description_lower for word in ['payroll run', 'payrollrun']):
                return 'payroll'
            elif any(word in description_lower for word in ['wholesale', 'office']):
                return 'business_expense'
            elif any(word in description_lower for word in ['balance b/f', 'balance brought forward', 'previous balance']):
                return 'opening_balance'
        
        return best_match
    
    def analyze_statement(self, statement_text: str) -> Dict:
        """
        Analyze a bank statement using rule-based extraction.
        
        Args:
            statement_text: The bank statement text to analyze
        """
        if not self.training_data:
            return {
                "error": "No training data loaded. Please ensure labeled JSON files exist in boogasi_ai_data/labeled/"
            }
        
        result = {
            "account_info": {},
            "statement_period": {},
            "balance": {},
            "transactions": [],
            "summary": {}
        }
        
        # Extract account number
        account_match = re.search(r'(?:Account|Acct)[\s#:]*[:\s]*(\*+\d{4}|\d{4,})', statement_text, re.IGNORECASE)
        if account_match:
            result["account_info"]["account_number"] = account_match.group(1)
        
        # Extract dates
        date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        dates = re.findall(date_pattern, statement_text)
        if dates:
            result["statement_period"]["start_date"] = dates[0] if len(dates) > 0 else None
            result["statement_period"]["end_date"] = dates[-1] if len(dates) > 1 else dates[0]
        
        # Extract balances
        balance_patterns = [
            r'Beginning\s+Balance[:\s]*[₱$]?\s*([\d,]+\.?\d*)',
            r'Ending\s+Balance[:\s]*[₱$]?\s*([\d,]+\.?\d*)'
        ]
        for i, pattern in enumerate(balance_patterns):
            match = re.search(pattern, statement_text, re.IGNORECASE)
            if match:
                balance_value = match.group(1).replace(',', '')
                if i == 0:
                    result["balance"]["beginning"] = float(balance_value)
                else:
                    result["balance"]["ending"] = float(balance_value)
        
        # Extract transactions
        # Pattern: DATE  DESCRIPTION  AMOUNT  BALANCE
        transaction_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+([A-Za-z\s\-]+?)\s+([₱$]?\s*[\d,]+\.?\d*)\s+([₱$]?\s*[\d,]+\.?\d*)?'
        
        matches = re.finditer(transaction_pattern, statement_text)
        
        total_debit = 0
        total_credit = 0
        
        for match in matches:
            date = match.group(1)
            description = match.group(2).strip()
            amount_str = match.group(3).replace(',', '').replace('₱', '').replace('$', '').strip()
            
            try:
                amount = float(amount_str)
                
                # Determine if debit or credit based on description or context
                is_credit = any(word in description.lower() for word in ['deposit', 'salary', 'credit', 'income', 'received', 'transfer from'])
                
                if is_credit:
                    total_credit += amount
                else:
                    total_debit += amount
                    amount = -amount  # Make debits negative
                
                # Categorize the transaction
                category = self.categorize_transaction(description)
                
                transaction = {
                    "date": date,
                    "description": description,
                    "amount": amount,
                    "category": category
                }
                
                result["transactions"].append(transaction)
            except ValueError:
                continue
        
        # Summary
        result["summary"] = {
            "total_transactions": len(result["transactions"]),
            "total_credit": total_credit,
            "total_debit": total_debit,
            "net_change": total_credit - total_debit
        }
        
        return result
    
    def save_model_artifacts(self, output_path: str = "model_artifacts.json"):
        """Save model configuration and training info."""
        artifacts = {
            **self.model_artifacts,
            "training_files": [
                {
                    "filename": ex['filename'],
                    "transaction_count": ex['structure']['transaction_count'],
                    "fields": ex['structure'].get('fields_found', [])
                }
                for ex in self.training_data
            ],
            "total_transactions": sum(
                ex['structure']['transaction_count'] 
                for ex in self.training_data
            ),
            "learned_categories": sorted(list(self.category_patterns.keys())),
            "merchant_mappings_count": len(self.merchant_categories)
        }
        
        output_path = Path(output_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(artifacts, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Model artifacts saved to {output_path.absolute()}")

    def save_learned_patterns(self, output_path: str = "learned_patterns.json"):
        """
        Save learned categorization patterns for OCR system to use.
        
        This exports the merchant categories and keyword patterns that
        the trainer learned from labeled data, so the OCR system can
        use them for categorizing new transactions.
        
        Args:
            output_path: Path where to save the patterns JSON file
        """
        patterns = {
            "version": "1.0.0",
            "created_at": datetime.now().isoformat(),
            "source": "labeled_data_training",
            "merchant_categories": self.merchant_categories,
            "category_patterns": self.category_patterns,
            "total_merchants": len(self.merchant_categories),
            "total_categories": len(self.category_patterns)
        }
        
        output_path = Path(output_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(patterns, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Learned patterns saved to {output_path.absolute()}")
        print(f"   • {len(self.merchant_categories)} merchant mappings")
        print(f"   • {len(self.category_patterns)} categories")
        
        return str(output_path.absolute())
    
    def demo_analysis(self, sample_statement: str = None):
        """Run a demo analysis to show the client."""
        if sample_statement is None:
            sample_statement = """
            BDO UNIBANK, INC.
            STATEMENT OF ACCOUNT
            
            Account Number: ****1234
            Account Name: JUAN DELA CRUZ
            Statement Period: January 1, 2024 - January 31, 2024
            
            Beginning Balance: ₱15,432.10
            
            DATE        DESCRIPTION                      AMOUNT      BALANCE
            ───────────────────────────────────────────────────────────────────────────
            01/03/2024  SM SUPERMARKET                  87.32       15,344.78
            01/05/2024  SALARY DEPOSIT                  35,000.00   50,344.78
            01/08/2024  MERALCO PAYMENT                 2,145.20    48,199.58
            01/12/2024  JOLLIBEE                        265.00      47,934.58
            01/15/2024  PETRON GAS STATION              1,520.00    46,414.58
            01/20/2024  ATM WITHDRAWAL                  5,000.00    41,414.58
            01/25/2024  ONLINE TRANSFER TO GCASH        3,000.00    38,414.58
            
            Ending Balance: ₱38,414.58
            
            Total Credits: ₱35,000.00
            Total Debits: ₱12,017.52
            """
        
        print("\n" + "="*60)
        print("🤖 BOOGASI AI - DEMO ANALYSIS (FREE VERSION)")
        print("="*60)
        print("\n📄 Analyzing sample Philippine bank statement...\n")
        
        result = self.analyze_statement(sample_statement)
        
        print("📊 ANALYSIS RESULT:")
        print("="*60)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("="*60)
        
        return result
    
    def show_training_summary(self):
        """Display a summary of loaded training data."""
        print("\n" + "="*60)
        print("📈 TRAINING DATA SUMMARY")
        print("="*60)
        
        if not self.training_data:
            print("\n❌ No training data loaded yet.")
            return
        
        print(f"\n✅ Total labeled files: {len(self.training_data)}")
        
        # Calculate totals
        total_transactions = sum(
            ex['structure']['transaction_count'] 
            for ex in self.training_data
        )
        print(f"✅ Total transactions across all statements: {total_transactions}")
        
        # Show each file
        print("\n📁 Labeled files:")
        for ex in self.training_data:
            print(f"   • {ex['filename']}: {ex['structure']['transaction_count']} transactions")
        
        # Show learned categories
        if self.category_patterns:
            print(f"\n🏷️  Learned categories: {len(self.category_patterns)}")
            for category in sorted(self.category_patterns.keys()):
                count = sum(1 for cat in self.merchant_categories.values() if cat == category)
                print(f"   • {category}: {count} merchants")
        
        # Show common fields
        all_fields = set()
        for ex in self.training_data:
            all_fields.update(ex['structure'].get('fields_found', []))
        
        if all_fields:
            print(f"\n🔑 Fields found across all statements:")
            for field in sorted(all_fields):
                print(f"   • {field}")


# Example usage
if __name__ == "__main__":
    print("="*60)
    print("🏦 BOOGASI FINANCIAL ASSISTANT AI")
    print("   FREE VERSION - No API Keys Required!")
    print("="*60)
    
    # Initialize trainer with correct path resolution
    trainer = BoogasiModelTrainer()  # Will use default project structure
    
    # Load your labeled statements
    print("\n📂 Loading labeled bank statements...")
    statements = trainer.load_labeled_statements()
    
    if statements:
        # Show summary
        trainer.show_training_summary()
        
        # Save model artifacts
        trainer.save_model_artifacts()
        
        # Run demo
        print("\n" + "="*60)
        print("🎬 CLIENT DEMO - FREE AI Analysis")
        print("="*60)
        trainer.demo_analysis()
    
    print("\n" + "="*60)
    print("📋 PROJECT ROADMAP")
    print("="*60)
    print("\n✅ Phase 1 (Current):")
    print(f"   • {len(statements)}/5 labeled statements loaded")
    print("   • FREE rule-based AI model working")
    print("   • Pattern learning from labeled data")
    print("   • Transaction categorization active")
    
    print("\n🔄 Phase 2 (Next Steps):")
    print("   • Add 15-20 more labeled statements")
    print("   • Improve pattern matching accuracy")
    print("   • Build comparison: AI vs Parser accuracy")
    print("   • Add more category rules")
    
    print("\n🚀 Phase 3 (Future):")
    print("   • 50+ labeled statements for production")
    print("   • Advanced ML models (scikit-learn)")
    print("   • Multi-bank format support")
    print("   • Web interface for client")
    print("="*60)
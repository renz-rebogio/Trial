"""
Boogasi Financial Assistant AI - OCR System with Tesseract
Integrates Tesseract OCR for extracting text from bank statements and receipts.

Installation required:
pip install pytesseract pillow pdf2image

For Tesseract engine:
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
- Mac: brew install tesseract
- Linux: sudo apt-get install tesseract-ocr

Folder structure:
boogasi_ai_data/
├── raw/            (JPG, PNG, PDF - original documents)
├── receipts/       (JPG, PNG - receipt images)
├── parsed/         (JSON - OCR output)
└── labeled/        (JSON - human-corrected ground truth)
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from collections import Counter

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️  Warning: pytesseract not installed. OCR features disabled.")
    print("   Install with: pip install pytesseract pillow pdf2image")

try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("⚠️  Warning: pdf2image not installed. PDF support disabled.")


class TesseractOCR:
    """Handles OCR extraction using Tesseract for all document types."""
    
    def __init__(self, tesseract_path: Optional[str] = None):
        """
        Initialize Tesseract OCR.
        
        Args:
            tesseract_path: Path to tesseract executable (optional)
                           If not provided, will try to find it automatically
        """
        if not TESSERACT_AVAILABLE:
            raise ImportError("pytesseract not installed. Run: pip install pytesseract pillow")
        
        # Auto-detect tesseract path if not provided
        if tesseract_path is None:
            tesseract_path = self._find_tesseract()
        
        # Set tesseract path if found
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            print(f"📍 Using Tesseract at: {tesseract_path}")
        
        # Test if tesseract is accessible
        try:
            version = pytesseract.get_tesseract_version()
            print(f"✅ Tesseract OCR ready (v{version})")
        except Exception as e:
            print(f"❌ Tesseract not found: {e}")
            print("   Please install Tesseract OCR engine")
            print("   Windows: https://github.com/UB-Mannheim/tesseract/wiki")
            print("   Mac: brew install tesseract")
            print("   Linux: sudo apt-get install tesseract-ocr")
            raise
    
    def _find_tesseract(self) -> Optional[str]:
        """
        Auto-detect Tesseract installation path.
        Checks environment variables and common installation locations.
        """
        import platform
        import shutil
        
        # Check if tesseract is in PATH
        tesseract_cmd = shutil.which('tesseract')
        if tesseract_cmd:
            return tesseract_cmd
        
        # Check environment variable
        env_path = os.environ.get('TESSERACT_PATH')
        if env_path and os.path.exists(env_path):
            return env_path
        
        # Platform-specific common paths
        system = platform.system()
        
        if system == 'Windows':
            common_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
                os.path.join(os.environ.get('LOCALAPPDATA', ''), 
                           'Programs', 'Tesseract-OCR', 'tesseract.exe'),
            ]
        elif system == 'Darwin':  # macOS
            common_paths = [
                '/usr/local/bin/tesseract',
                '/opt/homebrew/bin/tesseract',
            ]
        else:  # Linux
            common_paths = [
                '/usr/bin/tesseract',
                '/usr/local/bin/tesseract',
            ]
        
        # Check each common path
        for path in common_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    def extract_from_image(self, image_path: str, lang: str = 'eng') -> str:
        """
        Extract text from an image file using Tesseract.
        
        Args:
            image_path: Path to image file (JPG, PNG)
            lang: Language code (default: 'eng' for English)
        
        Returns:
            Extracted text as string
        """
        try:
            image = Image.open(image_path)
            
            # Optional: Preprocess image for better OCR
            # image = image.convert('L')  # Convert to grayscale
            
            text = pytesseract.image_to_string(image, lang=lang)
            return text.strip()
        except Exception as e:
            print(f"❌ Error extracting from image: {e}")
            return ""
    
    def extract_from_pdf(self, pdf_path: str, lang: str = 'eng') -> str:
        """
        Extract text from PDF by converting pages to images.
        
        Args:
            pdf_path: Path to PDF file
            lang: Language code (default: 'eng' for English)
        
        Returns:
            Extracted text from all pages
        """
        if not PDF_SUPPORT:
            raise ImportError("pdf2image not installed. Run: pip install pdf2image")
        
        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path)
            
            full_text = ""
            for i, image in enumerate(images, 1):
                print(f"      Processing page {i}/{len(images)}...")
                page_text = pytesseract.image_to_string(image, lang=lang)
                full_text += page_text + "\n\n--- PAGE BREAK ---\n\n"
            
            return full_text.strip()
        except Exception as e:
            print(f"❌ Error extracting from PDF: {e}")
            return ""
    
    def process_document(self, file_path: str, lang: str = 'eng') -> Dict:
        """
        Process any supported document type.
        
        Args:
            file_path: Path to document file
            lang: Language code
        
        Returns:
            Dictionary with extracted text and metadata
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            return {
                "success": False,
                "error": f"File not found: {file_path}",
                "text": ""
            }
        
        ext = file_path.suffix.lower()
        
        print(f"\n📄 Processing: {file_path.name}")
        print(f"   Type: {ext}")
        
        if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
            text = self.extract_from_image(str(file_path), lang)
            doc_type = "image"
        elif ext == '.pdf':
            text = self.extract_from_pdf(str(file_path), lang)
            doc_type = "pdf"
        else:
            return {
                "success": False,
                "error": f"Unsupported file type: {ext}",
                "text": ""
            }
        
        return {
            "success": True,
            "filename": file_path.name,
            "file_type": doc_type,
            "extension": ext,
            "text": text,
            "char_count": len(text),
            "processed_at": datetime.now().isoformat()
        }


class DocumentClassifier:
    """Classifies documents as bank statements or receipts."""
    
    def __init__(self):
        # Keywords that indicate bank statements
        self.bank_keywords = [
            'statement', 'account', 'balance', 'bank', 'beginning balance',
            'ending balance', 'deposits', 'withdrawals', 'statement period',
            'account number', 'previous balance', 'current balance'
        ]
        
        # Keywords that indicate receipts
        self.receipt_keywords = [
            'receipt', 'total', 'subtotal', 'tax', 'change', 'cash',
            'thank you', 'items', 'qty', 'price', 'amount due',
            'paid', 'customer copy', 'merchant copy'
        ]
    
    def classify(self, text: str) -> str:
        """
        Classify document as 'bank_statement' or 'receipt'.
        
        Args:
            text: Extracted text from document
        
        Returns:
            'bank_statement', 'receipt', or 'unknown'
        """
        if not text:
            return 'unknown'
        text_lower = text.lower()
        
        bank_score = sum(1 for keyword in self.bank_keywords if keyword in text_lower)
        receipt_score = sum(1 for keyword in self.receipt_keywords if keyword in text_lower)
        
        # Heuristic: receipts often contain 'total' and multiple currency-looking values
        currency_amounts = len([m for m in re.findall(r'[₱$]\s*[\d,]+\.\d{2}', text)])
        currency_like_numbers = len([m for m in re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b', text)])
        receipt_density = receipt_score + (1 if 'total' in text_lower else 0) + (1 if currency_amounts >= 1 else 0)
        
        # Lower thresholds for receipts (they are shorter and noisier)
        if receipt_density >= 2 or (receipt_score >= 2 and receipt_score > bank_score):
            return 'receipt'
        if bank_score >= 2 and bank_score > receipt_score:
            return 'bank_statement'
        
        # Additional fallback: if many currency-like numbers but no long-run 'statement' keywords,
        # treat as receipt (common for printed receipts)
        if currency_like_numbers >= 2 and 'statement' not in text_lower and receipt_score >= 1:
            return 'receipt'
        
        return 'unknown'


class BankStatementParser:
    """Parses bank statements from extracted text."""
    
    def __init__(self):
        self.merchant_categories = {}
        self.category_patterns = {}
    
    def load_learned_patterns(self, patterns_file: str):
        """Load previously learned categorization patterns."""
        try:
            with open(patterns_file, 'r') as f:
                data = json.load(f)
                self.merchant_categories = data.get('merchant_categories', {})
                self.category_patterns = data.get('category_patterns', {})
            print(f"✅ Loaded {len(self.merchant_categories)} merchant patterns")
        except FileNotFoundError:
            print("ℹ️  No saved patterns found, using default rules")
    
    def categorize_transaction(self, description: str) -> str:
        """Categorize a transaction based on learned patterns."""
        description_upper = description.upper()
        
        # Check exact merchant match
        if description_upper in self.merchant_categories:
            return self.merchant_categories[description_upper]
        
        # Check keyword matching
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
            elif any(word in description_lower for word in ['meralco', 'pldt', 'water', 'utility', 'electric', 'gas payment']):
                return 'utilities'
            elif any(word in description_lower for word in ['shell', 'petron', 'caltex', 'gas', 'fuel', 'uber', 'grab']):
                return 'transportation'
            elif any(word in description_lower for word in ['atm', 'withdrawal', 'cash']):
                return 'cash_withdrawal'
            elif any(word in description_lower for word in ['transfer out', 'send', 'gcash', 'paymaya']):
                return 'transfer_out'
            elif any(word in description_lower for word in ['transfer in', 'transfer from', 'fund transfer']):
                return 'transfer_in'
            elif any(word in description_lower for word in ['bill', 'payment', 'debit']):
                return 'bill_payment'
            elif any(word in description_lower for word in ['mall', 'shopping', 'lazada', 'shopee', 'store']):
                return 'shopping'
        
        return best_match
    
    def parse(self, text: str) -> Dict:
        """Parse bank statement text into structured data."""
        result = {
            "account_info": {},
            "statement_period": {},
            "balance": {},
            "transactions": [],
            "summary": {}
        }
        
        # Extract account number
        account_patterns = [
            r'Account\s+(?:Number|No\.?)[:\s]*(\*+\d{4}|\d{4,})',
            r'Acct\s+(?:#|No\.?)[:\s]*(\*+\d{4}|\d{4,})',
        ]
        for pattern in account_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                result["account_info"]["account_number"] = match.group(1)
                break
        
        # Extract statement period
        date_range_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*[-–to]+\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
        match = re.search(date_range_pattern, text)
        if match:
            result["statement_period"]["start_date"] = match.group(1)
            result["statement_period"]["end_date"] = match.group(2)
        
        # Extract balances
        balance_patterns = {
            'beginning': r'(?:Beginning|Previous|Opening)\s+Balance[:\s]*[₱$]?\s*([\d,]+\.?\d*)',
            'ending': r'(?:Ending|Closing|Current)\s+Balance[:\s]*[₱$]?\s*([\d,]+\.?\d*)'
        }
        
        for balance_type, pattern in balance_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(',', ''))
                result["balance"][balance_type] = value
        
        # Extract transactions
        txn_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]?\d{0,4})\s+([A-Za-z0-9\s\-/\.]+?)\s+([₱$]?\s*[\d,]+\.?\d{2})'
        
        matches = re.finditer(txn_pattern, text)
        
        total_credit = 0
        total_debit = 0
        
        for match in matches:
            date = match.group(1)
            description = match.group(2).strip()
            amount_str = match.group(3).replace(',', '').replace('₱', '').replace('$', '').strip()
            
            # Skip if description is too short or looks like a header
            if len(description) < 3 or description.upper() in ['DATE', 'DESCRIPTION', 'AMOUNT', 'BALANCE']:
                continue
            
            try:
                amount = float(amount_str)
                
                # Determine if credit or debit
                is_credit = any(word in description.lower() for word in 
                    ['deposit', 'salary', 'credit', 'income', 'received', 'transfer from'])
                
                if is_credit:
                    total_credit += amount
                else:
                    total_debit += amount
                    amount = -amount
                
                category = self.categorize_transaction(description)
                
                result["transactions"].append({
                    "date": date,
                    "description": description,
                    "amount": amount,
                    "category": category
                })
            except ValueError:
                continue
        
        # Summary
        result["summary"] = {
            "total_transactions": len(result["transactions"]),
            "total_credit": round(total_credit, 2),
            "total_debit": round(total_debit, 2),
            "net_change": round(total_credit - total_debit, 2)
        }
        
        return result


class ReceiptParser:
    """Parses receipts from extracted text."""
    
    def parse(self, text: str) -> Dict:
        """Parse receipt text into structured data."""
        result = {
            "merchant_info": {},
            "transaction_info": {},
            "items": [],
            "totals": {}
        }
        
        lines = text.split('\n')
        
        # Extract merchant name (usually first few lines)
        merchant_name = None
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 3 and not any(char.isdigit() for char in line[:10]):
                merchant_name = line
                break
        
        if merchant_name:
            result["merchant_info"]["name"] = merchant_name
        
        # Extract date
        date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
        for line in lines:
            match = re.search(date_pattern, line)
            if match:
                result["transaction_info"]["date"] = match.group(1)
                break
        
        # Extract time
        time_pattern = r'(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)'
        for line in lines:
            match = re.search(time_pattern, line, re.IGNORECASE)
            if match:
                result["transaction_info"]["time"] = match.group(1)
                break
        
        # Extract items (line with description and price)
        item_pattern = r'(.+?)\s+([₱$]?\s*[\d,]+\.?\d{2})'
        
        for line in lines:
            # Skip header lines and total lines
            if any(keyword in line.lower() for keyword in ['subtotal', 'total', 'tax', 'change', 'cash', 'tender']):
                continue
            
            match = re.search(item_pattern, line)
            if match:
                description = match.group(1).strip()
                price_str = match.group(2).replace(',', '').replace('₱', '').replace('$', '').strip()
                
                # Skip if description is too short or looks like metadata
                if len(description) < 2:
                    continue
                
                try:
                    price = float(price_str)
                    if price > 0:
                        result["items"].append({
                            "description": description,
                            "price": price
                        })
                except ValueError:
                    continue
        
        # Extract totals
        total_patterns = {
            'subtotal': r'(?:Sub\s*)?Total[:\s]*[₱$]?\s*([\d,]+\.?\d{2})',
            'tax': r'Tax[:\s]*[₱$]?\s*([\d,]+\.?\d{2})',
            'total': r'(?:Grand\s*)?Total[:\s]*[₱$]?\s*([\d,]+\.?\d{2})',
        }
        
        for total_type, pattern in total_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1).replace(',', ''))
                result["totals"][total_type] = value
        
        return result


class BoogasiOCRSystem:
    """Main OCR system integrating all components."""
    
    def __init__(self, tesseract_path: Optional[str] = None, patterns_file: str = "learned_patterns.json"):
        """
        Initialize the complete Boogasi OCR system.
        
        Args:
            tesseract_path: Path to tesseract executable (Windows)
            patterns_file: Path to learned patterns JSON file from trainer
        """
        # Get project root directory
        self.base_dir = Path(__file__).resolve().parent.parent
        self.data_dir = self.base_dir / 'boogasi_ai_data'
        
        # Ensure directories exist
        for subdir in ['raw', 'receipts', 'parsed', 'labeled']:
            (self.data_dir / subdir).mkdir(parents=True, exist_ok=True)
        
        self.ocr = TesseractOCR(tesseract_path)
        self.classifier = DocumentClassifier()
        self.bank_parser = BankStatementParser()
        self.receipt_parser = ReceiptParser()
        
        # Use absolute path for patterns file
        patterns_path = self.base_dir / patterns_file
        if patterns_path.exists():
            self.bank_parser.load_learned_patterns(str(patterns_path))
            print(f"✅ Loaded learned patterns from {patterns_file}")
        else:
            print(f"ℹ️  No learned patterns found at {patterns_file}, using default rules")
        
        print("\n" + "="*60)
        print("🚀 BOOGASI OCR SYSTEM INITIALIZED")
        print("="*60)
    
    def process_document(self, file_path: str, save_output: bool = True) -> Dict:
        """
        Process any financial document (bank statement or receipt).
        
        Args:
            file_path: Path to document file
            save_output: Whether to save parsed JSON
        
        Returns:
            Parsed document data
        """
        # Step 1: Extract text with OCR
        ocr_result = self.ocr.process_document(file_path)
        
        if not ocr_result['success']:
            return ocr_result
        
        text = ocr_result['text']
        print(f"   ✓ Extracted {ocr_result['char_count']} characters")
        
        # Step 2: Classify document type
        doc_type = self.classifier.classify(text)
        print(f"   ✓ Detected: {doc_type}")
        
        # Step 3: Parse based on document type
        if doc_type == 'bank_statement':
            parsed_data = self.bank_parser.parse(text)
            parsed_data['document_type'] = 'bank_statement'
        elif doc_type == 'receipt':
            parsed_data = self.receipt_parser.parse(text)
            parsed_data['document_type'] = 'receipt'
        else:
            return {
                "success": False,
                "error": "Could not determine document type",
                "raw_text": text
            }
        
        # Add metadata
        result = {
            "success": True,
            "filename": ocr_result['filename'],
            "document_type": doc_type,
            "processed_at": ocr_result['processed_at'],
            "data": parsed_data
        }
        
        # Save output
        if save_output:
            output_dir = self.data_dir / 'parsed'
            output_dir.mkdir(parents=True, exist_ok=True)
            
            output_filename = Path(file_path).stem + "_parsed.json"
            output_path = output_dir / output_filename
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            
            print(f"   ✓ Saved to: {output_path.relative_to(self.base_dir)}")
        
        return result
    
    def batch_process(self, directory: str, pattern: str = "*.jpg", output_dir: str = None) -> List[Dict]:
        """Process all matching files in directory."""
        results = []
        directory = Path(directory)
        if output_dir:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
        
        # Support multiple common extensions when user supplies a single pattern like "*.jpg"
        files = []
        if pattern == "*.jpg":
            exts = ["*.jpg", "*.jpeg", "*.png", "*.pdf", "*.tiff", "*.bmp"]
            for p in exts:
                files.extend(list(directory.glob(p)))
        else:
            files = list(directory.glob(pattern))
        
        print(f"\n📂 Batch processing {len(files)} files from {directory}")
        
        for file_path in files:
            print(f"\n📄 Processing: {file_path.name}")
            print(f"   Type: {file_path.suffix}")
            
            result = self.process_document(str(file_path))
            
            if result.get('success') and output_dir:
                # Save parsed result to output directory
                output_path = output_dir / f"{file_path.stem}_parsed.json"
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                print(f"   ✓ Saved to: {output_path.relative_to(output_dir.parent)}")
            
            results.append(result)
            
        return results


# Demo usage
if __name__ == "__main__":
    print("="*60)
    print("🏦 BOOGASI FINANCIAL ASSISTANT - TESSERACT OCR")
    print("="*60)
    
    # Initialize system
    # For Windows, uncomment and set your tesseract path:
    # system = BoogasiOCRSystem(tesseract_path=r'C:\Program Files\Tesseract-OCR\tesseract.exe')
    
    system = BoogasiOCRSystem()
    
    print("\n📋 USAGE EXAMPLES:")
    print("="*60)
    print("\n1. Process single document:")
    print("   result = system.process_document('boogasi_ai_data/raw/statement.jpg')")
    
    print("\n2. Batch process all documents:")
    print("   results = system.batch_process('boogasi_ai_data/raw', '*.jpg')")
    
    print("\n3. Process receipt:")
    print("   result = system.process_document('boogasi_ai_data/receipts/receipt.png')")
    
    print("\n" + "="*60)
    print("✅ System ready! Place your documents in:")
    print(f"   • {system.data_dir}/raw/ (bank statements)")
    print(f"   • {system.data_dir}/receipts/ (receipts)")
    print("="*60)
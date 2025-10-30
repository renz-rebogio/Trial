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
        
        # Strong bank signals: explicit "statement", account masks (****1234), or "acct"/"account"
        if 'statement' in text_lower:
            return 'bank_statement'
        if re.search(r'\*{2,}\d{2,4}', text):  # masked account like ****1234
            return 'bank_statement'
        if re.search(r'\b(account|acct|a/c|account number|account no)\b', text_lower):
            return 'bank_statement'
        
        bank_score = sum(1 for keyword in self.bank_keywords if keyword in text_lower)
        receipt_score = sum(1 for keyword in self.receipt_keywords if keyword in text_lower)
        
        # Heuristic: receipts often contain 'total' and currency values
        currency_amounts = len([m for m in re.findall(r'[₱$]\s*[\d,]+\.\d{2}', text)])
        currency_like_numbers = len([m for m in re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b', text)])
        receipt_density = receipt_score + (1 if 'total' in text_lower else 0) + (1 if currency_amounts >= 1 else 0)
        
        # Receipt detection: require stronger evidence (receipt keywords + currency density)
        if receipt_density >= 2 and receipt_score >= bank_score:
            return 'receipt'
        
        # Bank detection: if bank keywords outweight receipts
        if bank_score >= 1 and bank_score >= receipt_score:
            return 'bank_statement'
        
        # Fallback: many currency-like numbers but no 'statement' could be a receipt
        if currency_like_numbers >= 3 and receipt_score >= 1:
            return 'receipt'
        
        return 'unknown'


class BankStatementParser:
    """Parses bank statements from extracted text."""
    
    def __init__(self, learned_patterns=None, model_artifacts=None):
        self.patterns = learned_patterns or {}
        self.model = None
        if model_artifacts:
            try:
                with open(model_artifacts) as f:
                    self.model = json.load(f)
            except Exception:
                pass

    def categorize_transaction(self, description):
        """Use learned patterns to categorize transaction"""
        desc = description.lower()
        
        # Check merchant categories first
        for merchant, category in self.patterns.get('merchant_categories', {}).items():
            if merchant.lower() in desc:
                return category
                
        # Try pattern matching
        for category, patterns in self.patterns.get('category_patterns', {}).items():
            for pattern in patterns:
                if pattern.lower() in desc:
                    return category
        
        return "uncategorized"

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
        if not description:
            return "uncategorized"
        desc_lower = description.lower()

        # 1) Explicit merchant / service keywords (high priority)
        if any(k in desc_lower for k in ['netflix', 'google play', 'googleplay', 'spotify', 'youtube', 'hulu', 'subscription', 'subs']):
            return 'entertainment'

        # 2) Explicit transfer phrases (outgoing)
        if re.search(r'\btransfer to\b|\btransfer\s+to\s+bank\b|\btransfer\b.*to\b', desc_lower):
            return 'transfer_out'
        if re.search(r'\btransfer from\b|\btransfer in\b|\bcash-in\b|\bdeposit\b', desc_lower):
            return 'transfer_in'

        # 3) Withdrawals / ATM
        if any(k in desc_lower for k in ['withdrawal', 'atm', 'debit card withdrawal', 'card withdrawal']):
            return 'cash_withdrawal'

        # 4) Other category heuristics (groceries, dining, utilities, etc.)
        if any(k in desc_lower for k in ['grocery', 'supermarket', 'market']):
            return 'groceries'
        if any(k in desc_lower for k in ['restaurant', 'food', 'cafe', 'jollibee', 'mcdo', 'pizza', 'starbucks', 'subscription payment']):
            return 'dining' if 'restaurant' in desc_lower or 'food' in desc_lower else 'entertainment'
        if any(k in desc_lower for k in ['meralco', 'pldt', 'water', 'utility', 'electric']):
            return 'utilities'

        # 5) Only mark as opening_balance when description explicitly indicates it
        if any(phrase in desc_lower for phrase in ['opening balance', 'balance b/f', 'balance brought forward', 'previous balance']):
            return 'opening_balance'

        # 6) fallback to learned patterns if present
        for merchant, cat in self.patterns.get('merchant_categories', {}).items():
            if merchant.lower() in desc_lower:
                return cat

        for cat, patterns in self.patterns.get('category_patterns', {}).items():
            for p in patterns:
                if p.lower() in desc_lower:
                    return cat

        return 'uncategorized'
    
    def parse(self, text: str) -> Dict:
        """Parse bank statement text into structured data matching labeled format."""
        result = {
            "bank": "HSBC_UK",  # Can be detected from letterhead
            "statement_type": "bank_statement",
            "statement_period": "",
            "currency": "GBP",
            "payment_summary": {},
            "transactions": []
        }

        # Initialize opening balance
        opening_balance = 0.0  # Default value if not found
        
        # Parse summary section for opening balance
        summary_patterns = [
            r'Opening\s+Balance\s*[₱£$]?\s*([-\d,]+(?:\.\d{1,2})?)',
            r'Balance\s+B/F\s*[₱£$]?\s*([-\d,]+(?:\.\d{1,2})?)',
            r'Previous\s+Balance\s*[₱£$]?\s*([-\d,]+(?:\.\d{1,2})?)',
            r'Opening\s+Balance[:\s]*([-\d,]+(?:\.\d{1,2})?)'
        ]
        
        for pattern in summary_patterns:
            summary_match = re.search(pattern, text, re.IGNORECASE)
            if summary_match:
                try:
                    opening_balance = float(summary_match.group(1).replace(',', ''))
                except Exception:
                    opening_balance = 0.0
                break
        
        # Store opening balance in payment summary
        result["payment_summary"]["openingBalance"] = opening_balance
        
        # Initialize current balance with opening balance
        current_balance = opening_balance

        # Split text into lines for transaction processing (preserve order)
        raw_lines = text.splitlines()
        lines = [ln.rstrip() for ln in raw_lines if ln.strip()]

        transactions = []

        # Regex helpers
        # Date at line start: "07 Jun 2024", "07 Jun 24", "07 Jun", or "07/06/2024"
        month_names = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
        date_start_re = re.compile(
            rf'^(?:\d{{1,2}}[\/\-]\d{{1,2}}[\/\-]\d{{2,4}}|\d{{1,2}}\s+{month_names}\b(?:\s+\d{{2,4}})?)',
            re.IGNORECASE
        )
        # Amount pattern - pick rightmost numeric-looking token (with optional currency)
        amount_re = re.compile(r'([£$₱]?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)')

        i = 0
        while i < len(lines):
            line = lines[i].strip()

            # Start of a transaction identified by date at beginning
            if date_start_re.match(line):
                # Extract date token (first token matching date pattern)
                date_token_match = date_start_re.match(line)
                date_token = date_token_match.group(0).strip()
                # Remove date token from the first-line remainder
                first_remainder = line[len(date_token):].strip()
                description_parts = []
                if first_remainder:
                    description_parts.append(first_remainder)

                amount = None
                txn_marker = None  # 'Debit' / 'Credit' or None

                j = i + 1
                lookahead_limit = 6  # tolerate multi-line descriptions up to this many lines
                looked = 0

                # Also check the same line for an amount (sometimes amount sits on same line)
                same_line_amounts = amount_re.findall(line)
                if same_line_amounts:
                    # choose rightmost numeric token
                    amt_token = same_line_amounts[-1]
                    try:
                        amt_val = float(amt_token.replace('£','').replace('$','').replace('₱','').replace(',','').strip())
                        amount = amt_val
                        lowered = line.lower()
                        if 'debit' in lowered or 'payment to' in lowered or 'withdraw' in lowered or 'dra wn' in lowered:
                            amount = -abs(amount)
                        elif 'credit' in lowered or 'received' in lowered or 'deposit' in lowered:
                            amount = abs(amount)
                    except Exception:
                        amount = None

                # Look ahead to gather description continuation and to find amount
                while amount is None and j < len(lines) and looked < lookahead_limit:
                    nxt = lines[j].strip()
                    # If next line starts with a date => stop (new transaction starts)
                    if date_start_re.match(nxt):
                        break

                    # Search for amount tokens in the next line
                    am_matches = amount_re.findall(nxt)
                    if am_matches:
                        amt_token = am_matches[-1]
                        try:
                            amt_val = float(amt_token.replace('£','').replace('$','').replace('₱','').replace(',','').strip())
                            # Determine debit/credit by presence of keywords on this line or previous parts
                            lowered = nxt.lower()
                            if 'debit' in lowered or 'payment to' in lowered or 'withdraw' in lowered or 'dra wn' in lowered or ('paid' in lowered and 'received' not in lowered):
                                amt_val = -abs(amt_val)
                                txn_marker = 'debit'
                            elif 'credit' in lowered or 'received' in lowered or 'deposit' in lowered:
                                amt_val = abs(amt_val)
                                txn_marker = 'credit'
                            else:
                                # If no explicit marker, try to infer from words in description parts
                                prev_text = ' '.join(description_parts + [nxt]).lower()
                                if any(w in prev_text for w in ['received', 'credit', 'deposit', 'inward']):
                                    txn_marker = 'credit'
                                elif any(w in prev_text for w in ['payment to', 'debit', 'withdraw', 'paid', 'dra wn']):
                                    txn_marker = 'debit'
                                # default: keep as positive (will be classified later)
                            amount = amt_val
                        except Exception:
                            amount = None

                        # If there is descriptive text before the amount token on that same line, capture it
                        before_amt = nxt[:nxt.rfind(amt_token)].strip()
                        if before_amt:
                            description_parts.append(before_amt)
                        # Done with this transaction (found amount)
                        j += 1
                        break
                    else:
                        # Not an amount line => continuation of description
                        description_parts.append(nxt)
                    j += 1
                    looked += 1

                # If still no amount, as a last resort search the next few lines for any numeric token (wider net)
                if amount is None:
                    k = j
                    while k < len(lines) and k < i + 10:
                        fallback_matches = amount_re.findall(lines[k])
                        if fallback_matches:
                            amt_token = fallback_matches[-1]
                            try:
                                amt_val = float(amt_token.replace('£','').replace('$','').replace('₱','').replace(',','').strip())
                                amount = amt_val
                                lowered = lines[k].lower()
                                if 'debit' in lowered or 'payment to' in lowered or 'withdraw' in lowered:
                                    amount = -abs(amount)
                                elif 'credit' in lowered or 'received' in lowered:
                                    amount = abs(amount)
                                # capture any prefix
                                before_amt = lines[k][:lines[k].rfind(amt_token)].strip()
                                if before_amt:
                                    description_parts.append(before_amt)
                                j = k + 1
                                break
                            except Exception:
                                pass
                        k += 1

                # Build final description
                description = ' '.join(part for part in description_parts if part).strip()
                description = re.sub(r'\s+', ' ', description)

                # Use date token as-is; normalization happens later
                date_val = date_token

                # Only add transaction when we have at least an amount (and description if possible)
                if amount is not None:
                    txn = {
                        "date": date_val,
                        "description": description or "", 
                        "amount": amount,
                        "category": self.categorize_transaction(description or "")
                    }
                    transactions.append(txn)
                    # update running balance
                    try:
                        current_balance += float(amount)
                    except Exception:
                        pass

                # Advance main pointer to next unprocessed line
                i = j
            else:
                i += 1

        # Sort transactions by date where possible (attempt to normalize simple "DD Mon YYYY" forms)
        def sort_key(tx):
            d = tx.get('date','')
            # try to normalize simple formats like "07 Jun 2024" -> YYYY-MM-DD for sorting
            m = re.match(r'(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{2,4}))?', d)
            if m:
                day = int(m.group(1))
                mon = m.group(2)[:3].title()
                year = m.group(3) or ''
                # crude month map
                months = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,"Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12}
                mnum = months.get(mon, 0)
                y = int(year) if year and len(year) == 4 else (2000 + int(year) if year else 0)
                return (y, mnum, day)
            # fallback: return as-is
            return (0,0,0)
        transactions.sort(key=sort_key)

        result["transactions"] = transactions

        # Calculate payment summary
        credits = sum(t["amount"] for t in transactions if t["amount"] > 0)
        debits = abs(sum(t["amount"] for t in transactions if t["amount"] < 0))
        
        result["payment_summary"].update({
            "paymentsIn": round(credits, 2),
            "paymentsOut": round(debits, 2),
            "closingBalance": round(current_balance, 2)
        })

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
    
    def _normalize_date(self, date_str: str) -> str:
        """Try to convert common date formats to YYYY-MM-DD. If fail, return original."""
        if not date_str:
            return ""
        date_str = date_str.strip().replace('.', '/').replace('-', '/')
        formats = ['%m/%d/%Y', '%m/%d/%y', '%d/%m/%Y', '%d/%m/%y', '%Y/%m/%d', '%Y-%m-%d']
        from datetime import datetime
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except Exception:
                continue
        # Try to extract yyyy-mm-dd inside the string
        m = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
        if m:
            return m.group(1)
        return date_str  # as-is if not parseable
    
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
        
        # --- NORMALIZE TRANSACTIONS to the requested schema ---
        normalized_transactions = []
        
        if parsed_data.get('document_type') == 'bank_statement':
            for txn in parsed_data.get('transactions', []):
                date_norm = self._normalize_date(txn.get('date', ''))
                amount_raw = txn.get('amount', 0.0)
                # amount in bank parser uses negative for debits
                txn_type = 'income' if amount_raw > 0 else 'expense'
                amount = abs(float(amount_raw))
                category = txn.get('category') or self.bank_parser.categorize_transaction(txn.get('description', ''))
                
                normalized_transactions.append({
                    "date": date_norm,
                    "description": txn.get('description', '').strip(),
                    "amount": round(amount, 2),
                    "type": txn_type,
                    "category": category or "uncategorized"
                })
        
        elif parsed_data.get('document_type') == 'receipt':
            date_raw = parsed_data.get('transaction_info', {}).get('date', '')
            date_norm = self._normalize_date(date_raw)
            for item in parsed_data.get('items', []):
                desc = item.get('description', '').strip()
                amt = float(item.get('price', 0.0))
                # receipts are typically expenses unless flagged as refund/credit
                r_type = 'income' if any(w in desc.lower() for w in ['refund', 'credit', 'reversal']) else 'expense'
                category = self.bank_parser.categorize_transaction(desc)
                
                normalized_transactions.append({
                    "date": date_norm,
                    "description": desc,
                    "amount": round(amt, 2),
                    "type": r_type,
                    "category": category or "uncategorized"
                })
        
        # Attach normalized transactions in a consistent place
        parsed_data['transactions'] = normalized_transactions
        
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
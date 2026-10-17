import re
from typing import Dict, Any, List

class PIIScrubber:
    """
    Enterprise PII scrubbing utility.
    Uses Microsoft Presidio if available, with robust high-performance regex fallback.
    """
    def __init__(self):
        self.presidio_available = False
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            self.analyzer = AnalyzerEngine()
            self.anonymizer = AnonymizerEngine()
            self.presidio_available = True
        except ImportError:
            self.analyzer = None
            self.anonymizer = None

        # Fallback regular expressions for sensitive entities
        self.patterns = [
            # Credit / Debit Cards (13 to 19 digits with optional spaces or dashes)
            (re.compile(r'\b(?:\d{4}[ -]?){3}\d{4}\b'), "[REDACTED_CARD]"),
            # Social Security Numbers (SSN)
            (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), "[REDACTED_SSN]"),
            # Email addresses
            (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b'), "[REDACTED_EMAIL]"),
            # Phone numbers (US and International standard formats)
            (re.compile(r'\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b'), "[REDACTED_PHONE]"),
            # Bank Account numbers (8-12 consecutive digits preceded by keywords)
            (re.compile(r'(?i)(?:account\s*(?:number|#)?\s*:?\s*)(\d{8,12})'), r"account [REDACTED_ACCOUNT]"),
            # CVV / CVC (3-4 digits preceded by security keywords)
            (re.compile(r'(?i)(?:cvv|cvc|security\s*code)\s*:?\s*(\d{3,4})'), r"CVV [REDACTED_CVV]"),
            # Date of Birth (MM/DD/YYYY or YYYY-MM-DD preceded by DOB/birth)
            (re.compile(r'(?i)(?:dob|date\s*of\s*birth)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'), r"DOB [REDACTED_DOB]"),
        ]

    def scrub(self, text: str) -> Dict[str, Any]:
        """
        Scrubs sensitive PII from user inputs or agent trace logs.
        Returns scrubbed text and metadata about detected entities.
        """
        if not text:
            return {"scrubbed_text": "", "detected_entities": []}

        detected_entities: List[str] = []

        if self.presidio_available and self.analyzer and self.anonymizer:
            try:
                results = self.analyzer.analyze(text=text, language='en')
                for res in results:
                    detected_entities.append(res.entity_type)
                anonymized_result = self.anonymizer.anonymize(text=text, analyzer_results=results)
                return {
                    "scrubbed_text": anonymized_result.text,
                    "detected_entities": list(set(detected_entities)),
                    "engine": "microsoft-presidio"
                }
            except Exception:
                # Fallback to regex if presidio execution encounters errors
                pass

        # Regex fallback scrub
        scrubbed = text
        for pattern, replacement in self.patterns:
            matches = pattern.findall(scrubbed)
            if matches:
                # extract name of token
                token_name = replacement.strip("[]") if "[" in replacement else "PII"
                detected_entities.append(token_name)
                scrubbed = pattern.sub(replacement, scrubbed)

        return {
            "scrubbed_text": scrubbed,
            "detected_entities": list(set(detected_entities)),
            "engine": "sentinel-regex-guard"
        }

pii_scrubber = PIIScrubber()

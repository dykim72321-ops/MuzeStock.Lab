import re
from typing import List, Optional

class PartNormalizer:
    @staticmethod
    def clean_mpn(mpn: str) -> str:
        """
        Normalizes a Manufacturer Part Number (MPN).
        Removes non-alphanumeric characters and converts to uppercase.
        Example: 'TPS54331-DR' -> 'TPS54331DR'
        """
        if not mpn:
            return ""
        # Remove hyphens, slashes, and dots which are common variations
        cleaned = re.sub(r'[^A-Z0-9]', '', mpn.upper())
        return cleaned

    @staticmethod
    def is_match(mpn1: str, mpn2: str) -> bool:
        """
        Checks if two MPNs refer to the same physical part.
        Uses relaxed matching for suffixes if base part matches.
        """
        c1 = PartNormalizer.clean_mpn(mpn1)
        c2 = PartNormalizer.clean_mpn(mpn2)
        
        if c1 == c2:
            return True
        
        # Check if one is a prefix of another (common with packaging suffixes like TR, R, etc.)
        if len(c1) > 3 and len(c2) > 3:
            if c1.startswith(c2) or c2.startswith(c1):
                return True
                
        return False

    @staticmethod
    def format_price(price_str: str) -> float:
        """
        Extracts a float value from various price string formats.
        """
        if not price_str:
            return 0.0
        try:
            # Remove currency symbols and commas
            cleaned = re.sub(r'[^\d.]', '', price_str)
            return float(cleaned)
        except (ValueError, TypeError):
            return 0.0

    @staticmethod
    def normalize_distributor(name: str) -> str:
        """
        Standardizes distributor names for consistency in the UI and merging.
        """
        n = name.lower()
        if 'mouser' in n: return "Mouser"
        if 'digi' in n: return "Digi-Key"
        if 'arrow' in n: return "Arrow"
        if 'future' in n: return "Future"
        if 'avnet' in n: return "Avnet"
        if 'farnell' in n: return "Farnell / Newark"
        if 'newark' in n: return "Farnell / Newark"
        if 'lcsc' in n: return "LCSC"
        if 'tme' in n: return "TME"
        if 'element14' in n: return "Element14"
        if 'rochester' in n: return "Rochester"
        if 'win source' in n or 'winsource' in n: return "WinSource"
        return name.title()

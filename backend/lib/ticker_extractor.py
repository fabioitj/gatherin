import re
from typing import List, Set

class TickerExtractor:
    """
    Utility class for extracting Brazilian stock and FII tickers from text content
    """
    
    def __init__(self):
        # Brazilian stock patterns (4 letters + number)
        self.stock_pattern = re.compile(r'\b[A-Z]{4}[0-9]{1,2}\b')
        
        # Brazilian FII patterns (ends with 11)
        self.fii_pattern = re.compile(r'\b[A-Z]{4}11\b')
        
        # Common false positives to exclude
        self.exclude_patterns = {
            'HTML', 'HTTP', 'HTTPS', 'JSON', 'XML', 'CSS', 'JS',
            'API', 'URL', 'URI', 'PDF', 'DOC', 'XLS', 'PPT',
            'CNPJ', 'CPF', 'CEP', 'RG', 'IE', 'INSS',
            'FGTS', 'PIS', 'COFINS', 'ICMS', 'IPI', 'ISS',
            'IPTU', 'IPVA', 'ITR', 'IRPF', 'IRPJ',
            'CVM', 'BACEN', 'ANBIMA', 'FEBRABAN',
            'NYSE', 'NASDAQ', 'S&P', 'DOW'
        }
    
    def extract_tickers(self, text: str) -> List[str]:
        """
        Extract all valid Brazilian tickers from text content
        
        Args:
            text: The text content to analyze
            
        Returns:
            List of unique tickers found in the text
        """
        if not text:
            return []
        
        # Convert to uppercase for pattern matching
        text_upper = text.upper()
        
        # Find all potential tickers
        all_matches = set()
        
        # Extract stocks (4 letters + 1-2 digits)
        stock_matches = self.stock_pattern.findall(text_upper)
        all_matches.update(stock_matches)
        
        # Extract FIIs (4 letters + 11)
        fii_matches = self.fii_pattern.findall(text_upper)
        all_matches.update(fii_matches)
        
        # Filter out false positives
        valid_tickers = []
        for ticker in all_matches:
            if self._is_valid_ticker(ticker):
                valid_tickers.append(ticker)
        
        # Remove duplicates and sort
        return sorted(list(set(valid_tickers)))
    
    def _is_valid_ticker(self, ticker: str) -> bool:
        """
        Validate if a ticker is likely to be a real Brazilian asset
        
        Args:
            ticker: The ticker to validate
            
        Returns:
            True if ticker appears to be valid
        """
        # Exclude common false positives
        if ticker in self.exclude_patterns:
            return False
        
        # Additional validation rules
        if len(ticker) < 5 or len(ticker) > 6:
            return False
        
        # Must start with letters
        if not ticker[:4].isalpha():
            return False
        
        # Must end with numbers
        if not ticker[4:].isdigit():
            return False
        
        # FII specific validation (must end with 11)
        if ticker.endswith('11'):
            return len(ticker) == 6
        
        # Stock specific validation (ends with 3, 4, or other single digit)
        if len(ticker) == 5:
            return ticker[4] in '0123456789'
        
        # 6-character stocks (like BBAS3, PETR4)
        if len(ticker) == 6:
            return ticker[4:] in ['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']
        
        return True
    
    def extract_and_categorize(self, text: str) -> dict:
        """
        Extract tickers and categorize them by type
        
        Args:
            text: The text content to analyze
            
        Returns:
            Dictionary with 'stocks', 'fiis', and 'all' lists
        """
        all_tickers = self.extract_tickers(text)
        
        stocks = [t for t in all_tickers if not t.endswith('11')]
        fiis = [t for t in all_tickers if t.endswith('11')]
        
        return {
            'stocks': stocks,
            'fiis': fiis,
            'all': all_tickers
        }
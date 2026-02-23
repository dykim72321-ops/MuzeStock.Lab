"""
Rare Source - Web Scraping Utilities
Example module for scraping real component distributors.
"""

import asyncio
import re
import uuid
from typing import List, Dict, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Necessary libraries
try:
    import httpx
    from bs4 import BeautifulSoup
    from openai import AsyncOpenAI
except ImportError:
    print("⚠️  httpx, beautifulsoup4, and openai are required. Please pip install them.")

# =============================================================================
# FINDCHIPS + OPENAI CONNECTORS (Intelligent Scraping)
# =============================================================================

class OpenAIParserConnector:
    """
    Uses OpenAI API to intelligently parse HTML and extract structured data.
    """
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        try:
            self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        except NameError:
            self.client = None
            print("⚠️ AsyncOpenAI not defined. AI parsing disabled.")
            
    async def parse_html_to_json(self, html_content: str, part_number: str) -> List[Dict]:
        """Parse HTML content using GPT-4o-mini to extract component data"""
        if not self.client:
            print("⚠️  OpenAI API Key missing or library not installed. Skipping AI parsing.")
            return []
            
        # Truncate HTML to reduce token usage
        max_html_length = 8000
        if len(html_content) > max_html_length:
            html_content = html_content[:max_html_length] + "..."
            
        prompt = f"""Extract electronic component data from the following HTML and return ONLY a JSON array.
Each item should have these fields:
- distributor (string)
- mpn (string, the manufacturer part number)
- manufacturer (string)
- stock (integer, 0 if unknown)
- price (float, 0 if unknown)
- currency (string, default "USD")
- delivery (string)
- description (string, brief)
- product_url (string, the direct link to the product or buy page)
- datasheet (string, link to PDF if available, otherwise empty)

Part Number: {part_number}

HTML:
{html_content}

Return ONLY the JSON array, no markdown formatting or explanations."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",  # Cost-effective model
                messages=[
                    {"role": "system", "content": "You are a data extraction assistant. Return only valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```"):
                content = re.sub(r'^```(?:json)?\n?', '', content)
                content = re.sub(r'\n?```$', '', content)
            
            # Parse JSON
            import json
            data = json.loads(content)
            
            print(f"✓ OpenAI parsed {len(data)} items from HTML")
            return data
            
        except json.JSONDecodeError as e:
            print(f"⚠️  OpenAI returned invalid JSON: {e}")
            print(f"Response: {content[:200]}...")
            return []
        except Exception as e:
            print(f"❌ OpenAI Parser Exception: {e}")
            return []

class FindChipsConnector:
    """
    Scrapes FindChips.com and uses OpenAI to parse results intelligently.
    """
    def __init__(self):
        self.base_url = "https://www.findchips.com/search"
        self.openai_parser = OpenAIParserConnector()
        
    async def fetch_prices(self, query: str) -> List[Dict]:
        """Fetch component data from FindChips using AI-powered parsing"""
        url = f"{self.base_url}/{query}"
        
        try:
            print(f"🔍 Scraping FindChips for: {query}...")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    print(f"⚠️  FindChips returned status {response.status_code}")
                    return []
                
                html_content = response.text
                
                # Use OpenAI to parse the HTML
                parsed_data = await self.openai_parser.parse_html_to_json(html_content, query)
                
                # Normalize to our format
                results = []
                for item in parsed_data:
                    results.append({
                        "distributor": item.get("distributor", "FindChips Source"),
                        "mpn": item.get("mpn", query.upper()),
                        "manufacturer": item.get("manufacturer", "Unknown"),
                        "stock": item.get("stock", 0),
                        "price": item.get("price", 0.0),
                        "currency": item.get("currency", "USD"),
                        "condition": "New",
                        "risk_level": "Low",
                        "source_type": "FindChips (AI Parsed)",
                        "description": item.get("description", "Multi-source aggregated data"),
                        "delivery": item.get("delivery", "Check Distributor"),
                        "date_code": "2024+",
                        "datasheet": item.get("datasheet", f"https://www.findchips.com/search/{query}"),
                        "product_url": item.get("product_url", f"https://www.findchips.com/search/{query}")
                    })
                
                if results:
                    print(f"✓ FindChips found {len(results)} results via AI parsing")
                else:
                    print("⚠️  No results extracted from FindChips")
                    
                return results
                
        except Exception as e:
            print(f"❌ FindChips Connector Exception: {e}")
            import traceback
            traceback.print_exc()
            return []

# --- MOUSER API CONNECTOR (Real Data) ---
class MouserConnector:
    """
    Connects to Mouser Search API (v1)
    """
    def __init__(self):
        self.api_key = os.getenv("MOUSER_API_KEY")
        self.base_url = "https://api.mouser.com/api/v1/search/partnumber"
        
    async def fetch_prices(self, query: str) -> List[Dict]:
        if not self.api_key or self.api_key == "YOUR_MOUSER_KEY":
            print("⚠️  Mouser API Key missing or invalid.")
            return []
            
        headers = {'Content-Type': 'application/json'}
        params = {'apiKey': self.api_key}
        body = {
            "SearchByPartRequest": {
                "mouserPartNumber": query,
                "partSearchOptions": "string"
            }
        }
        
        try:
            print(f"🔌 Connecting to Mouser API for: {query}...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.base_url, params=params, json=body, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_results(data, query)
                else:
                    print(f"❌ Mouser API Error: {response.status_code} - {response.text[:100]}")
                    return []
        except Exception as e:
            print(f"❌ Mouser Connector Exception: {e}")
            return []
            
    def _parse_results(self, data, query):
        parts = []
        try:
            # DEBUG: Log response structure
            print(f"📊 Mouser Response Keys: {list(data.keys()) if data else 'None'}")
            
            search_results = data.get('SearchResults', {})
            if not search_results:
                print(f"⚠️  No 'SearchResults' in response. Available keys: {list(data.keys())}")
                return []
            
            items = search_results.get('Parts', [])
            if not items:
                print(f"⚠️  No 'Parts' found. SearchResults keys: {list(search_results.keys())}")
                return []
            
            print(f"✓ Found {len(items)} parts from Mouser")
            
            for item in items:
                # Stock normalization
                availability = item.get('Availability', '0')
                stock_str = ''.join(filter(str.isdigit, availability.split(' ')[0]))
                stock = int(stock_str) if stock_str else 0
                
                # Price extraction
                price_breaks = item.get('PriceBreaks', [])
                price = 0.0
                currency = 'USD'
                
                if price_breaks:
                    # Prefer price for quantity 1, or the first available
                    pb = price_breaks[0]
                    price_str = pb.get('Price', '0').replace('$', '').replace(',', '')
                    currency = pb.get('Currency', 'USD')
                    try: 
                        price = float(price_str)
                    except: 
                        price = 0.0
                        
                parts.append({
                    "distributor": "Mouser Electronics (API)",
                    "mpn": item.get('ManufacturerPartNumber', query),
                    "manufacturer": item.get('Manufacturer', 'Unknown'),
                    "stock": stock,
                    "price": price,
                    "currency": currency,
                    "condition": "New",
                    "risk_level": "Low",
                    "source_type": "Official API",
                    "datasheet": item.get('DataSheetUrl', ''),
                    "description": item.get('Description', ''),
                    "date_code": "2024+", # Placeholder
                    "delivery": item.get('LeadTime', 'In Stock'),
                    "product_url": f"https://www.mouser.kr/Search/Refine?Keyword={query}"
                })
        except Exception as parse_err:
            print(f"⚠️ Mouser Parse Error: {parse_err}")
            import traceback
            traceback.print_exc()
            
        return parts

# --- DIGI-KEY API CONNECTOR (Real Data) ---
class DigiKeyConnector:
    """
    Connects to Digi-Key Product Information API v4.
    Requires OAuth2 Token traversal.
    """
    def __init__(self):
        self.client_id = os.getenv("DIGIKEY_CLIENT_ID")
        self.client_secret = os.getenv("DIGIKEY_CLIENT_SECRET")
        self.token_url = "https://api.digikey.com/v1/oauth2/token"
        self.base_url = "https://api.digikey.com/Search/v3/Products/Keyword" # v3 is simpler, or v4
        # Note: v4 path is often /products/v4/search/keyword or similar. Let's use v3 for simplicity if available, or check specific endpoint.
        # Actually, let's use the standard "Keyword Search" which is often mapped to /Search/v3/Products/Keyword within many SDKs, 
        # but the raw API documentation specifies: https://api.digikey.com/products/v4/search/keyword
        self.search_url = "https://api.digikey.com/products/v4/search/keyword"
        self.access_token = None
        self.token_expires_at = 0

    async def _get_token(self):
        """Fetch or refresh OAuth2 Access Token"""
        import time
        if self.access_token and time.time() < self.token_expires_at:
            return self.access_token

        if not self.client_id or not self.client_secret:
            return None

        # Prepare for application/x-www-form-urlencoded
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.token_url, data=data)
                if resp.status_code == 200:
                    token_data = resp.json()
                    self.access_token = token_data.get("access_token")
                    expires_in = token_data.get("expires_in", 3600)
                    self.token_expires_at = time.time() + expires_in - 60 # buffer
                    return self.access_token
                else:
                    print(f"❌ Digi-Key Token Error: {resp.status_code} - {resp.text}")
                    return None
        except Exception as e:
            print(f"❌ Digi-Key Token Exception: {e}")
            return None

    async def fetch_prices(self, query: str) -> List[Dict]:
        token = await self._get_token()
        if not token:
            print("⚠️ Skipping Digi-Key (No Token)")
            return []

        headers = {
            "Authorization": f"Bearer {token}",
            "X-DIGIKEY-Client-Id": self.client_id,
            "X-DIGIKEY-Locale-Site": "US",
            "X-DIGIKEY-Locale-Language": "en",
            "Content-Type": "application/json"
        }

        body = {
            "Keywords": query,
            "Limit": 10
        }

        try:
            print(f"🔌 Connecting to Digi-Key API for: {query}...")
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.search_url, json=body, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    return self._parse_results(data, query)
                else:
                    print(f"❌ Digi-Key API Error: {response.status_code}")
                    return []
        except Exception as e:
            print(f"❌ Digi-Key Connector Exception: {e}")
            return []

    def _parse_results(self, data, query):
        parts = []
        try:
            # DEBUG: Log response structure
            print(f"📊 Digi-Key Response Keys: {list(data.keys()) if data else 'None'}")
            
            products = data.get("Products", [])
            if not products:
                print(f"⚠️  No 'Products' in response. Available keys: {list(data.keys())}")
                return []
            
            print(f"✓ Found {len(products)} products from Digi-Key")
            
            for item in products:
                # Price logic
                price = 0.0
                currency = "USD"
                
                # Check StandardPricing or UnitPrice
                unit_price = item.get("UnitPrice", 0)
                if unit_price > 0:
                    price = unit_price
                
                # Stock
                stock = item.get("QuantityAvailable", 0)
                
                # [UPDATED] Robust Manufacturer Parsing
                manufacturer = "Unknown"
                mfr_data = item.get("Manufacturer", {})
                if isinstance(mfr_data, dict):
                    manufacturer = mfr_data.get("Name") or mfr_data.get("Value") or "Unknown"
                elif isinstance(mfr_data, str):
                    manufacturer = mfr_data
                
                # [UPDATED] Extract Packaging Info
                packaging_opts = item.get("Packaging", {}).get("Name", "")
                description = item.get("ProductDescription", "")
                
                if packaging_opts:
                    description = f"[{packaging_opts}] {description}"
                
                parts.append({
                    "distributor": "Digi-Key Electronics (API)",
                    "mpn": item.get("ManufacturerPartNumber", query),
                    "manufacturer": manufacturer,
                    "stock": stock,
                    "price": price,
                    "currency": currency,
                    "condition": "New",
                    "risk_level": "Low",
                    "source_type": "Official API",
                    "datasheet": item.get("DatasheetUrl", ""),
                    "description": description,
                    "date_code": "2024+",
                    "delivery": "Immediate" if stock > 0 else "Backorder",
                    "product_url": item.get("ProductUrl", "")
                })
        except Exception as e:
            print(f"⚠️ Digi-Key Parse Error: {e}")
            import traceback
            traceback.print_exc()
            
        return parts

# --- EOL SPECIALIST CONNECTORS (Rochester, Flip) ---

class RochesterConnector:
    """
    Connects to Rochester Electronics (Authorized EOL Distributor).
    Uses Search URL Scraping / Deep Linking.
    """
    def __init__(self):
        self.base_url = "https://www.rocelec.com/search"
    
    async def fetch_prices(self, query: str) -> List[Dict]:
        # Note: Real scraping requires handling anti-bot protections.
        # For this version, we provide a 'Deep Link' result that acts as a connector.
        # If we had a direct API or if the site was simple HTML, we would parse it here.
        
        return [{
            "distributor": "Rochester Electronics (EOL)",
            "mpn": query.upper(),
            "manufacturer": "Various (EOL Authorized)",
            "stock": 0, # Unknown without deep scrape
            "price": 0.0,
            "currency": "USD",
            "condition": "Authorized EOL",
            "is_eol": True,
            "risk_level": "Low",
            "source_type": "EOL Partner",
            "description": "Click to check EOL stock directly.",
            "delivery": "Check Website",
            "datasheet": f"https://www.rocelec.com/search?q={query}",
            "product_url": f"https://www.rocelec.com/parts/{query}"
        }]

class FlipElectronicsConnector:
    """
    Connects to Flip Electronics (EOL Specialist).
    """
    async def fetch_prices(self, query: str) -> List[Dict]:
        return [{
            "distributor": "Flip Electronics",
            "mpn": query.upper(),
            "manufacturer": "Various",
            "stock": 0,
            "price": 0.0,
            "currency": "USD",
            "condition": "EOL / Obsolete",
            "is_eol": True,
            "risk_level": "Low",
            "source_type": "EOL Partner",
            "description": "Authorized EOL Reseller",
            "delivery": "Contact for Quote",
            "datasheet": f"https://www.flipelectronics.com/?s={query}",
            "product_url": f"https://www.flipelectronics.com/search?q={query}"
        }]

# --- BROADLINE DISTRIBUTOR DEEP LINKS (No API Key Required) ---

class ArrowConnector:
    """Generates direct search links for Arrow Electronics."""
    async def fetch_prices(self, query: str) -> List[Dict]:
        return [{
            "distributor": "Arrow Electronics",
            "mpn": query.upper(),
            "manufacturer": "Various",
            "stock": -1, # Check website
            "price": 0.0,
            "currency": "USD",
            "condition": "New",
            "risk_level": "Low",
            "source_type": "Deep Link",
            "description": "Global Distributor",
            "delivery": "Check Website",
            "datasheet": "https://www.arrow.com",
            "product_url": f"https://www.arrow.com/en/products/search?q={query}"
        }]

class FutureElectronicsConnector:
    """Generates direct search links for Future Electronics."""
    async def fetch_prices(self, query: str) -> List[Dict]:
        return [{
            "distributor": "Future Electronics",
            "mpn": query.upper(),
            "manufacturer": "Various",
            "stock": -1,
            "price": 0.0,
            "currency": "USD",
            "condition": "New",
            "risk_level": "Low",
            "source_type": "Deep Link",
            "description": "Global Distributor",
            "delivery": "Check Website",
            "datasheet": f"https://www.futureelectronics.com/c/semiconductors/{query}",
            "product_url": f"https://www.futureelectronics.com/search/?text={query}"
        }]

class RSComponentsConnector:
    """Generates direct search links for RS Components."""
    async def fetch_prices(self, query: str) -> List[Dict]:
        return [{
            "distributor": "RS Components",
            "mpn": query.upper(),
            "manufacturer": "Various",
            "stock": -1,
            "price": 0.0,
            "currency": "USD",
            "condition": "New",
            "risk_level": "Low",
            "source_type": "Deep Link",
            "description": "Global Distributor",
            "delivery": "Check Website",
            "datasheet": f"https://uk.rs-online.com/web/c/?searchTerm={query}",
            "product_url": f"https://uk.rs-online.com/web/c/?searchTerm={query}"
        }]

# =============================================================================
# SOURCING GATEWAY (Unified Interface)
# =============================================================================

class SourcingGateway:
    """
    Unified entry point for all component sourcing.
    Aggregates results from Tier 1 APIs, EOL specialists, and AI scrapers.
    Enforces strict data normalization.
    """
    def __init__(self):
        # Initialize Connectors
        self.connectors = [
            MouserConnector(),
            DigiKeyConnector(),
            # Add other connectors here
        ]
        
        # TrustedParts Integration
        try:
            from trustedparts_connector import TrustedPartsConnector
            self.connectors.append(TrustedPartsConnector())
        except ImportError:
            print("⚠️ TrustedParts Connector not found.")
        try:
            from win_source_connector import WinSourceConnector
            self.connectors.append(WinSourceConnector())
        except ImportError:
            print("⚠️ Win Source Connector not found.")

        try:
            from nexar_connector import get_nexar_connector
            self.connectors.append(get_nexar_connector())
        except ImportError:
            print("⚠️ Nexar Connector not found.")
            
        # self.findchips = FindChipsConnector()
        # self.rochester = RochesterConnector()
        # self.flip = FlipElectronicsConnector()
        
        # Deep links (Fallback)
        self.deep_links = [
            ArrowConnector(),
            FutureElectronicsConnector(),
            RSComponentsConnector()
        ]

    async def search(self, query: str) -> List[Dict]:
        """
        Execute parallel search across all configured sources.
        """
        tasks = []
        
        # 1. API Connectors (Real Data)
        for connector in self.connectors:
            if hasattr(connector, 'search_parts'):
                tasks.append(connector.search_parts(query))
            elif hasattr(connector, 'fetch_prices'):
                tasks.append(connector.fetch_prices(query))
                
        # 2. AI Scraper (FindChips)
        # tasks.append(self.findchips.fetch_prices(query))
        
        # 3. EOL Specialists
        # tasks.append(self.rochester.fetch_prices(query))
        # tasks.append(self.flip.fetch_prices(query))
        
        # 4. Deep Links (Low priority, fast)
        for link in self.deep_links:
            tasks.append(link.fetch_prices(query))
            
        # Execute all
        raw_results_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        flattened_results = []
        for res in raw_results_list:
            if isinstance(res, list):
                flattened_results.extend(res)
            elif isinstance(res, Exception):
                print(f"⚠️ Connector Error: {res}")
                
        # Normalize and Sort
        normalized_data = [self._normalize_part(item) for item in flattened_results]
        
        # Filter invalid entries (no price AND no stock AND not EOL)
        valid_data = [
            d for d in normalized_data 
            if d['price'] > 0 or d['stock'] > 0 or d.get('is_eol', False)
        ]
        
        if not valid_data:
            return []
            
        return sorted(valid_data, key=lambda x: (x['risk_level'] == 'High', -x['stock'], x['price']))

    def _normalize_part(self, data: Dict) -> Dict:
        """
        Enforce consistent schema for all parts.
        """
        # Default structure
        part = {
            "id": data.get("id", str(uuid.uuid4())[:12]),
            "mpn": data.get("mpn", "UNKNOWN").upper(),
            "manufacturer": data.get("manufacturer", "Unknown"),
            "distributor": data.get("distributor", "Unknown"),
            "source_type": data.get("source_type", "Aggregator"),
            "stock": 0,
            "price": 0.0,
            "currency": data.get("currency", "USD"),
            "condition": data.get("condition", "New"),
            "date_code": data.get("date_code", "N/A"),
            "risk_level": "Low",
            "is_eol": data.get("is_eol", False),
            "description": data.get("description", ""),
            "datasheet": data.get("datasheet", ""),
            "product_url": data.get("product_url", ""),
            "delivery": data.get("delivery", "Unknown"),
            "specs": data.get("specs", {})
        }
        
        # Normalize Stock
        try:
            stock_val = data.get("stock", 0)
            if isinstance(stock_val, str):
                # Remove non-digits
                clean_stock = ''.join(filter(str.isdigit, stock_val))
                part['stock'] = int(clean_stock) if clean_stock else 0
            else:
                part['stock'] = int(stock_val)
        except:
            part['stock'] = 0
            
        # Normalize Price
        try:
            price_val = data.get("price", 0.0)
            if isinstance(price_val, (int, float)):
                part['price'] = float(price_val)
            elif isinstance(price_val, str):
                # Handle "Quote", "Contact", etc.
                lower_price = price_val.lower()
                if "quote" in lower_price or "call" in lower_price or "contact" in lower_price:
                    part['price'] = 0.0 # Quote parts are effectively 0 for sorting, or handled via UI
                else:
                    # Clean string like "$ 12.34"
                    clean_price = re.sub(r'[^\d.]', '', price_val)
                    part['price'] = float(clean_price) if clean_price else 0.0
            else:
                part['price'] = 0.0
        except:
            part['price'] = 0.0
            
        # Calculate Risk Level Logic
        part['risk_level'] = self._calculate_risk(part)
        
        return part

    def _calculate_risk(self, part: Dict) -> str:
        """Centralized risk logic"""
        # 1. Source Trust
        trusted_sources = ["Mouser", "Digi-Key", "Rochester", "Nexar"]
        dist_lower = part['distributor'].lower()
        
        if any(t.lower() in dist_lower for t in trusted_sources):
            # Trusted distributor
            if part['is_eol']: return "Medium" # EOL is always some risk
            return "Low"
            
        # 2. Condition
        cond_lower = part['condition'].lower()
        if "refurbished" in cond_lower or "used" in cond_lower or "pull" in cond_lower:
            return "High"
            
        # 3. Stock Scarcity
        if part['stock'] < 10 and part['stock'] > 0:
            return "Medium"
            
        # 4. Fallback/Unknown sources
        return "Medium"



# Singleton
gateway = SourcingGateway()

async def aggregate_from_multiple_sources(query: str) -> List[Dict]:
    """Legacy wrapper for compatibility"""
    return await gateway.search(query)

if __name__ == "__main__":
    import uuid # Needed for the script execution since it's imported inside class
    print("🔍 Testing Sourcing Gateway...")
    results = asyncio.run(aggregate_from_multiple_sources("LM358"))
    for r in results:
        print(f"[{r['source_type']}] {r['distributor']}: {r['mpn']} | Stock: {r['stock']} | Price: {r['price']}")

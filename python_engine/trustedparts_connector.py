import os
import httpx
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TrustedPartsConnector:
    """
    Connects to TrustedParts.com Inventory API (ECIA).
    Provides real-time stock and pricing from authorized distributors.
    """
    def __init__(self):
        self.company_id = os.getenv("TRUSTEDPARTS_COMPANY_ID")
        self.api_key = os.getenv("TRUSTEDPARTS_API_KEY")
        self.auth_url = "https://api.trustedparts.com/auth/token"
        # Note: Actual endpoint might vary, using standard OAuth2 pattern for now based on docs
        # Many ECIA implementations use a specific tailored endpoint.
        # Assuming standard structure for now.
        self.search_url = "https://api.trustedparts.com/v2/search/parts"
        
        self.access_token = None
        self.token_expiry = 0
        self.client = httpx.AsyncClient(timeout=15.0)

    async def _get_token(self) -> Optional[str]:
        """Obtain OAuth2 Token"""
        if self.access_token and time.time() < self.token_expiry:
            return self.access_token

        if not self.company_id or not self.api_key:
            # Silent fail if keys not configured
            return None

        try:
            response = await self.client.post(
                self.auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.company_id,
                    "client_secret": self.api_key,
                    "scope": "inventory_search" # Example scope
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.token_expiry = time.time() + data.get("expires_in", 3600) - 60
                return self.access_token
            else:
                print(f"❌ TrustedParts Auth Failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ TrustedParts Auth Error: {e}")
            return None

    async def search_parts(self, query: str) -> List[Dict]:
        """Search for parts via TrustedParts API"""
        if not self.company_id:
            return []

        token = await self._get_token()
        if not token:
            return []

        try:
            response = await self.client.get(
                self.search_url,
                params={"q": query},
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code == 200:
                return self._parse_response(response.json(), query)
            else:
                print(f"⚠️ TrustedParts Search Error: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ TrustedParts Connector Exception: {e}")
            return []

    def _parse_response(self, data: Dict, query: str) -> List[Dict]:
        results = []
        try:
            parts = data.get("parts", [])
            for part in parts:
                for seller in part.get("sellers", []):
                    offers = seller.get("offers", [])
                    for offer in offers:
                        stock = offer.get("inventoryLevel", 0)
                        
                        # Price logic
                        price = 0.0
                        prices = offer.get("prices", [])
                        if prices:
                            price = float(prices[0].get("price", 0))

                        results.append({
                            "id": f"tp-{part.get('manufacturerPartNumber')}-{seller.get('companyName')}",
                            "mpn": part.get("manufacturerPartNumber", query),
                            "manufacturer": part.get("manufacturer", "Unknown"),
                            "distributor": seller.get("companyName", "Authorized Dist"),
                            "stock": stock,
                            "price": price,
                            "currency": "USD", # Default
                            "source_type": "Global API (TrustedParts)",
                            "condition": "New",
                            "risk_level": "Low",
                            "is_eol": False,
                            "product_url": offer.get("clickUrl", ""),
                            "datasheet": part.get("datasheetUrl", ""),
                            "delivery": f"{offer.get('factoryLeadTimeWeeks', '?')} Weeks"
                        })
        except Exception as e:
            print(f"⚠️ TrustedParts Parse Error: {e}")
            
        return results



"""
Octopart/Nexar API Integration Module
Free tier integration for electronic component data
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
import os
from datetime import datetime

# Nexar API Configuration (Octopart is now part of Nexar)
NEXAR_CLIENT_ID = os.getenv("NEXAR_CLIENT_ID", "")
NEXAR_CLIENT_SECRET = os.getenv("NEXAR_CLIENT_SECRET", "")
NEXAR_TOKEN_URL = "https://identity.nexar.com/connect/token"
NEXAR_API_URL = "https://api.nexar.com/graphql"


class NexarConnector:
    """Connector for Nexar/Octopart API with caching and rate limiting"""
    
    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def get_access_token(self) -> str:
        """Get or refresh access token"""
        # 1. Check if a manual token is provided in environment (highest priority)
        manual_token = os.getenv("NEXAR_ACCESS_TOKEN")
        if manual_token:
            return manual_token

        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
            
        if not NEXAR_CLIENT_ID or not NEXAR_CLIENT_SECRET:
            raise ValueError("Nexar API credentials not configured. Set NEXAR_CLIENT_ID and NEXAR_CLIENT_SECRET environment variables.")
        
        # Use Basic Authentication header as some OAuth2 providers prefer it
        import base64
        auth_str = f"{NEXAR_CLIENT_ID}:{NEXAR_CLIENT_SECRET}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        
        response = await self.client.post(
            NEXAR_TOKEN_URL,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {encoded_auth}"
            },
            data={
                "grant_type": "client_credentials",
                "scope": "supply.domain",
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to get Nexar token: {response.text}")

            
        data = response.json()
        self.access_token = data["access_token"]
        # Token typically valid for 1 hour, refresh 5 minutes before expiry
        expires_in = data.get("expires_in", 3600)
        from datetime import timedelta
        self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 300)
        
        return self.access_token
    
    async def search_parts(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for parts using Nexar GraphQL API
        Free tier allows ~1000 queries per month
        """
        try:
            token = await self.get_access_token()
        except ValueError as e:
            # Return empty if credentials not configured
            print(f"Nexar API not configured: {e}")
            return []
        
        # Updated GraphQL query based on Nexar API playground format
        graphql_query = """
        query totalAvailability($q: String!, $country: String!, $limit: Int!) {
          supSearchMpn(q: $q, country: $country, limit: $limit) {
            results {
              description
              part {
                totalAvail
                mpn
                manufacturer {
                  name
                }
                shortDescription
                category {
                  name
                }
                bestDatasheet {
                  url
                }
                specs {
                  attribute {
                    name
                  }
                  displayValue
                }
                sellers {
                  company {
                    name
                  }
                  offers {
                    inventoryLevel
                    prices {
                      price
                      currency
                      quantity
                    }
                    moq
                    factoryLeadDays
                    clickUrl
                  }
                }
              }
            }
          }
        }
        """
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        
        response = await self.client.post(
            NEXAR_API_URL,
            json={
                "query": graphql_query,
                "variables": {"q": query, "country": "US", "limit": limit}
            },
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"Nexar API error: {response.status_code} - {response.text}")
            return []
            
        data = response.json()
        
        if "errors" in data:
            print(f"Nexar GraphQL errors: {data['errors']}")
            return []
            
        return self._transform_results(data)
    
    def _transform_results(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Transform Nexar API response to standard format"""
        parts = []
        
        if not data:
            return []
            
        try:
            results_data = data.get("data")
            if not results_data:
                return []
            results = results_data.get("supSearchMpn", {}).get("results", [])
        except (AttributeError, KeyError, TypeError):
            return []
            
        for result in results:

            part = result.get("part", {})
            
            # Get best offer from sellers
            best_price = None
            best_stock = 0
            best_seller = None
            best_lead_time = "N/A"
            product_url = None
            
            for seller in part.get("sellers", []):
                company_name = seller.get("company", {}).get("name", "")
                
                for offer in seller.get("offers", []):
                    stock = offer.get("inventoryLevel", 0)
                    prices = offer.get("prices", [])
                    
                    if prices:
                        price = prices[0].get("price", 0)
                        currency = prices[0].get("currency", "USD")
                        
                        if best_price is None or price < best_price:
                            best_price = price
                            best_stock = stock
                            best_seller = company_name
                            best_lead_time = f"{offer.get('factoryLeadDays', 'N/A')} days"
                            product_url = offer.get("clickUrl")
            
            # Build specs dictionary
            specs = {}
            for spec in part.get("specs", []):
                attr_name = spec.get("attribute", {}).get("name", "")
                if attr_name:
                    specs[attr_name] = spec.get("displayValue", "")
            
            parts.append({
                "id": f"nexar-{part.get('mpn', '')}",
                "mpn": part.get("mpn", ""),
                "manufacturer": part.get("manufacturer", {}).get("name", "Unknown"),
                "distributor": best_seller or "Octopart",
                "source_type": "Nexar API",
                "stock": best_stock,
                "price": int(best_price * 1300) if best_price else 0,  # Convert USD to KRW approx
                "currency": "KRW",
                "delivery": best_lead_time,
                "condition": "New",
                "date_code": "Current",
                "is_eol": False,
                "risk_level": "Low",
                "datasheet": part.get("bestDatasheet", {}).get("url"),
                "description": part.get("shortDescription", ""),
                "product_url": product_url,
                "category": part.get("category", {}).get("name", ""),
                "specs": specs
            })
            
        return parts
    
    async def get_part_details(self, mpn: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific part"""
        results = await self.search_parts(mpn, limit=1)
        return results[0] if results else None
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Singleton instance
_nexar_connector: Optional[NexarConnector] = None

def get_nexar_connector() -> NexarConnector:
    """Get or create Nexar connector singleton"""
    global _nexar_connector
    if _nexar_connector is None:
        _nexar_connector = NexarConnector()
    return _nexar_connector


async def fetch_from_nexar(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Convenience function to fetch parts from Nexar"""
    connector = get_nexar_connector()
    return await connector.search_parts(query, limit)

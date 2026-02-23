
import asyncio
import os
from dotenv import load_dotenv
from scraper_examples import DigiKeyConnector
import json

load_dotenv()

async def debug_digikey():
    print("Fetching DigiKey Data for LM358...")
    connector = DigiKeyConnector()
    # We need to manually call the internals or just use fetch_prices but print inside it
    # Easier to just invoke fetch_prices and modify the connector temporarily or just use the logic here.
    # Let's use the connector but we need to see the raw data. 
    # Since I cannot easily modify the installed connector instance in a script without copying code, 
    # I will just use the connector's internal methods if possible, or copy the fetch logic.
    
    # Authenticate
    token = await connector._get_token()
    if not token:
        print("Failed to get token")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "X-DIGIKEY-Client-Id": connector.client_id,
        "X-DIGIKEY-Locale-Site": "US",
        "X-DIGIKEY-Locale-Language": "en",
        "Content-Type": "application/json"
    }

    body = {
        "Keywords": "LM358",
        "Limit": 2
    }
    
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.post(connector.search_url, json=body, headers=headers)
        if response.status_code == 200:
            data = response.json()
            products = data.get("Products", [])
            if products:
                print("--- RAW PRODUCT [0] ---")
                print(json.dumps(products[0], indent=2))
            else:
                print("No products found")
        else:
            print(f"Error: {response.status_code} {response.text}")

if __name__ == "__main__":
    asyncio.run(debug_digikey())

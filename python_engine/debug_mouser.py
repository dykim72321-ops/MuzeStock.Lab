
import asyncio
import os
from dotenv import load_dotenv
import httpx
import json

load_dotenv()

async def debug_mouser():
    API_KEY = os.getenv("MOUSER_API_KEY")
    base_url = "https://api.mouser.com/api/v1/search/partnumber"
    query = "LM358"
    
    headers = {'Content-Type': 'application/json'}
    params = {'apiKey': API_KEY}
    body = {
        "SearchByPartRequest": {
            "mouserPartNumber": query,
            "partSearchOptions": "string"
        }
    }
    
    print(f"Testing Mouser API for: {query}")
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(base_url, params=params, json=body, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"Top-level keys: {list(data.keys())}")
            
            if 'Errors' in data:
                print(f"Errors: {data['Errors']}")
            
            if 'SearchResults' in data:
                sr = data['SearchResults']
                print(f"SearchResults keys: {list(sr.keys()) if sr else 'Empty'}")
                
                if sr and 'Parts' in sr:
                    parts = sr['Parts']
                    print(f"Found {len(parts)} parts")
                    if parts:
                        print(f"First part sample: {json.dumps(parts[0], indent=2)[:500]}...")
                else:
                    print("No 'Parts' in SearchResults")
        else:
            print(f"Error: {response.status_code}")

if __name__ == "__main__":
    asyncio.run(debug_mouser())


import asyncio
import os
from dotenv import load_dotenv
from nexar_connector import get_nexar_connector

load_dotenv()

async def test_nexar():
    print("Testing Nexar Connector...")
    connector = get_nexar_connector()
    try:
        results = await connector.search_parts("LM358", limit=5)
        print(f"Found {len(results)} results.")
        for r in results:
            print(f"- {r['mpn']} | {r['distributor']} | {r['stock']} | {r['price']}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await connector.close()

if __name__ == "__main__":
    asyncio.run(test_nexar())

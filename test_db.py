from supabase import create_client
import os

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")

if url and key:
    supabase = create_client(url, key)
    res = supabase.table("stock_analysis_cache").select("analysis").limit(1).execute()
    print(res.data)
else:
    print("No env vars")

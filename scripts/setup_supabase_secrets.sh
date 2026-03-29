#!/bin/bash

# MuzeStock.Lab - Supabase Secret Setup Script
# This script sets the necessary secrets for the admin-proxy Edge Function.

# 1. ADMIN_SECRET_KEY (Found in python_engine/.env)
ADMIN_KEY="muze_secret_key_2024"

# 2. PYTHON_ENGINE_URL (Change this if you are using a tunnel like ngrok)
# If your Python engine is local, you must use a tunnel for the cloud Edge Function to reach it.
# Example: https://abc-123.ngrok-free.app
PYTHON_URL="http://127.0.0.1:8001" 

echo "🚀 Setting Supabase Secrets..."

npx supabase secrets set ADMIN_SECRET_KEY=$ADMIN_KEY
npx supabase secrets set PYTHON_ENGINE_URL=$PYTHON_URL

echo "✅ Secrets set successfully!"
echo "💡 Tip: If you are developing locally, consider using 'supabase functions serve admin-proxy' to test without deploying."

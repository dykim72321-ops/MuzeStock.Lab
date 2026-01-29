#!/bin/bash

# MuzeStock.Lab Deployment Script

echo "🚀 Starting MuzeStock.Lab Deployment..."

# 1. Build Frontend
echo "📦 Building frontend..."
npm run build

# 2. Deploy Supabase Functions
echo "⚡ Deploying Supabase Edge Functions..."
PROJECT_REF="drnxydtrsjumjksqmdgi"
npx supabase functions deploy --project-ref $PROJECT_REF get-stock-quote
npx supabase functions deploy --project-ref $PROJECT_REF analyze-stock

# 3. Apply DB Migrations (Optional - usually done via CI/CD or Manual)
# echo "💾 Pushing database changes..."
# supabase db push

echo "✅ Deployment complete!"

---
description: how to deploy MuzeStock.Lab
---

This workflow automates the deployment of the Supabase backend and the frontend
build.

// turbo-all

1. Ensure you are logged in to Supabase `supabase login`
2. Link your project if not already linked
   `supabase link --project-ref your-project-ref`
3. Run the deployment script `bash deploy.sh`
4. Deploy the frontend `dist` folder to your provider (Netlify, Vercel, etc.)

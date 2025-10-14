# Vercel Deployment Instructions

## Problem: White Page on Vercel
The application shows a white page because environment variables are missing.

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `lines-liaison-v5`
3. Go to **Settings** tab
4. Click **Environment Variables**

### Step 2: Add Required Variables
Add these environment variables one by one:

```
NODE_ENV = production
VITE_SUPABASE_URL = https://ymstntjoewkyissepjbc.supabase.co
VITE_SUPABASE_ANON_KEY = [Your Supabase Anon Key]
VITE_APP_NAME = LiNES AND LiAiSON Professional Platform
VITE_DEBUG = false
VITE_ENABLE_LOGGING = false
```

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 4: Verify
- Visit your Vercel URL
- The application should load properly
- Check browser console for any remaining errors

## Important Notes
- All VITE_ variables are public and visible in the browser
- Never put secret keys in VITE_ variables
- The Supabase anon key is safe to expose (it's designed for frontend use)
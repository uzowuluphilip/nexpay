# Nex Pay Deployment Guide

This guide walks through deploying Nex Pay to Vercel with Supabase as the backend.

## Prerequisites

- [Vercel account](https://vercel.com) (free tier works)
- [Supabase project](https://supabase.com) (free tier works)
- GitHub repository with the Nex Pay code
- Node.js 18+ installed locally

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Enter project details:
   - **Name**: `nexpay` (or your choice)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

### 1.2 Get Your Credentials

From your Supabase project dashboard:

1. Go to **Settings → API**
2. Copy and save these values:
   - `SUPABASE_URL` (under "Project URL")
   - `SUPABASE_ANON_KEY` (under "anon public")
   - `SUPABASE_SERVICE_ROLE_KEY` (under "service_role secret" - keep this SECRET!)

### 1.3 Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy the entire contents of `sql/001-init-schema.sql` from this repo
4. Paste it into the SQL editor
5. Click **"Run"**
6. Wait for all tables and policies to be created
7. You should see success messages for each statement

### 1.4 Verify Tables

Go to **Table Editor** and verify these tables exist:
- `profiles`
- `pins`
- `transactions`
- `savings_plans`
- `market_assets`
- `investment_holdings`
- `balance_snapshots`

## Step 2: Configure Vercel

### 2.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Nex Pay fintech app"
git remote add origin https://github.com/YOUR_USERNAME/nexpay.git
git push -u origin main
```

### 2.2 Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Project"**
3. Paste your GitHub repository URL
4. Click **"Import"**
5. Vercel will auto-detect the Vite configuration

### 2.3 Add Environment Variables

In the Vercel import dialog:

1. Under **Environment Variables**, add:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   (Replace with your actual Supabase values from Step 1.2)

2. Click **"Deploy"**

### 2.4 Wait for Build

Vercel will:
1. Build your project
2. Run type checking
3. Deploy to a live URL

This takes about 2-3 minutes. You can watch the logs in real-time.

## Step 3: Verify Deployment

Once Vercel shows "✅ Production Deployment Ready":

1. Click the URL to open your live app
2. You should see the **Nex Pay landing page**
3. Try:
   - Clicking "Sign Up"
   - Toggling dark/light mode
   - Switching languages

If you see errors, check:
- Browser console (F12) for errors
- Vercel deployment logs
- Environment variables are set correctly

## Step 4: Set Up Serverless Functions (API)

For sensitive operations (PIN verification, balance updates), we need backend functions.

### 4.1 Create API Directory

Create `/api` folder in your project root:

```
/api
├── auth/
│   └── verify-pin.ts
├── wallet/
│   ├── deposit.ts
│   ├── withdraw.ts
│   └── send.ts
└── utils/
    ├── supabase.ts
    └── auth.ts
```

### 4.2 Create Supabase Admin Client

Create `api/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials in environment')
}

// Admin client with service role (use for sensitive operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
)
```

### 4.3 Update Environment Variables in Vercel

1. Go to your Vercel project settings
2. **Environment Variables**
3. Add:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Step 1.2)

⚠️ **IMPORTANT**: Service role key is secret - never commit it to git!

### 4.4 Create Verify PIN Function

Create `api/auth/verify-pin.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../utils/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, pin } = req.body

    // Get user's hashed PIN
    const { data, error } = await supabaseAdmin
      .from('pins')
      .select('hashed_pin')
      .eq('user_id', userId)
      .single()

    if (error) {
      return res.status(400).json({ error: 'PIN not found' })
    }

    // Compare PINs (in production, use bcrypt comparison)
    // For demo: simple comparison (UPDATE to bcrypt in production)
    const matches = data.hashed_pin === pin

    return res.json({
      verified: matches,
      message: matches ? 'PIN verified' : 'Invalid PIN',
    })
  } catch (error) {
    console.error('PIN verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
```

## Step 5: Test the Full Flow

### 5.1 Test Sign Up Flow

1. Open your deployed app URL
2. Click **"Sign Up"**
3. Enter:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "SecurePass123!"
   - Confirm: "SecurePass123!"
4. Click **"Sign Up"**
5. You should be redirected to **Create PIN**
6. Enter a 4-digit PIN twice
7. Click **"Submit"**
8. You should see the **Dashboard**

### 5.2 Verify Database

In Supabase dashboard:

1. Go to **Table Editor**
2. Check `profiles` table - you should see your new user
3. Check `pins` table - you should see the PIN entry
4. Check the Supabase Auth tab - your user account should be listed

### 5.3 Test Login Flow

1. Log out (click **Logout** button)
2. You should be redirected to **Landing Page**
3. Click **"Log In"**
4. Enter your email and password from Step 5.1
5. You should be redirected to **Dashboard**

## Step 6: Set Up CI/CD (Optional but Recommended)

### 6.1 Add GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

### 6.2 Add Vercel Token to GitHub

1. In Vercel: **Settings → Tokens**
2. Create a new token
3. Go to GitHub repo: **Settings → Secrets**
4. Add `VERCEL_TOKEN` with your token
5. Every push to `main` will now auto-deploy!

## Step 7: Monitor and Maintain

### 7.1 Check Logs

**Vercel Logs:**
- Go to your Vercel project
- Click **"Deployments"** tab
- Click any deployment to see build logs

**Supabase Logs:**
- Go to Supabase dashboard
- Click **"Database"** → **"Connections"**
- View query logs and errors

### 7.2 Monitor Performance

**Vercel Analytics:**
- Go to your Vercel project
- Click **"Analytics"** tab
- View page load times, errors, etc.

**Supabase Monitoring:**
- Go to Supabase dashboard
- Check database performance and API usage

## Step 8: Troubleshooting

### Issue: "Missing environment variable"

**Solution:** Add variables in Vercel project settings under **Environment Variables**

### Issue: "Table does not exist" or "Permission denied"

**Solution:** 
1. Re-run the SQL migration in Supabase SQL Editor
2. Verify RLS policies are enabled
3. Check that service role key is correct

### Issue: "CORS error" on API calls

**Solution:** Add CORS headers in Vercel function:

```typescript
res.setHeader('Access-Control-Allow-Origin', '*')
res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
```

### Issue: White screen on load

**Solution:**
1. Open browser DevTools (F12)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests
4. Check Vercel deployment logs

## Step 9: Production Checklist

Before considering this production-ready:

- [ ] All environment variables set in Vercel
- [ ] Database schema created and tested
- [ ] Authentication flow tested end-to-end
- [ ] PIN creation and verification working
- [ ] All pages render correctly
- [ ] Dark/light mode toggle persists
- [ ] Language switcher works
- [ ] Mobile responsive at 375px width
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No unhandled API errors
- [ ] RLS policies verified
- [ ] Service role key NOT in version control

## Step 10: Going Further

### Add Custom Domain

1. In Vercel: **Settings → Domains**
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)

### Enable Edge Caching

1. In Vercel: **Settings → Functions**
2. Set cache duration for API functions
3. Improves performance globally

### Add Monitoring

```bash
npm install @sentry/vercel
```

Track errors across all users in real-time.

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Nex Pay Issues**: Check this repo's Issues tab

---

**Congratulations!** Your Nex Pay fintech app is now live and accessible to the world! 🚀

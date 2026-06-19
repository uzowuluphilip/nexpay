# ⚡ Nex Pay - Quick Start Guide

Get up and running in 5 minutes.

## 1. Install Dependencies

```bash
cd c:\xampppppp\htdocss\NexPay
npm install
```

Expected time: ~2 minutes

## 2. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a free account or sign in
3. Create new project:
   - Name: `nexpay-dev`
   - Database Password: (create strong password)
   - Region: (closest to you)
4. Wait 2 minutes for project creation
5. Go to **Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

## 3. Set Environment Variables

Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with your actual Supabase values.

## 4. Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy entire contents of `sql/001-init-schema.sql`
4. Paste into SQL editor
5. Click **"Run"**
6. You should see: "Successfully created 8 tables"

## 5. Start Development Server

```bash
npm run dev
```

This will:
- Start dev server at http://localhost:5173
- Open in your browser automatically
- Watch for changes and auto-reload

## 6. Test the App

1. Click **"Sign Up"** button
2. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123!
3. Click **"Sign Up"** → Redirects to **PIN Creation**
4. Enter 4-digit PIN (e.g., 1234)
5. Click **"Submit"** → Redirects to **Dashboard**

🎉 You're in! You should see:
- Welcome message with your name
- Balance cards (empty, since no transactions)
- Growth chart (empty)
- Quick action buttons

## Available Commands

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## Folder Structure

```
src/
├── pages/           # Page components
├── components/      # Reusable components
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
├── utils/          # Utility functions
├── config/         # Configuration
├── styles/         # Global styles
└── main.tsx        # Entry point

api/
└── example-endpoint.ts    # Template for serverless functions

sql/
└── 001-init-schema.sql    # Database schema migration
```

## Troubleshooting

### "Cannot find module" Error

Solution: Run `npm install` again

### "Missing Supabase credentials"

Solution: Check `.env.local` file has correct values

### Database tables don't exist

Solution: Re-run SQL migration in Supabase SQL Editor

### Button clicks don't work

Solution: Check browser console (F12) for errors

### Theme not persisting

Solution: Clear localStorage:
```javascript
localStorage.clear()
```

## What's Working

✅ Landing page  
✅ Sign up & login  
✅ PIN creation  
✅ Dashboard with data  
✅ Transaction history  
✅ Dark/Light mode  
✅ Language switcher (en/es/fr)  
✅ Mobile responsive  

## What's Not Yet Implemented

⏳ Deposit/Withdraw forms  
⏳ Send money flow  
⏳ Savings plans  
⏳ Investment trading  
⏳ API endpoints  

## Next Steps

1. **Explore the app** - Click around and see what works
2. **Read DEPLOYMENT.md** - When ready to launch publicly
3. **Read API.md** - To understand endpoint structure
4. **Check PROJECT_STATUS.md** - For complete feature list

## Documentation Files

| File | Purpose |
|------|---------|
| README.md | Feature overview |
| SCHEMA.md | Database design |
| DEPLOYMENT.md | Vercel setup guide |
| API.md | Backend endpoint reference |
| PROJECT_STATUS.md | Complete project status |
| LAUNCH_CHECKLIST.md | Pre-launch tasks |
| QUICK_START.md | This file |

## Getting Help

1. Check `DEPLOYMENT.md` for common issues
2. Review `PROJECT_STATUS.md` for feature status
3. Look at console errors (F12 → Console tab)
4. Check Supabase dashboard for database issues

## Key Features to Try

1. **Dark Mode** - Click moon icon in top right
2. **Language Switch** - Click language dropdown
3. **Sign Out** - Click Logout button, then Sign In again
4. **Responsive Design** - Resize browser to 375px width

---

**Happy Building! 🚀**

Questions? Check the documentation files or review the code. It's all there!

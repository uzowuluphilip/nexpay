# Nex Pay - Smart Finance

A production-quality fintech web application demo built with modern web technologies. This is a portfolio project demonstrating real fintech logic, secure authentication, and honest financial calculations.

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) for server state
- **Backend**: Node.js + Express (Vercel Serverless Functions in `/api` folder)
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Internationalization**: react-i18next (English, Spanish, French)
- **Charts**: recharts for analytics and growth visualization
- **Icons**: lucide-react
- **Deployment**: Vercel (frontend + serverless API)

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account and project (free tier is sufficient)
- Vercel account (for deployment)

## 🔧 Environment Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (note your `SUPABASE_URL` and `SUPABASE_ANON_KEY`)
3. (Optional) Get your `SUPABASE_SERVICE_ROLE_KEY` for backend API functions
4. Run the SQL migrations in `SCHEMA.md` in the Supabase SQL editor to set up tables and RLS policies

### 2. Local Development Setup

```bash
# Clone the repository
git clone <repo-url>
cd NexPay

# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local

# Edit .env.local and add your Supabase URL and keys:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
NexPay/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx           # Public landing page
│   │   ├── auth/
│   │   │   ├── SignUpPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── CreatePINPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx     # Main authenticated dashboard
│   │   ├── wallet/
│   │   │   └── WalletPage.tsx        # Deposit, Withdraw, Send
│   │   ├── grow/
│   │   │   └── GrowPage.tsx          # Savings & Investments
│   │   ├── stats/
│   │   │   └── StatsPage.tsx         # Analytics
│   │   └── activity/
│   │       └── ActivityPage.tsx      # Transaction history
│   ├── components/
│   │   ├── common/                   # Reusable UI components
│   │   ├── forms/                    # Form components
│   │   ├── cards/                    # Card components
│   │   └── navigation/               # Nav components
│   ├── config/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── i18n.ts                  # i18n configuration
│   │   └── locales/
│   │       ├── en.json
│   │       ├── es.json
│   │       └── fr.json
│   ├── hooks/                        # Custom React hooks
│   ├── utils/                        # Helper utilities
│   ├── types/                        # TypeScript types
│   ├── styles/
│   │   └── globals.css              # Global styles & animations
│   ├── App.tsx                       # Main App component with routing
│   └── main.tsx                      # Entry point
├── api/                              # Vercel serverless functions
│   ├── auth/
│   │   ├── signup.ts
│   │   ├── login.ts
│   │   └── verify-pin.ts
│   ├── wallet/
│   │   ├── deposit.ts
│   │   ├── withdraw.ts
│   │   └── send.ts
│   ├── grow/
│   │   ├── create-savings-plan.ts
│   │   ├── buy-investment.ts
│   │   └── sell-investment.ts
│   └── utils/
│       ├── supabase.ts              # Supabase admin client
│       └── bcrypt.ts                # PIN hashing
├── SCHEMA.md                         # Database schema documentation
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.js               # Tailwind configuration
├── postcss.config.js                # PostCSS configuration
├── package.json
├── .env.example                     # Environment variables template
└── README.md                         # This file
```

## 🔐 Security Features

### Authentication
- Email + password signup/login via Supabase Auth
- Forgot password flow
- Automatic session management

### Transaction Security
- **PIN-Protected Transactions**: All money movements require a 4-digit PIN
- PIN is bcrypt-hashed server-side, never stored in plaintext
- PIN verification happens only in serverless `/api` functions
- PIN is required for: deposits, withdrawals, transfers, investment trades

### Data Privacy
- Row Level Security (RLS) on all tables — users only access their own data
- Service Role Key never exposed to frontend
- All sensitive operations in backend `/api` functions only
- User balances computed from immutable transaction ledger

## 💰 Financial Logic

### Balance Calculation
All balances are computed from an immutable transaction ledger:

```
Total Balance = SUM(deposits, receives, interest, savings payouts, investment sells)
              - SUM(withdrawals, sends, investment buys)
```

### Available Balance
```
Available = Total Balance - Locked in Active Savings Plans
```

### Savings Plans
- Lock periods: 7, 30, 90, 180 days
- Interest rates: 2%, 5%, 8%, 12% respectively (simple interest)
- Interest paid only after lock period elapses
- Payout = Principal × (1 + Rate/100)

### Investments
- Simulated market with seeded price feed (consistent across refreshes)
- Unrealized P&L = Quantity × (Current Price - Entry Price)
- Cost basis tracked per purchase for accurate P&L
- Real portfolio valuation

## 🌍 Internationalization (i18n)

The app supports English, Spanish, and French. Language preference is stored in localStorage and persists across sessions.

### Adding a New Language
1. Create a new translation file in `src/config/locales/` (e.g., `pt.json`)
2. Add the language to `src/config/i18n.ts`
3. Update the language selector in the navigation component

## 🌓 Dark Mode

Dark mode preference is persisted in localStorage and respects system preferences on first load. Users can toggle via the theme switcher in navigation.

## 📊 Data Visualization

- **Growth Chart**: Daily balance snapshots rendered with recharts
- **Analytics**: Portfolio breakdown, net worth trends, profit/loss tracking
- All charts render real data computed from the transaction ledger

## 🚢 Deployment to Vercel

### 1. Prepare the Project

```bash
# Build for production
npm run build

# Verify production build runs locally
npm run preview
```

### 2. Connect to Vercel

```bash
# Install Vercel CLI (optional, can also use Vercel web dashboard)
npm install -g vercel

# Deploy
vercel
```

Or:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect the Vite configuration

### 3. Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project settings
2. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

For backend API functions:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)

### 4. Redeploy

After setting environment variables, redeploy or trigger a new build.

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### Manual Testing Checklist

1. **Authentication Flow**
   - [ ] Sign up with email
   - [ ] Verify PIN creation screen appears after signup
   - [ ] Login with correct credentials
   - [ ] Logout functionality
   - [ ] Forgot password flow

2. **Wallet Operations**
   - [ ] Deposit funds (balance updates correctly)
   - [ ] Withdraw funds (insufficient funds error handled)
   - [ ] Send money to another user (both balances update)

3. **Savings & Investments**
   - [ ] Create savings plan (lock period sets correctly)
   - [ ] Cannot withdraw before unlock date
   - [ ] View market assets and prices
   - [ ] Buy investment (balance deducts, holding created)
   - [ ] See unrealized P&L

4. **Analytics**
   - [ ] Growth chart displays balance history
   - [ ] Stats show correct calculations
   - [ ] Activity history complete and accurate

5. **Responsive Design** (at 375px width minimum)
   - [ ] Landing page mobile layout
   - [ ] Dashboard responsive
   - [ ] Bottom nav accessible and functional
   - [ ] All forms work on mobile
   - [ ] No horizontal scrolling

6. **Internationalization**
   - [ ] Switch between English, Spanish, French
   - [ ] All labels translate correctly
   - [ ] Language persists on reload

7. **Dark/Light Mode**
   - [ ] Toggle between modes
   - [ ] All colors readable in both modes
   - [ ] Preference persists on reload

## 🐛 Debugging

### View Console Errors
Open browser DevTools (F12) and check the Console tab for any errors.

### Check Supabase Logs
Go to your Supabase project dashboard > Logs to see database and auth events.

### Enable Debug Logging
Add to your `.env.local`:
```
VITE_DEBUG=true
```

## 📚 Additional Documentation

- **Database Schema**: See [SCHEMA.md](./SCHEMA.md) for complete database design
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Vercel setup
- **API Documentation**: See [API.md](./API.md) for serverless function endpoints

## ✅ Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database schema and RLS policies applied
- [ ] All pages tested at mobile width (375px minimum)
- [ ] No console errors or warnings
- [ ] All forms validated both client and server-side
- [ ] Dark/light mode toggle working and persistent
- [ ] i18n translations complete for all pages
- [ ] Loading states, error states, and empty states designed
- [ ] PIN hashing implemented server-side
- [ ] All sensitive operations in `/api` backend functions
- [ ] Vercel environment variables set securely

## 📝 License

This project is provided as-is for portfolio/demonstration purposes.

## 🤝 Support

For issues or questions:
1. Check the database schema in `SCHEMA.md`
2. Review the environment variables in `.env.example`
3. Check browser console for errors
4. Review Supabase logs and auth state

---

**Built with ❤️ as a fintech portfolio project demonstrating real financial logic, security best practices, and professional code quality.**

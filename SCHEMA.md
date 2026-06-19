# Nex Pay Database Schema

This document defines the complete database schema for Nex Pay, a fintech web application built on Supabase (PostgreSQL).

## Overview

All tables use Row Level Security (RLS) to ensure users can only access their own data. Timestamps are stored in UTC using `timestamptz`.

---

## Tables

### 1. `profiles`

Extended user profile information linked to Supabase `auth.users`.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policy:**
- Users can only view and update their own profile

---

### 2. `pins`

Stores hashed transaction PINs (4-digit codes).

```sql
CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hashed_pin TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Notes:**
- `hashed_pin` is bcrypt-hashed server-side via `/api` functions
- PIN is never stored in plaintext
- PIN is required for: withdrawals, transfers (sends), investment transactions, and savings plan withdrawals

**RLS Policy:**
- Users can only access their own PIN metadata (not the hash itself)

---

### 3. `transactions`

Complete ledger of all financial movements.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'deposit',
    'withdraw',
    'send',
    'receive',
    'invest_buy',
    'invest_sell',
    'interest',
    'savings_payout'
  )),
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'reversed'
  )),
  description TEXT,
  counterparty_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}' -- For storing additional context (e.g., asset_id for invest transactions)
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

**Notes:**
- `type` categorizes the transaction
- `counterparty_user_id` is used for send/receive transactions (sender -> receiver)
- `metadata` can store asset IDs, plan IDs, or other transaction-specific data
- All deposits, withdrawals, sends, and investment transactions are final (`status = 'completed'`)
- Interest payouts are generated via a server-side scheduled job (or computed on-demand)

**RLS Policy:**
- Users can only view their own transactions
- Users cannot directly insert/update/delete transactions (server-side API only)

---

### 4. `savings_plans`

Locked savings with interest accrual.

```sql
CREATE TABLE savings_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('7d', '30d', '90d', '180d')),
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  interest_rate DECIMAL(5, 2) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlock_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'matured',
    'withdrawn',
    'cancelled'
  )),
  payout_amount DECIMAL(18, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_savings_plans_user_id ON savings_plans(user_id);
CREATE INDEX idx_savings_plans_status ON savings_plans(status);
```

**Notes:**
- Interest rates: 2% (7d), 5% (30d), 8% (90d), 12% (180d)
- `unlock_date` is calculated as `start_date + lock period`
- Simple interest calculated: `payout_amount = amount * (1 + interest_rate/100)`
- A plan can only be withdrawn after `unlock_date` is in the past
- Status `'matured'` means the lock period has elapsed; `'withdrawn'` means funds were claimed

**RLS Policy:**
- Users can only view and manage their own savings plans
- Users cannot directly insert/update (only via `/api`)

---

### 5. `market_assets`

Simulated market assets (stocks, indices, cryptocurrencies) with price history.

```sql
CREATE TABLE market_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  current_price DECIMAL(18, 8) NOT NULL CHECK (current_price > 0),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Notes:**
- This is a shared, read-only table for all users
- Prices are updated via a server-side price feed (simulated as a seeded random walk)
- Example assets: `TECH` (Tech Index), `GOLD` (Gold), `OIL` (Oil), `BTC` (Bitcoin), `ETH` (Ethereum), `STOCK` (Stock Index)

**RLS Policy:**
- All authenticated users can read market assets
- No user can modify market assets (admin-only via backend)

---

### 6. `investment_holdings`

User's portfolio of market assets.

```sql
CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
  quantity DECIMAL(18, 8) NOT NULL CHECK (quantity > 0),
  entry_price DECIMAL(18, 8) NOT NULL CHECK (entry_price > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);
```

**Notes:**
- `quantity` tracks how many units the user owns
- `entry_price` is the average price paid per unit
- Unrealized P&L = quantity * (current_price - entry_price)
- When a user sells all holdings, the record is deleted
- When a user adds to a position, `entry_price` is recalculated as a weighted average

**RLS Policy:**
- Users can only view their own holdings
- Users cannot directly insert/update (only via `/api`)

---

### 7. `balance_snapshots`

Daily snapshots of user balances for charting and analytics.

```sql
CREATE TABLE balance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(18, 2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_balance_snapshots_user_id_recorded_at ON balance_snapshots(user_id, recorded_at);
```

**Notes:**
- `balance` is the user's total available balance at that point in time
- `recorded_at` is typically the start of each day (UTC midnight)
- A balance snapshot is created daily via a scheduled job, or on significant transactions
- Used to render the "Growth" chart on the dashboard

**RLS Policy:**
- Users can only view their own balance snapshots

---

## Key Derived/Computed Metrics

The following are computed in real-time from the schema above:

### Total Balance
```
total_balance = (
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE user_id = ? AND status = 'completed'
  AND type IN ('deposit', 'receive', 'interest', 'savings_payout', 'invest_sell')
  MINUS
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE user_id = ? AND status = 'completed'
  AND type IN ('withdraw', 'send', 'invest_buy')
)
```

### Available Balance
```
available_balance = total_balance - (
  SELECT COALESCE(SUM(amount), 0)
  FROM savings_plans
  WHERE user_id = ? AND status = 'active'
)
```

### Invested Amount
```
invested_amount = (
  SELECT COALESCE(SUM(quantity * current_price), 0)
  FROM investment_holdings
  JOIN market_assets ON investment_holdings.asset_id = market_assets.id
  WHERE investment_holdings.user_id = ?
)
```

### Net Worth
```
net_worth = available_balance + (
  SELECT COALESCE(SUM(amount), 0)
  FROM savings_plans
  WHERE user_id = ? AND status = 'active'
) + invested_amount
```

### Unrealized Profit/Loss
```
unrealized_pl = (
  SELECT COALESCE(SUM(quantity * (market_assets.current_price - entry_price)), 0)
  FROM investment_holdings
  JOIN market_assets ON investment_holdings.asset_id = market_assets.id
  WHERE investment_holdings.user_id = ?
)
```

### Realized Profit (from completed sells)
```
realized_profit = (
  SELECT COALESCE(SUM(
    CASE
      WHEN quantity > entry_price THEN quantity * (quantity - entry_price)
      ELSE 0
    END
  ), 0)
  FROM investment_holdings
  WHERE user_id = ? AND ...
)
-- Note: This is simplified; actual logic tracks buy/sell pairs
```

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Here are the core policies:

### Profiles
```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Transactions
```sql
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### Savings Plans
```sql
CREATE POLICY "Users can view own savings plans"
  ON savings_plans FOR SELECT
  USING (auth.uid() = user_id);
```

### Investment Holdings
```sql
CREATE POLICY "Users can view own holdings"
  ON investment_holdings FOR SELECT
  USING (auth.uid() = user_id);
```

### Balance Snapshots
```sql
CREATE POLICY "Users can view own balance snapshots"
  ON balance_snapshots FOR SELECT
  USING (auth.uid() = user_id);
```

### Market Assets
```sql
CREATE POLICY "Anyone can view market assets"
  ON market_assets FOR SELECT
  USING (true);
```

---

## Indexes

For performance, the following indexes are defined:

| Table | Columns | Purpose |
|-------|---------|---------|
| `transactions` | `(user_id)` | Fast lookup of user's transactions |
| `transactions` | `(created_at)` | Sort transactions by date |
| `savings_plans` | `(user_id)` | Fast lookup of user's plans |
| `savings_plans` | `(status)` | Filter by active/matured plans |
| `investment_holdings` | `(user_id)` | Fast lookup of user's holdings |
| `balance_snapshots` | `(user_id, recorded_at)` | Efficient time-series queries for charts |

---

## Notes on Data Integrity

1. **Constraints**: All monetary amounts use `DECIMAL(18, 2)` to avoid floating-point errors
2. **Timestamps**: All use `TIMESTAMPTZ` (UTC) for consistency across time zones
3. **Cascading Deletes**: User deletion cascades to all user-owned data
4. **Immutability**: Transactions are immutable once created (`status = 'completed'`); reversals are new transactions with negative amounts
5. **Balances**: Never stored directly; always computed from transaction history for accuracy
6. **PIN Verification**: PINs are hashed with bcrypt on the backend and never returned to the frontend

---

## Setup Instructions

Run the following SQL in Supabase's SQL editor to initialize the schema:

1. Create all tables (see above)
2. Enable RLS on all tables: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
3. Create RLS policies (see above)
4. Create indexes (see above)
5. Test via the Supabase dashboard or API

---

## Future Enhancements

- **Audit logs**: Track all data changes for compliance
- **Dispute resolution**: Track disputed transactions
- **Scheduled payouts**: Automated interest/reward distribution
- **Fee tracking**: Deduct fees from transactions
- **KYC/AML**: User verification and anti-money-laundering checks

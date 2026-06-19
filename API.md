# Nex Pay API Reference

Backend API endpoints for Nex Pay serverless functions (Vercel Functions).

## Base URL

```
https://nexpay.vercel.app/api
```

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <user_auth_token>
```

Get the token from `supabase.auth.getSession()` in the frontend.

## Response Format

All responses are JSON:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses include an `error` field with a message.

---

## Authentication Endpoints

### POST /auth/verify-pin

Verify a user's transaction PIN.

**Request:**
```json
{
  "pin": "1234"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "PIN verified"
}
```

**Status Codes:**
- `200`: PIN verification result
- `401`: Unauthorized
- `400`: PIN not found
- `500`: Server error

---

## Wallet Endpoints

### POST /wallet/deposit

Create a deposit transaction (add funds to account).

**Request:**
```json
{
  "amount": 100.50,
  "description": "Bank transfer"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "deposit",
    "amount": 100.50,
    "status": "completed",
    "created_at": "2024-06-19T..."
  },
  "balance": 500.75
}
```

### POST /wallet/withdraw

Withdraw funds from account (requires PIN verification first).

**Request:**
```json
{
  "amount": 50.00,
  "pin": "1234",
  "description": "Bank withdrawal"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": { ... },
  "balance": 450.75
}
```

**Status Codes:**
- `200`: Withdrawal successful
- `400`: Invalid amount or insufficient funds
- `401`: Invalid PIN
- `500`: Server error

### POST /wallet/send

Send money to another Nex Pay user (requires PIN).

**Request:**
```json
{
  "recipient_email": "friend@example.com",
  "amount": 25.00,
  "pin": "1234",
  "description": "Payment for lunch"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": { ... },
  "balance": 425.75
}
```

**Status Codes:**
- `200`: Transfer successful
- `400`: User not found, invalid amount, self-transfer
- `401`: Invalid PIN
- `500`: Server error

---

## Savings Endpoints

### POST /savings/create-plan

Create a new savings plan.

**Request:**
```json
{
  "plan_type": "30d",
  "amount": 500.00,
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "plan": {
    "id": "uuid",
    "plan_type": "30d",
    "amount": 500.00,
    "interest_rate": 5.00,
    "unlock_date": "2024-07-19T...",
    "status": "active"
  }
}
```

Plan Types & Interest Rates:
- `7d`: 2%
- `30d`: 5%
- `90d`: 8%
- `180d`: 12%

### POST /savings/unlock-plan

Unlock and withdraw a matured savings plan.

**Request:**
```json
{
  "plan_id": "uuid",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "type": "savings_payout",
    "amount": 525.00
  },
  "balance": 950.75
}
```

---

## Investment Endpoints

### GET /investments/assets

Get all available market assets.

**Response:**
```json
{
  "success": true,
  "assets": [
    {
      "id": "uuid",
      "symbol": "TECH",
      "name": "Technology Index",
      "current_price": 150.50
    },
    ...
  ]
}
```

### POST /investments/buy

Buy an investment asset.

**Request:**
```json
{
  "asset_id": "uuid",
  "quantity": 2.5,
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "holding": {
    "id": "uuid",
    "asset_id": "uuid",
    "quantity": 2.5,
    "entry_price": 150.50,
    "total_cost": 376.25
  },
  "balance": 574.50
}
```

### POST /investments/sell

Sell an investment asset.

**Request:**
```json
{
  "holding_id": "uuid",
  "quantity": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "type": "invest_sell",
    "amount": 150.50
  },
  "balance": 725.00,
  "profit_loss": 0.00
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid amount"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid token" OR "Invalid PIN"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Authentication endpoints: 10 requests/minute per user
- Wallet endpoints: 30 requests/minute per user
- Investment endpoints: 50 requests/minute per user

Rate limit info is returned in response headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1624195200
```

---

## Implementation Notes

### Token Management

```typescript
import { supabase } from '@/config/supabase'

// Get current token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Use in API calls
const response = await fetch('/api/wallet/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ amount: 100 }),
})
```

### Error Handling

```typescript
try {
  const response = await fetch('/api/wallet/deposit', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ amount: 100 }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'API error')
  }

  console.log('Deposit successful:', data)
} catch (error) {
  console.error('Deposit failed:', error.message)
}
```

---

## Testing Endpoints

Use curl to test endpoints locally:

```bash
# Verify token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/wallet/deposit \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Database Schema](./SCHEMA.md)
- [README](./README.md)

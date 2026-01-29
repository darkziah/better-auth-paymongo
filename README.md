# better-auth-paymongo

A [PayMongo](https://paymongo.com) payment gateway plugin for [Better-Auth](https://github.com/better-auth/better-auth) with feature-based billing, usage metering, and **no webhooks required**.

Built on the [Autumn billing pattern](https://useautumn.com) - your billing state lives in PayMongo, not your database.

## Features

- **No Webhooks** - Verify payments on-demand with intelligent caching
- **Feature-Based Access** - Define features, not just plans
- **Usage Metering** - Track and limit API calls, storage, etc.
- **User & Organization Billing** - Support both scopes
- **React Hooks** - `useCheck()`, `useSubscription()` for reactive UI
- **Philippine Payment Methods** - GCash, GrabPay, Cards via PayMongo

## Installation

```bash
npm install better-auth-paymongo
# or
bun add better-auth-paymongo
# or
pnpm add better-auth-paymongo
```

## Quick Start

### 1. Configure the Server Plugin

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { paymongo } from "better-auth-paymongo";

export const auth = betterAuth({
  // ... your auth config
  plugins: [
    paymongo({
      secretKey: process.env.PAYMONGO_SECRET_KEY!,
      
      // Define your features
      features: {
        projects: { type: "metered", limit: 3 },      // Usage-limited
        api_calls: { type: "metered", limit: 1000 },  // Usage-limited
        premium_support: { type: "boolean" },          // Access-only
        export_pdf: { type: "boolean" },               // Access-only
      },
      
      // Define your plans
      plans: {
        free: {
          amount: 0,
          currency: "PHP",
          displayName: "Free",
          interval: "monthly",
          features: {
            projects: 3,        // Override: 3 projects
            api_calls: 100,     // Override: 100 API calls
            premium_support: false,
            export_pdf: false,
          },
        },
        pro: {
          amount: 99900,        // 999.00 PHP (in centavos)
          currency: "PHP",
          displayName: "Pro",
          interval: "monthly",
          features: {
            projects: 25,
            api_calls: 10000,
            premium_support: true,
            export_pdf: true,
          },
        },
        enterprise: {
          amount: 499900,       // 4,999.00 PHP
          currency: "PHP",
          displayName: "Enterprise",
          interval: "monthly",
          features: {
            projects: 100,
            api_calls: 100000,
            premium_support: true,
            export_pdf: true,
          },
        },
      },
      
      // Optional: Enable organization billing
      scopes: ["user", "organization"],
    }),
  ],
});
```

### 2. Configure the Client Plugin

```typescript
// auth-client.ts
import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  plugins: [paymongoClient()],
});
```

### 3. Run Database Migrations

The plugin automatically creates a `paymongoUsage` table. Run your Better-Auth migrations:

```bash
npx better-auth migrate
```

## API Reference

### Server Endpoints

The plugin exposes three endpoints:

#### `POST /api/auth/paymongo/attach`

Create a checkout session for a plan purchase.

**Request:**
```json
{
  "planId": "pro",
  "successUrl": "https://yourapp.com/billing/success",
  "cancelUrl": "https://yourapp.com/billing/cancel",
  "organizationId": "org_123"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.paymongo.com/cs_...",
  "sessionId": "cs_..."
}
```

#### `GET /api/auth/paymongo/check`

Check feature access and usage balance.

**Request:**
```
GET /api/auth/paymongo/check?feature=projects&organizationId=org_123
```

**Response (metered feature):**
```json
{
  "allowed": true,
  "balance": 22,
  "limit": 25,
  "planId": "pro"
}
```

**Response (boolean feature):**
```json
{
  "allowed": true,
  "planId": "pro"
}
```

**Response (no subscription):**
```json
{
  "allowed": false
}
```

#### `POST /api/auth/paymongo/track`

Record usage for metered features.

**Request:**
```json
{
  "feature": "api_calls",
  "delta": 1,
  "organizationId": "org_123"
}
```

**Response:**
```json
{
  "success": true,
  "balance": 9999,
  "limit": 10000
}
```

---

## Client SDK

### Actions

```typescript
import { authClient } from "./auth-client";

// Subscribe to a plan
const { data, error } = await authClient.paymongo.attach("pro", {
  successUrl: window.location.origin + "/billing/success",
  cancelUrl: window.location.origin + "/billing/cancel",
});

if (data) {
  // Redirect to PayMongo checkout
  window.location.href = data.checkoutUrl;
}

// Check feature access
const { data: check } = await authClient.paymongo.check("projects");
if (check?.allowed) {
  // User has access to projects feature
  console.log(`${check.balance} / ${check.limit} projects remaining`);
}

// Track usage
const { data: track } = await authClient.paymongo.track("api_calls");
console.log(`API calls remaining: ${track?.balance}`);
```

### Organization Billing

```typescript
// Attach plan to an organization
await authClient.paymongo.attach("enterprise", {
  successUrl: "/success",
  cancelUrl: "/cancel",
  organizationId: "org_123",
});

// Check organization features
const { data } = await authClient.paymongo.check("projects", {
  organizationId: "org_123",
});

// Track organization usage
await authClient.paymongo.track("api_calls", {
  delta: 5,
  organizationId: "org_123",
});
```

---

## Seat-Based Organization Billing

The plugin provides built-in support for seat-based billing in organizations. This allows you to limit the number of members an organization can have based on their active subscription plan.

### Example Setup

To enable seat-based billing, use the `createPaymongoOrganization` helper when configuring the Better-Auth organization plugin.

```typescript
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { paymongo, createPaymongoOrganization } from "better-auth-paymongo";

const paymongoConfig = {
  secretKey: process.env.PAYMONGO_SECRET_KEY!,
  features: {
    seats: { type: "metered", limit: 5 },
    projects: { type: "metered", limit: 10 },
  },
  plans: {
    starter: {
      amount: 49900,
      currency: "PHP",
      displayName: "Starter",
      interval: "monthly",
      features: { seats: 5, projects: 10 },
    },
    pro: {
      amount: 99900,
      currency: "PHP",
      displayName: "Pro", 
      interval: "monthly",
      features: { seats: 25, projects: 50 },
    },
  },
};

export const auth = betterAuth({
  plugins: [
    paymongo(paymongoConfig),
    organization({
      ...createPaymongoOrganization(paymongoConfig),
    }),
  ],
});
```

### API Reference

#### `createPaymongoOrganization(config, seatConfig?)`

Creates an organization plugin configuration with `membershipLimit` integration.

- **Parameters:**
  - `config`: Your `PaymongoAutumnConfig`
  - `seatConfig`: (Optional)
    - `featureId`: Feature ID to use (defaults to `'seats'`)
    - `defaultLimit`: Limit when no subscription exists (defaults to `5`)
- **Returns:** An object with `membershipLimit` function.

#### `createSeatLimit(adapter, options?)`

Creates a standalone `membershipLimit` function if you prefer not to use the helper above.

```typescript
organization({
  membershipLimit: createSeatLimit(adapter, {
    featureId: 'seats',
    defaultLimit: 5
  })
})
```

#### `getOrganizationSeats(adapter, orgId, featureId?)`

Retrieves structured seat usage information for an organization.

```typescript
const { used, limit, remaining } = await getOrganizationSeats(adapter, "org_123");
```

### How it Works

Seats are treated as a standard **metered feature**. When a user tries to join or be invited to an organization, Better-Auth calls the `membershipLimit` function. This plugin then checks the `paymongoUsage` table for the organization's current `seats` balance.

- No special database tables are needed beyond `paymongoUsage`.
- Limits are automatically synced from PayMongo when the organization checks its features.
- If no subscription exists, it falls back to the `defaultLimit`.

---

## React Hooks

```typescript
import { useCheck, useSubscription, refreshBilling } from "better-auth-paymongo/react";

function FeatureGate({ children }: { children: React.ReactNode }) {
  const { allowed, balance, limit, loading, error } = useCheck("projects");

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!allowed) return <UpgradePrompt />;

  return (
    <div>
      <p>Projects: {balance} / {limit}</p>
      {children}
    </div>
  );
}

function BillingStatus() {
  const { planId, loading, refresh } = useSubscription();

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Current Plan: {planId || "Free"}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

// Manually trigger refresh after checkout
function CheckoutSuccess() {
  useEffect(() => {
    refreshBilling(); // Triggers re-fetch for all hooks
  }, []);

  return <p>Payment successful!</p>;
}
```

### Hook Reference

#### `useCheck(featureId, options?)`

| Return | Type | Description |
|--------|------|-------------|
| `allowed` | `boolean` | Whether feature access is permitted |
| `balance` | `number \| undefined` | Remaining usage (metered only) |
| `limit` | `number \| undefined` | Total limit (metered only) |
| `planId` | `string \| undefined` | Current plan ID |
| `loading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error state |
| `refetch` | `() => void` | Manual refetch |

#### `useSubscription()`

| Return | Type | Description |
|--------|------|-------------|
| `planId` | `string \| null` | Current plan ID |
| `loading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error state |
| `refresh` | `() => void` | Manual refresh |

#### `refreshBilling()`

Triggers a global refresh for all `useCheck` and `useSubscription` hooks.

---

## Concepts

### Feature Types

| Type | Description | Example |
|------|-------------|---------|
| `boolean` | Simple access control | `premium_support`, `export_pdf` |
| `metered` | Usage-limited | `projects`, `api_calls`, `storage_gb` |

### The Autumn Pattern

This plugin follows the [Autumn billing pattern](https://useautumn.com):

1. **No local subscription state** - PayMongo is the source of truth
2. **Three simple endpoints** - `attach`, `check`, `track`
3. **No webhooks** - Poll payment status on-demand with 60s caching
4. **Lazy period rollover** - Reset usage when checking, not via cron

### Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Your App  │────▶│  /attach    │────▶│  PayMongo   │
│             │     │  endpoint   │     │  Checkout   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
┌─────────────┐     ┌─────────────┐
│  Success    │────▶│  /check     │──── Payment verified ✓
│  Redirect   │     │  endpoint   │     (cached 60s)
└─────────────┘     └─────────────┘
```

### Usage Tracking Flow

```
┌─────────────┐     ┌─────────────┐
│  API Call   │────▶│  /check     │──── allowed: true, balance: 100
│             │     │             │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Business   │────▶│  /track     │──── balance: 99
│  Logic      │     │             │
└─────────────┘     └─────────────┘
```

---

## Configuration Reference

### `PaymongoAutumnConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `secretKey` | `string` | Yes | PayMongo secret key (`sk_test_...` or `sk_live_...`) |
| `plans` | `Record<string, PlanConfig>` | Yes | Plan definitions |
| `features` | `Record<string, FeatureConfig>` | Yes | Feature definitions |
| `scopes` | `('user' \| 'organization')[]` | No | Billing scopes (default: `['user']`) |

### `PlanConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `amount` | `number` | Yes | Price in smallest currency unit (centavos). Min: 2000 |
| `currency` | `string` | Yes | ISO currency code (e.g., `"PHP"`) |
| `displayName` | `string` | Yes | Human-readable plan name |
| `interval` | `'monthly' \| 'yearly'` | Yes | Billing interval |
| `features` | `Record<string, boolean \| number>` | Yes | Feature access/limits |

### `FeatureConfig`

```typescript
// Boolean feature (access control)
{ type: "boolean" }

// Metered feature (usage tracking)
{ type: "metered", limit: 1000 }
```

---

## Database Schema

The plugin creates a `paymongoUsage` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `string` | Primary key |
| `entityType` | `string` | `"user"` or `"organization"` |
| `entityId` | `string` | User or organization ID |
| `featureId` | `string` | Feature identifier |
| `balance` | `number` | Remaining usage |
| `limit` | `number` | Maximum usage |
| `periodStart` | `date` | Current period start |
| `periodEnd` | `date` | Current period end |
| `planId` | `string` | Associated plan |
| `checkoutSessionId` | `string` | PayMongo session ID |
| `createdAt` | `date` | Created timestamp |
| `updatedAt` | `date` | Updated timestamp |

---

## Examples

### Protecting an API Route

```typescript
// Next.js API route example
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Check feature access
  const check = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/paymongo/check?feature=api_calls`, {
    headers: req.headers,
  }).then(r => r.json());

  if (!check.allowed) {
    return new Response("Usage limit exceeded", { status: 429 });
  }

  // Track usage
  await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/paymongo/track`, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ feature: "api_calls" }),
  });

  // Your business logic here
  return new Response("Success");
}
```

### Pricing Page

```tsx
import { authClient } from "@/lib/auth-client";

function PricingPage() {
  const handleSubscribe = async (planId: string) => {
    const { data, error } = await authClient.paymongo.attach(planId, {
      successUrl: `${window.location.origin}/billing/success`,
      cancelUrl: `${window.location.origin}/pricing`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    window.location.href = data.checkoutUrl;
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <PlanCard
        name="Free"
        price="₱0"
        features={["3 projects", "100 API calls"]}
        onSelect={() => {}}
      />
      <PlanCard
        name="Pro"
        price="₱999/mo"
        features={["25 projects", "10,000 API calls", "Premium support"]}
        onSelect={() => handleSubscribe("pro")}
      />
      <PlanCard
        name="Enterprise"
        price="₱4,999/mo"
        features={["100 projects", "100,000 API calls", "Priority support"]}
        onSelect={() => handleSubscribe("enterprise")}
      />
    </div>
  );
}
```

### Usage Dashboard

```tsx
import { useCheck, useSubscription } from "better-auth-paymongo/react";

function UsageDashboard() {
  const { planId } = useSubscription();
  const projects = useCheck("projects");
  const apiCalls = useCheck("api_calls");

  return (
    <div>
      <h2>Plan: {planId || "Free"}</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <UsageCard
          label="Projects"
          used={projects.limit! - projects.balance!}
          limit={projects.limit!}
        />
        <UsageCard
          label="API Calls"
          used={apiCalls.limit! - apiCalls.balance!}
          limit={apiCalls.limit!}
        />
      </div>
    </div>
  );
}

function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = (used / limit) * 100;
  
  return (
    <div className="p-4 border rounded">
      <p className="font-medium">{label}</p>
      <p className="text-2xl">{used} / {limit}</p>
      <div className="w-full bg-gray-200 rounded h-2 mt-2">
        <div 
          className="bg-blue-500 h-2 rounded" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
```

---

## PayMongo Setup

1. Create a [PayMongo account](https://dashboard.paymongo.com/signup)
2. Get your API keys from the dashboard
3. Use `sk_test_...` for development, `sk_live_...` for production

### Supported Payment Methods

- Credit/Debit Cards (Visa, Mastercard)
- GCash
- GrabPay
- Maya (PayMaya)

### Minimum Amount

PayMongo requires a minimum amount of **₱20.00** (2000 centavos) per transaction.

---

## TypeScript

Full TypeScript support with inferred types:

```typescript
import type {
  PaymongoAutumnConfig,
  PlanConfig,
  FeatureConfig,
  AttachResponse,
  CheckResponse,
  TrackResponse,
  UsageRecord,
} from "better-auth-paymongo";
```

---

## License

MIT

---

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## Support

- [GitHub Issues](https://github.com/darkziah/better-auth-paymongo/issues)
- [Better-Auth Documentation](https://better-auth.com)
- [PayMongo Documentation](https://developers.paymongo.com)

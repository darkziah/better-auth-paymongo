# better-auth-paymongo

A production-ready [PayMongo](https://paymongo.com) plugin for [Better-Auth](https://better-auth.com) enabling subscription management, add-ons, and usage-based billing for Philippine payment methods (GCash, PayMaya, Credit Cards).

## Features

- 🔐 **Subscription Management** - Create, verify, cancel, and switch plans
- 👥 **Dual Scope Support** - Works with both User and Organization subscriptions
- 📊 **Usage-Based Billing** - Track and enforce usage limits
- 🧩 **Add-ons System** - Quantity-based add-ons with limit bonuses
- ⚡ **No Webhooks Required** - Verification via direct API polling
- 🔒 **Type-Safe** - Full TypeScript support with generic plan/addon types
- ⚛️ **React Hooks** - Built-in hooks for reactive subscription state

## Installation

```bash
# From GitHub (recommended)
bun add github:darkziah/better-auth-paymongo

# npm
npm install github:darkziah/better-auth-paymongo

# pnpm
pnpm add github:darkziah/better-auth-paymongo
```

## Quick Start

### 1. Server Setup

```typescript
import { betterAuth } from "better-auth";
import { paymongo } from "better-auth-paymongo";

// Define your plans
const plans = {
  free: {
    priceId: "",
    displayName: "Free",
    limits: { projects: 3, apiCalls: 1000 }
  },
  pro: {
    priceId: "price_xxxxx", // PayMongo Price ID
    displayName: "Pro",
    limits: { projects: 10, apiCalls: 10000 },
    interval: "month"
  },
  enterprise: {
    priceId: "price_yyyyy",
    displayName: "Enterprise", 
    limits: { projects: -1, apiCalls: -1 }, // -1 = unlimited
    interval: "year"
  }
} as const;

// Define add-ons (optional)
const addons = {
  extraProjects: {
    priceId: "price_addon_xxxxx",
    displayName: "Extra Projects",
    type: "quantity" as const,
    limitBonuses: { projects: 5 }
  }
} as const;

export const auth = betterAuth({
  // ... your config
  plugins: [
    paymongo({
      secretKey: process.env.PAYMONGO_SECRET_KEY!,
      plans,
      addons,
      // Optional lifecycle hooks
      onSubscriptionCreate: async ({ userId, planId }) => {
        console.log(`User ${userId} subscribed to ${planId}`);
      },
      onSubscriptionCancel: async ({ userId }) => {
        console.log(`User ${userId} cancelled subscription`);
      }
    })
  ]
});
```

### 2. Client Setup

```typescript
import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  plugins: [paymongoClient()]
});

// Use the client
const { data } = await authClient.paymongo.getSubscription();
console.log(data?.planId, data?.status);
```

### 3. React Integration

```tsx
import { createAuthClient } from "better-auth/react";
import { paymongoClient } from "better-auth-paymongo/client";
import { createSubscriptionHooks } from "better-auth-paymongo/react";

const authClient = createAuthClient({ plugins: [paymongoClient()] });
const { usePlan, useIsSubscribed, useUsage } = createSubscriptionHooks(authClient);

// In your components
function PlanBadge() {
  const { planId, isActive, isLoading } = usePlan();
  
  if (isLoading) return <Spinner />;
  return <Badge variant={isActive ? "success" : "default"}>{planId ?? "Free"}</Badge>;
}

function FeatureGate({ children }: { children: React.ReactNode }) {
  const { isSubscribed } = useIsSubscribed();
  return isSubscribed ? <>{children}</> : <UpgradePrompt />;
}

function UsageIndicator() {
  const { usage } = useUsage("projects");
  return <Progress value={usage} />;
}

// For organization subscriptions
function OrgPlan({ orgId }: { orgId: string }) {
  const { planId } = usePlan({ organizationId: orgId });
  return <span>Org Plan: {planId}</span>;
}
```

## API Reference

### Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/paymongo/create-payment-intent` | POST | Create a payment intent for checkout |
| `/paymongo/create-subscription` | POST | Create a new subscription |
| `/paymongo/verify-subscription` | GET | Verify subscription status via API |
| `/paymongo/cancel-subscription` | POST | Cancel an active subscription |
| `/paymongo/switch-plan` | POST | Upgrade or downgrade plan |
| `/paymongo/add-addon` | POST | Add quantity-based add-ons |
| `/paymongo/check-usage` | GET | Check usage limits |
| `/paymongo/increment-usage` | POST | Increment/decrement usage counters |
| `/paymongo/get-subscription` | GET | Get active subscription data |

### Client Methods

```typescript
// Get plan ID for current user
const { data: planId } = await authClient.paymongo.getPlan();

// Get plan for organization
const { data: planId } = await authClient.paymongo.getPlan({ organizationId: "org_123" });

// Get full subscription data
const { data: subscription } = await authClient.paymongo.getSubscription();

// Check if subscribed
const { data: isActive } = await authClient.paymongo.hasActiveSubscription();
```

### React Hooks

```typescript
const { useSubscription, usePlan, useIsSubscribed, useUsage } = createSubscriptionHooks(authClient);

// Full subscription data with loading/error states
const { subscription, isLoading, error, refetch } = useSubscription();

// Just the plan with active status
const { planId, isActive, isTrialing } = usePlan();

// Boolean subscription check
const { isSubscribed } = useIsSubscribed();

// Usage tracking for a specific limit
const { usage, plan } = useUsage("projects");
```

### Configuration Options

```typescript
interface PaymongoPluginConfig {
  // Required
  secretKey: string;
  plans: Record<string, PlanConfig>;
  
  // Optional
  addons?: Record<string, AddonConfig>;
  
  // Lifecycle hooks (optional)
  onSubscriptionCreate?: (data) => void | Promise<void>;
  onSubscriptionVerify?: (data) => void | Promise<void>;
  onPlanSwitch?: (data) => void | Promise<void>;
  onSubscriptionCancel?: (data) => void | Promise<void>;
}
```

## Database Schema

The plugin extends the Better-Auth schema with a `paymongoData` field on both `user` and `organization` tables:

```sql
-- Added to user table
ALTER TABLE user ADD COLUMN paymongo_data TEXT;

-- Added to organization table (if using organizations)
ALTER TABLE organization ADD COLUMN paymongo_data TEXT;
```

Run `npx @better-auth/cli migrate` to apply schema changes.

## Trial Periods

Plans can include trial periods that don't require payment:

```typescript
const plans = {
  pro: {
    priceId: "price_xxx",
    displayName: "Pro",
    limits: { projects: 10 },
    trialPeriodDays: 14 // 14-day free trial
  }
};
```

## License

MIT

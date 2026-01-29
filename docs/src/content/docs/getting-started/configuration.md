---
title: "Configuration"
description: "Full configuration reference for better-auth-paymongo."
---

Detailed reference for configuring the PayMongo plugin.

## Plugin Options

The `paymongo` plugin accepts the following configuration options:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `secretKey` | `string` | Yes | Your PayMongo secret API key. |
| `features` | `Record<string, FeatureConfig>` | Yes | Global feature definitions for your application. |
| `plans` | `Record<string, PlanConfig>` | Yes | Subscription plan definitions. |
| `scopes` | `Array<'user' \| 'organization'>` | No | Billing scopes. Defaults to `['user']`. |

## Feature Configuration

Features define what a user or organization can access. There are two types:

### Boolean Features
Used for "all or nothing" access (e.g., "API Access").
```typescript
{ type: "boolean" }
```

### Metered Features
Used for limited resources (e.g., "Number of projects").
```typescript
{ type: "metered", limit: 5 }
```

## Plan Configuration

Plans map to your subscription tiers and define the features included in each.

| Option | Type | Description |
|--------|------|-------------|
| `amount` | `number` | The price in centavos (e.g., `10000` for PHP 100.00). |
| `currency` | `string` | Currently only `PHP` is supported by PayMongo for subscriptions. |
| `displayName` | `string` | The name shown to users during checkout. |
| `interval` | `'monthly' \| 'yearly'` | The billing cycle. |
| `features` | `Record<string, number \| boolean>` | Feature overrides for this specific plan. |

## Environment Variables

We recommend using environment variables for sensitive keys:

```bash
# .env
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_... # Used on the client if needed
```

In your config:

```typescript
paymongo({
  secretKey: process.env.PAYMONGO_SECRET_KEY!,
  // ...
})
```

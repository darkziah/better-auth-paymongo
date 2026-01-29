---
title: "The Autumn Pattern"
description: "No-webhook billing architecture"
---

## What is the Autumn Pattern?

The Autumn pattern is a billing architecture where PayMongo is the **source of truth** for payments, but you don't rely on webhooks. Instead, payment status is verified **on-demand**.

## How It Works

1. **Attach**: Create a checkout session and redirect user to PayMongo
2. **Check**: When user accesses a feature, verify payment status via API
3. **Track**: Decrement usage for metered features

## Benefits

- **No webhooks** - Simpler infrastructure, no public endpoints needed
- **Always accurate** - Payment status checked at access time
- **Graceful failures** - If PayMongo is down, cached status is used
- **60-second cache** - Reduces API calls while staying current

## Flow Diagram

```
User clicks "Subscribe"
        ↓
  POST /attach (create checkout)
        ↓
  Redirect to PayMongo
        ↓
  User completes payment
        ↓
  Redirect to success URL
        ↓
  GET /check (verify payment)
        ↓
  Access granted ✓
```

## Period Rollover

Billing periods reset automatically on `/check`:
- If `periodEnd < now`, balance resets to limit
- New period starts from now + interval
```

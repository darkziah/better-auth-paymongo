---
title: "Organization Billing"
description: "Seat-based billing for teams and organizations"
---

## Overview

better-auth-paymongo integrates with Better-Auth's organization plugin to provide automatic seat-based billing.

## Setup

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

## How It Works

1. Define `seats` as a metered feature
2. Set seat limits in each plan's `features`
3. `createPaymongoOrganization()` returns a `membershipLimit` function
4. Better-Auth enforces the limit when adding members

## API Reference

### createPaymongoOrganization(config, seatConfig?)

Returns config to spread into Better-Auth's organization plugin.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| config | PaymongoAutumnConfig | Yes | Your paymongo config |
| seatConfig.featureId | string | No | Feature ID (default: "seats") |
| seatConfig.defaultLimit | number | No | Default limit (default: 5) |

### getOrganizationSeats(adapter, orgId, featureId?)

Get seat usage for an organization.

```typescript
const { used, limit, remaining } = await getOrganizationSeats(
  auth.adapter,
  "org_123"
);
console.log(`${used}/${limit} seats used, ${remaining} remaining`);
```

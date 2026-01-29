---
title: "Feature Types"
description: "Boolean vs Metered features"
---

## Boolean Features

Access-control features. Either you have access or you don't.

```typescript
features: {
  api_access: { type: "boolean" },
  export_pdf: { type: "boolean" },
  priority_support: { type: "boolean" },
}

plans: {
  starter: {
    features: { api_access: false, export_pdf: false, priority_support: false },
  },
  pro: {
    features: { api_access: true, export_pdf: true, priority_support: true },
  },
}
```

**Use cases:** Feature flags, premium features, support tiers

## Metered Features

Usage-limited features with a balance that decrements.

```typescript
features: {
  projects: { type: "metered", limit: 5 },
  api_calls: { type: "metered", limit: 1000 },
  seats: { type: "metered", limit: 3 },
}

plans: {
  starter: {
    features: { projects: 10, api_calls: 5000, seats: 5 },
  },
  pro: {
    features: { projects: 100, api_calls: 50000, seats: 25 },
  },
}
```

**Use cases:** Resource limits, API quotas, team seats

## Checking Features

```typescript
// Boolean: just check allowed
const { allowed } = await check("api_access");

// Metered: check balance too
const { allowed, balance, limit } = await check("projects");
if (allowed && balance > 0) {
  // Can create project
}
```

## Tracking Usage

Only needed for metered features:

```typescript
// After using a metered feature
await track("projects"); // Decrements by 1
await track("api_calls", { delta: 5 }); // Decrements by 5
```

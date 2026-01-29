---
title: "Client SDK"
description: "API reference for the paymongoClient() browser SDK"
---

### Setup

```typescript
import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  plugins: [paymongoClient()],
});
```

### Actions

**attach(planId, options)**
```typescript
const { checkoutUrl, sessionId } = await authClient.paymongo.attach("pro", {
  successUrl: window.location.origin + "/billing/success",
  cancelUrl: window.location.origin + "/billing/cancel",
  organizationId: "org_123", // Optional
});

// Redirect to PayMongo checkout
window.location.href = checkoutUrl;
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | Yes | Plan ID from config |
| options.successUrl | string | Yes | Redirect after success |
| options.cancelUrl | string | Yes | Redirect on cancel |
| options.organizationId | string | No | For org billing |

**Returns:** `Promise<{ checkoutUrl: string; sessionId: string }>`

---

**check(featureId, options?)**
```typescript
const result = await authClient.paymongo.check("projects", {
  organizationId: "org_123", // Optional
});

if (result.allowed) {
  console.log(`Can use feature. Balance: ${result.balance}/${result.limit}`);
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featureId | string | Yes | Feature ID to check |
| options.organizationId | string | No | For org billing |

**Returns:**
```typescript
Promise<{
  allowed: boolean;
  balance?: number;
  limit?: number;
  planId?: string;
}>
```

---

**track(featureId, options?)**
```typescript
const result = await authClient.paymongo.track("api_calls", {
  delta: 1,  // Default: 1
  organizationId: "org_123", // Optional
});

console.log(`Remaining: ${result.balance}/${result.limit}`);
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featureId | string | Yes | Feature to track |
| options.delta | number | No | Usage amount (default: 1) |
| options.organizationId | string | No | For org billing |

**Returns:** `Promise<{ success: boolean; balance: number; limit: number }>`

### Example: Protect a Feature

```typescript
async function createProject() {
  const { allowed, balance } = await authClient.paymongo.check("projects");
  
  if (!allowed) {
    throw new Error("Project limit reached. Please upgrade.");
  }
  
  // Create the project...
  const project = await api.createProject({ name: "New Project" });
  
  // Track usage
  await authClient.paymongo.track("projects");
  
  return project;
}
```

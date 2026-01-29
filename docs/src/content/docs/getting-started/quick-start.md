---
title: "Quick Start"
description: "Get up and running with better-auth-paymongo in minutes."
---

Follow these steps to integrate PayMongo billing into your Better Auth application.

### Step 1: Configure Server Plugin

Register the PayMongo plugin in your server-side auth configuration.

```typescript
import { betterAuth } from "better-auth";
import { paymongo } from "better-auth-paymongo";

export const auth = betterAuth({
  plugins: [
    paymongo({
      secretKey: process.env.PAYMONGO_SECRET_KEY!,
      features: {
        projects: { type: "metered", limit: 5 },
        api_access: { type: "boolean" },
      },
      plans: {
        pro: {
          amount: 99900, // in centavos (PHP 999.00)
          currency: "PHP",
          displayName: "Pro Plan",
          interval: "monthly",
          features: { projects: 100, api_access: true },
        },
      },
    }),
  ],
});
```

### Step 2: Configure Client

Initialize the PayMongo client plugin.

```typescript
import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  plugins: [
    paymongoClient(),
  ],
});
```

### Step 3: Add React Provider (Optional)

If you are using React, wrap your application with the `PaymongoProvider` to access billing state easily.

```tsx
import { PaymongoProvider } from "better-auth-paymongo/react";
import { authClient } from "./auth-client";

function App({ children }) {
  return (
    <PaymongoProvider client={authClient}>
      {children}
    </PaymongoProvider>
  );
}
```

### Step 4: Create a Pricing Page

Now you can use the client to initiate checkouts. Here is a simple pricing component:

```tsx
import { authClient } from "./auth-client";

export function Pricing() {
  const checkout = async (planId: string) => {
    await authClient.paymongo.createCheckoutSession({
      planId,
      successUrl: window.location.origin + "/dashboard",
      cancelUrl: window.location.origin + "/pricing",
    });
  };

  return (
    <div>
      <h2>Choose your plan</h2>
      <button onClick={() => checkout("pro")}>
        Upgrade to Pro - PHP 999/mo
      </button>
    </div>
  );
}
```

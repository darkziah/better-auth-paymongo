---
title: "React Hooks"
description: "React hooks for billing UI with better-auth-paymongo"
---

### Installation

```bash
npm install better-auth-paymongo react
```

### Setup

```tsx
import { AuthProvider } from "better-auth/react";
import { authClient } from "./lib/auth-client";

function App() {
  return (
    <AuthProvider client={authClient}>
      <YourApp />
    </AuthProvider>
  );
}
```

### Hooks

**useCheck(featureId, options?)**

Reactive hook to check feature access. Re-fetches when `refreshBilling()` is called.

```tsx
import { useCheck } from "better-auth-paymongo/react";

function FeatureGate({ feature, children }) {
  const { allowed, balance, limit, loading, error, refetch } = useCheck(feature);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!allowed) return <UpgradePrompt />;

  return (
    <>
      {children}
      <UsageBar current={limit - balance} max={limit} />
    </>
  );
}
```

**Return Type:**
| Property | Type | Description |
|----------|------|-------------|
| allowed | boolean | Whether access is allowed |
| balance | number \| undefined | Remaining usage (metered) |
| limit | number \| undefined | Max usage (metered) |
| planId | string \| undefined | Current plan ID |
| loading | boolean | Loading state |
| error | Error \| null | Error if request failed |
| refetch | () => void | Manually refetch |

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| featureId | string | Yes | Feature to check |
| options.organizationId | string | No | For org billing |

---

**useSubscription()**

Get the current user's subscription/plan info.

```tsx
import { useSubscription } from "better-auth-paymongo/react";

function BillingStatus() {
  const { planId, loading, error, refresh } = useSubscription();

  if (loading) return <Spinner />;
  if (!planId) return <FreeTierBadge />;

  return (
    <div>
      <span>Current Plan: {planId}</span>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

**Return Type:**
| Property | Type | Description |
|----------|------|-------------|
| planId | string \| null | Current plan ID |
| loading | boolean | Loading state |
| error | Error \| null | Error if failed |
| refresh | () => void | Manually refresh |

---

**refreshBilling()**

Trigger a global refresh for all paymongo hooks. Useful after successful checkout.

```tsx
import { refreshBilling } from "better-auth-paymongo/react";

function CheckoutSuccessPage() {
  useEffect(() => {
    // Refresh all billing hooks after payment
    refreshBilling();
  }, []);

  return <h1>Payment successful!</h1>;
}
```

### Complete Example: Pricing Page

```tsx
import { useSubscription, refreshBilling } from "better-auth-paymongo/react";
import { authClient } from "./lib/auth-client";

const plans = [
  { id: "starter", name: "Starter", price: "$9/mo" },
  { id: "pro", name: "Pro", price: "$29/mo" },
];

function PricingPage() {
  const { planId, loading } = useSubscription();

  async function subscribe(selectedPlanId: string) {
    const { checkoutUrl } = await authClient.paymongo.attach(selectedPlanId, {
      successUrl: window.location.origin + "/success",
      cancelUrl: window.location.origin + "/pricing",
    });
    window.location.href = checkoutUrl;
  }

  return (
    <div className="pricing-grid">
      {plans.map((plan) => (
        <div key={plan.id} className="plan-card">
          <h3>{plan.name}</h3>
          <p>{plan.price}</p>
          <button 
            onClick={() => subscribe(plan.id)}
            disabled={planId === plan.id}
          >
            {planId === plan.id ? "Current Plan" : "Subscribe"}
          </button>
        </div>
      ))}
    </div>
  );
}
```

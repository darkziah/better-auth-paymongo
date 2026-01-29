---
title: "Examples"
description: "Practical examples for common billing patterns"
---

## Pricing Page

```tsx
function PricingPage() {
  const { planId } = useSubscription();

  async function subscribe(plan: string) {
    const { checkoutUrl } = await authClient.paymongo.attach(plan, {
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/pricing`,
    });
    window.location.href = checkoutUrl;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <PlanCard
        name="Starter"
        price="$9/mo"
        features={["5 projects", "Basic support"]}
        current={planId === "starter"}
        onSelect={() => subscribe("starter")}
      />
      <PlanCard
        name="Pro"
        price="$29/mo"
        features={["100 projects", "Priority support"]}
        current={planId === "pro"}
        onSelect={() => subscribe("pro")}
      />
    </div>
  );
}
```

## Usage Dashboard

```tsx
function UsageDashboard() {
  const projects = useCheck("projects");
  const apiCalls = useCheck("api_calls");

  return (
    <div className="space-y-4">
      <UsageCard
        title="Projects"
        used={projects.limit - projects.balance}
        limit={projects.limit}
      />
      <UsageCard
        title="API Calls"
        used={apiCalls.limit - apiCalls.balance}
        limit={apiCalls.limit}
      />
    </div>
  );
}
```

## Protecting API Routes

```typescript
// Server-side (Next.js API route)
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Check feature access
  const check = await auth.api.paymongo.check({
    headers: req.headers,
    query: { feature: "api_access" },
  });

  if (!check.allowed) {
    return Response.json({ error: "Upgrade required" }, { status: 403 });
  }

  // Process request...
  return Response.json({ success: true });
}
```

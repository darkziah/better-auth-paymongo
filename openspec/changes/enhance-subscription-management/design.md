# Design: Enhance Subscription Management

## Context
The `better-auth-paymongo` plugin provides subscription management for Better-Auth applications using PayMongo as the payment gateway. The current implementation handles basic subscription lifecycle but lacks production-ready features for plan changes and trial management.

**Key constraints:**
- No webhooks (per project convention)—all state updates happen via explicit API calls
- PayMongo API v1 for payment processing
- Support for both User and Organization scopes
- Backward-compatible with existing `paymongoData` structure

## Goals / Non-Goals

### Goals
1. Implement proration for immediate upgrades
2. Require payment for plan upgrades
3. Schedule downgrades for next billing cycle
4. Standardize trial period management
5. Add payment method update capability
6. Document existing implementations in formal specs

### Non-Goals
- Webhook-based state transitions (explicitly avoided)
- Billing portal (PayMongo doesn't offer this)
- Automatic recurring billing (PayMongo subscriptions API limitations)
- Complex proration refunds for downgrades

## Decisions

### 1. Proration Strategy
**Decision**: Use simple time-based proration for upgrades only.

**Formula**:
```
daysRemaining = (currentPeriodEnd - now) / (1 day)
totalDays = interval === 'year' ? 365 : 30
remainingValue = (oldPlanAmount / totalDays) * daysRemaining
newPlanCost = (newPlanAmount / totalDays) * daysRemaining
prorationAmount = max(0, newPlanCost - remainingValue)
```

**Rationale**: 
- Simple and predictable
- Avoids negative amounts (refunds not supported without webhooks)
- Matches common SaaS proration patterns

**Alternatives considered**:
- Full proration with refunds—rejected due to complexity without webhook support
- No proration—rejected as poor UX for customers

### 2. Downgrade Scheduling
**Decision**: Store `scheduledPlanId` in subscription data; apply at next billing check.

**Flow**:
1. User requests downgrade → validate usage fits new plan limits
2. Store `scheduledPlanId` and `scheduledAt`
3. On `verifySubscription` or renewal: if past `currentPeriodEnd`, apply scheduled plan

**Rationale**:
- Fair to customers (they paid for current period)
- Prevents usage violations
- Simple to implement without background jobs

### 3. Trial Enforcement
**Decision**: Track `trialUsedAt` timestamp per entity; reject new trials if exists.

**Rules**:
- Each user/org can only have one trial in their lifetime
- Trial converts to `unpaid` status when `trialEndsAt` passes
- Explicit `convertTrial` endpoint to add payment and activate subscription

**Rationale**:
- Prevents trial abuse
- Clear state machine transitions
- Simple verification without external services

### 4. Payment Update Flow
**Decision**: Create new `PaymentIntent`, verify success, update subscription's `lastPaymentIntentId`.

**Flow**:
1. Client calls `createPaymentIntent` with existing plan
2. User completes payment flow
3. Client calls `updatePaymentMethod` with new `paymentIntentId`
4. Server verifies payment succeeded, updates subscription

**Rationale**:
- Reuses existing PayMongo flow
- No new API endpoints needed from PayMongo
- Works with no-webhook architecture

### 5. Client-Side Hooks Architecture
**Decision**: Use computed hooks pattern with nanostores atoms for reactive state.

**Hook Design**:
```typescript
// Atoms (shared state)
$subscription: Atom<SubscriptionData | null>
$subscriptionLoading: Atom<boolean>
$subscriptionError: Atom<Error | null>

// Computed Hooks (derived from atoms)
useCurrentPlan({ includeAddons?: boolean, organizationId?: string })
useSubscription({ organizationId?: string })
useUsage({ includeAddons?: boolean, organizationId?: string })
useTrialStatus({ organizationId?: string })
```

**Limit Computation (default behavior)**:
```
computedLimits = { ...basePlanLimits }
for each addon in subscription.addons:
  for each (limitKey, bonus) in addon.limitBonuses:
    computedLimits[limitKey] += bonus * addon.quantity
```

**Rationale**:
- Follows better-auth's established pattern (`useSession`)
- Single source of truth via atoms
- Automatic updates when mutations trigger atom changes
- `includeAddons` prop allows raw vs computed access
- Framework-agnostic via nanostores (`useStore` wrappers)

**Alternatives considered**:
- Per-hook fetch—rejected due to redundant API calls
- Server-side computed limits—rejected; keeps client flexible

## SubscriptionData Schema Changes

```typescript
interface SubscriptionData {
    // Existing fields...
    id: string;
    status: "active" | "canceled" | "past_due" | "pending" | "trialing" | "unpaid";
    planId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    addons: Record<string, number>;
    usage: Record<string, number>;
    trialEndsAt?: Date | null;
    paymentIntentId?: string;
    
    // New fields for plan switching
    scheduledPlanId?: string;      // Pending downgrade plan
    scheduledAt?: Date;            // When downgrade was scheduled
    
    // New fields for trial management
    trialUsedAt?: Date;            // When trial was first started (never cleared)
    
    // New fields for payment tracking
    lastPaymentIntentId?: string;  // Most recent successful payment
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Proration calculation edge cases (leap years, DST) | Use simple day-based math; document as "approximate" |
| Trial abuse via new accounts | Out of scope—implement at application level with email verification |
| Payment verification race conditions | Verify payment status before persisting any changes |
| Downgrade applied before period end | Only check/apply in `verifySubscription` after current period |

## Migration Plan

1. **Backward compatible**: New fields are optional; existing subscriptions continue working
2. **No database migration needed**: Fields stored in JSON column
3. **Client updates optional**: Existing client methods still work
4. **Rollback**: Simply deploy previous version; new fields ignored

## Open Questions

1. Should proration round to nearest cent or truncate? → **Decision: Round up to nearest whole currency unit**
2. Should canceled subscriptions be reactivatable? → **Defer to future change**
3. Should we track proration history for auditing? → **Defer to future change**

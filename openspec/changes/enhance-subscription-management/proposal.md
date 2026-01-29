# Change: Enhance Subscription Management

## Why
The current subscription management implementation lacks essential features for production SaaS use cases:
1. **Plan switching** doesn't handle payments or proration—upgrades should charge the difference immediately, and downgrades should take effect at the next billing cycle.
2. **Trial periods** exist but lack standard safeguards like one-trial-per-entity enforcement and proper trial-to-paid conversion flows.
3. **Payment updates** are not supported—users cannot update their payment method for an existing subscription.

## What Changes

### Plan Switching Enhancements
- **ADDED**: Proration calculation for immediate upgrades (charge price difference)
- **ADDED**: Payment requirement for upgrades via new `PaymentIntent`
- **MODIFIED**: Downgrades are scheduled for next billing cycle (not immediate)
- **ADDED**: `scheduledPlanId` field in `SubscriptionData` to track pending downgrades
- **ADDED**: Downgrade restriction when current usage exceeds new plan limits

### Trial Period Standardization
- **ADDED**: One-trial-per-entity enforcement (prevent multiple trials for same user/org)
- **ADDED**: Trial-to-paid conversion endpoint with payment requirement
- **ADDED**: Trial expiration handling (mark as `unpaid` when trial ends without payment)
- **MODIFIED**: `trialUsedAt` field to track when trial was started

### Payment Management
- **ADDED**: Update payment method endpoint for active subscriptions
- **ADDED**: `lastPaymentIntentId` field to track most recent payment

### Client-Side Hooks
- **ADDED**: `useCurrentPlan` hook with computed limits (includes add-on bonuses by default)
- **ADDED**: `useSubscription` hook for full subscription data access
- **ADDED**: `useUsage` hook for usage vs limits comparison
- **ADDED**: `useTrialStatus` hook for trial-specific information
- **ADDED**: Automatic state synchronization across hooks when mutations occur
- **MODIFIED**: Client atoms to support reactive updates via nanostores

### Existing Implementation Documentation
- **ADDED**: Formal specs for existing capabilities (subscription lifecycle, usage tracking)

## Impact
- **Affected specs**: `subscription-management`, `plan-switching`, `trial-management`, `client-hooks`
- **Affected code**: `src/server.ts`, `src/types.ts`, `src/client.ts`
- **Database changes**: Additional fields in `paymongoData` JSON column (backward-compatible)
- **Breaking changes**: None—all changes are additive

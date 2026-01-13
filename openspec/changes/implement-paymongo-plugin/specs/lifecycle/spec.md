# Specification: Subscription Lifecycle

## ADDED Requirements

### Requirement: Payment Intent Creation
The server MUST provide an endpoint to create a PayMongo Payment Intent.

#### Scenario: Initiating subscription
Given an unauthenticated or authenticated user, when `createPaymentIntent` is called with an amount, it returns a `clientKey` and `paymentIntentId`.

### Requirement: Subscription Creation (Pending)
The server MUST create a database record for the subscription with status "pending" (or "active" if trialing) before verification.

#### Scenario: Subscribing to a plan
When `createSubscription` is called with `paymentIntentId` and `planId`, it should:
1. Validate the plan scope (User vs Org).
2. Store the subscription data in `paymongoData`.
3. Set status to `pending`.

#### Scenario: Subscribing with a trial
If the plan has `trialPeriodDays`, set `trialEndDate` to current date + trial days. Status may be set to `active` immediately if no immediate payment is required, or follow standard flow.

### Requirement: Manual Verification
The server MUST provide an endpoint to verify subscription status by polling PayMongo.

#### Scenario: Verifying a pending subscription
Given a pending subscription, when `verifySubscription` is called, the server queries PayMongo. If the PayMongo status is `active`, the local DB status updates to `verified`.

### Requirement: Dual Scope Support
The lifecycle methods MUST handle both `user` and `organization` contexts.

#### Scenario: Organization subscription
When `createSubscription` is called with `scope: "organization"`, it requires an `organizationId` and checks if the caller is an Owner. It then updates the Organization's table.

### Requirement: Subscription Cancellation
The server MUST provide an endpoint to cancel an active subscription.

#### Scenario: Cancelling a subscription
Given a verified subscription, when `cancelSubscription` is called, the server calls PayMongo to cancel the subscription and updates the local status to `cancelled`.

### Requirement: Active Subscription Resolution
The server MUST provide a method to resolve the active subscription based on priority.

#### Scenario: Organization priority
When `getActiveSubscription` is called with an `organizationId`, if the organization has a verified subscription, it returns that subscription. If not, it falls back to the user's personal verified subscription.

### Requirement: Plan Switching
The server MUST provide an endpoint to switch plans.

#### Scenario: Switching plan
When `switchPlan` is called with a new `planId`, the server cancels the old subscription (with PayMongo), creates a new one (if applicable), and updates the local `paymongoData` with the new plan and recalculated limits. Proration logic is left to the PayMongo API or simplified to immediate switch.

### Requirement: Lifecycle Hooks Execution
The server MUST execute the configured lifecycle hooks at appropriate state transitions.

#### Scenario: Creation hook
When `createSubscription` creates a new DB record, `onSubscriptionCreate` MUST be called.

#### Scenario: Activation hook
When `verifySubscription` transitions a subscription status to `verified` (active), `onSubscriptionActive` MUST be called.

#### Scenario: Update hook
When `switchPlan` changes the plan, `onSubscriptionUpdate` MUST be called.

#### Scenario: Cancellation hook
When `cancelSubscription` successfully cancels a subscription, `onSubscriptionCancel` MUST be called.

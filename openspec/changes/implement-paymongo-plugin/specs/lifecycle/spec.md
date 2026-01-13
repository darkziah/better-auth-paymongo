# Specification: Subscription Lifecycle

## ADDED Requirements

### Requirement: Payment Intent Creation
The server MUST provide an endpoint to create a PayMongo Payment Intent.

#### Scenario: Initiating subscription
Given an unauthenticated or authenticated user, when `createPaymentIntent` is called with an amount, it returns a `clientKey` and `paymentIntentId`.

### Requirement: Subscription Creation (Pending)
The server MUST create a database record for the subscription with status "pending" before verification.

#### Scenario: Subscribing to a plan
When `createSubscription` is called with `paymentIntentId` and `planId`, it should:
1. Validate the plan scope (User vs Org).
2. Store the subscription data in `paymongoData`.
3. Set status to `pending`.

### Requirement: Manual Verification
The server MUST provide an endpoint to verify subscription status by polling PayMongo.

#### Scenario: Verifying a pending subscription
Given a pending subscription, when `verifySubscription` is called, the server queries PayMongo. If the PayMongo status is `active`, the local DB status updates to `verified`.

### Requirement: Dual Scope Support
The lifecycle methods MUST handle both `user` and `organization` contexts.

#### Scenario: Organization subscription
When `createSubscription` is called with `scope: "organization"`, it requires an `organizationId` and checks if the caller is an Owner. It then updates the Organization's table.

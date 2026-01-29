# Subscription Management

Core subscription lifecycle management for the PayMongo Better-Auth plugin.

## ADDED Requirements

### Requirement: Subscription Data Persistence
The system SHALL store subscription data in a `paymongoData` JSON field on the user or organization record.

#### Scenario: User subscription storage
- **WHEN** a user creates a subscription
- **THEN** the subscription data is stored in `user.paymongoData` as a JSON string

#### Scenario: Organization subscription storage
- **WHEN** an organization creates a subscription with `organizationId` provided
- **THEN** the subscription data is stored in `organization.paymongoData` as a JSON string

---

### Requirement: Subscription Status Lifecycle
The system SHALL track subscription status through defined states: `pending`, `active`, `trialing`, `unpaid`, `past_due`, `canceled`.

#### Scenario: New paid subscription starts as pending
- **WHEN** a subscription is created with a `paymentIntentId`
- **AND** the payment intent status is `processing`
- **THEN** the subscription status is set to `pending`

#### Scenario: Successful payment activates subscription
- **WHEN** a subscription is created with a `paymentIntentId`
- **AND** the payment intent status is `succeeded`
- **THEN** the subscription status is set to `active`

#### Scenario: Verification updates pending to active
- **WHEN** `verifySubscription` is called for a `pending` subscription
- **AND** the associated payment intent status is `succeeded`
- **THEN** the subscription status is updated to `active`

#### Scenario: Canceled payment marks subscription canceled
- **WHEN** `verifySubscription` is called for a `pending` subscription
- **AND** the associated payment intent status is `cancelled`
- **THEN** the subscription status is updated to `canceled`

---

### Requirement: Subscription Period Tracking
The system SHALL track the current billing period end date and update it on renewals.

#### Scenario: Monthly subscription period
- **WHEN** a monthly subscription is created
- **THEN** `currentPeriodEnd` is set to 30 days from creation

#### Scenario: Yearly subscription period
- **WHEN** a yearly subscription is created (plan `interval` is `year`)
- **THEN** `currentPeriodEnd` is set to 365 days from creation

---

### Requirement: Subscription Cancellation
The system SHALL support canceling subscriptions at period end.

#### Scenario: Cancel subscription at period end
- **WHEN** `cancelSubscription` is called
- **THEN** `cancelAtPeriodEnd` is set to `true`
- **AND** the subscription continues until `currentPeriodEnd`

#### Scenario: Already canceled subscription
- **WHEN** `cancelSubscription` is called on a subscription with status `canceled`
- **THEN** the subscription is returned unchanged

---

### Requirement: Get Active Subscription
The system SHALL provide an endpoint to retrieve the current subscription for a user or organization.

#### Scenario: Get user subscription
- **WHEN** `getActiveSubscription` is called without `organizationId`
- **THEN** the user's subscription data is returned

#### Scenario: Get organization subscription
- **WHEN** `getActiveSubscription` is called with `organizationId`
- **THEN** the organization's subscription data is returned

#### Scenario: No subscription exists
- **WHEN** `getActiveSubscription` is called
- **AND** no subscription data exists
- **THEN** `null` is returned

---

### Requirement: Lifecycle Hooks
The system SHALL invoke lifecycle hooks at key subscription events.

#### Scenario: Subscription creation hook
- **WHEN** a subscription is created successfully
- **AND** `onSubscriptionCreate` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `subscriptionId`, and `planId`

#### Scenario: Subscription verification hook
- **WHEN** subscription status changes during verification
- **AND** `onSubscriptionVerify` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `subscriptionId`, and new `status`

#### Scenario: Subscription cancellation hook
- **WHEN** a subscription is canceled
- **AND** `onSubscriptionCancel` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, and `subscriptionId`

---

### Requirement: Payment Method Update
The system SHALL allow updating the payment method for active subscriptions.

#### Scenario: Update payment with valid PaymentIntent
- **WHEN** `updatePayment` is called with a new `paymentIntentId`
- **AND** the payment intent status is `succeeded`
- **THEN** `lastPaymentIntentId` is updated on the subscription

#### Scenario: Reject update with failed PaymentIntent
- **WHEN** `updatePayment` is called with a `paymentIntentId`
- **AND** the payment intent status is not `succeeded`
- **THEN** an error is thrown with message indicating payment status

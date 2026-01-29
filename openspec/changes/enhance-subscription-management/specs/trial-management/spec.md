# Trial Management

Trial period lifecycle management with abuse prevention and conversion flows.

## ADDED Requirements

### Requirement: Trial Period Creation
The system SHALL create trial subscriptions for plans with `trialPeriodDays` configured.

#### Scenario: Create trial subscription
- **WHEN** `createSubscription` is called with a plan that has `trialPeriodDays > 0`
- **AND** no `paymentIntentId` is provided
- **THEN** the subscription is created with status `trialing`
- **AND** `trialEndsAt` is set to `now + trialPeriodDays`
- **AND** `currentPeriodEnd` is set to `trialEndsAt`
- **AND** `trialUsedAt` is set to current timestamp

#### Scenario: Non-trial plan requires payment
- **WHEN** `createSubscription` is called with a plan that has no `trialPeriodDays`
- **AND** no `paymentIntentId` is provided
- **THEN** an error is thrown indicating payment is required

---

### Requirement: One Trial Per Entity
The system SHALL enforce that each user or organization can only have one trial in their lifetime.

#### Scenario: Reject second trial for user
- **WHEN** `createSubscription` is called for a trial
- **AND** the user already has `trialUsedAt` set (from previous subscription)
- **THEN** an error is thrown with message "Trial already used"

#### Scenario: Reject second trial for organization
- **WHEN** `createSubscription` is called for a trial with `organizationId`
- **AND** the organization already has `trialUsedAt` set
- **THEN** an error is thrown with message "Trial already used"

#### Scenario: Allow trial for new entity
- **WHEN** `createSubscription` is called for a trial
- **AND** the entity has no previous `trialUsedAt`
- **THEN** the trial is created successfully

---

### Requirement: Trial Expiration Handling
The system SHALL mark trials as `unpaid` when they expire without payment.

#### Scenario: Expired trial during verification
- **WHEN** `verifySubscription` is called for a subscription with status `trialing`
- **AND** current date is after `trialEndsAt`
- **AND** no `lastPaymentIntentId` exists
- **THEN** the subscription status is updated to `unpaid`

#### Scenario: Trial expiration hook invocation
- **WHEN** a trial is marked as `unpaid` due to expiration
- **AND** `onTrialExpire` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `subscriptionId`, and `planId`

#### Scenario: Active trial not expired
- **WHEN** `verifySubscription` is called for a subscription with status `trialing`
- **AND** current date is before `trialEndsAt`
- **THEN** the subscription status remains `trialing`

---

### Requirement: Trial to Paid Conversion
The system SHALL provide an endpoint to convert a trial subscription to paid.

#### Scenario: Convert trial with valid payment
- **WHEN** `convertTrial` is called with a `paymentIntentId`
- **AND** the current subscription status is `trialing`
- **AND** the payment intent status is `succeeded`
- **THEN** the subscription status is updated to `active`
- **AND** `lastPaymentIntentId` is set to the provided payment intent
- **AND** `currentPeriodEnd` is extended based on plan interval

#### Scenario: Convert trial with failed payment
- **WHEN** `convertTrial` is called with a `paymentIntentId`
- **AND** the payment intent status is not `succeeded`
- **THEN** an error is thrown indicating payment failed

#### Scenario: Convert non-trial subscription
- **WHEN** `convertTrial` is called
- **AND** the current subscription status is not `trialing`
- **THEN** an error is thrown with message "Only trialing subscriptions can be converted"

#### Scenario: Trial conversion hook invocation
- **WHEN** a trial is successfully converted to paid
- **AND** `onTrialConvert` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `subscriptionId`, and `planId`

---

### Requirement: Trial Subscription Limits
The system SHALL apply plan usage limits during the trial period.

#### Scenario: Usage tracking during trial
- **WHEN** `incrementUsage` is called during a trial
- **THEN** usage is tracked and limits are enforced the same as active subscriptions

#### Scenario: Trial usage limit exceeded
- **WHEN** `incrementUsage` is called during a trial
- **AND** the new usage would exceed the plan limit
- **THEN** an error is thrown indicating limit exceeded

---

### Requirement: Trial Period Display
The system SHALL include trial information in subscription responses.

#### Scenario: Trial subscription response
- **WHEN** `getActiveSubscription` is called for a trial subscription
- **THEN** the response includes `status: "trialing"`
- **AND** the response includes `trialEndsAt` timestamp
- **AND** the response includes `trialUsedAt` timestamp

#### Scenario: Post-trial subscription response
- **WHEN** `getActiveSubscription` is called for a subscription that was previously a trial
- **THEN** the response includes `trialUsedAt` (never cleared)
- **AND** `trialEndsAt` reflects the original trial end date

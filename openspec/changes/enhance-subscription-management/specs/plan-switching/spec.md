# Plan Switching

Plan upgrade and downgrade management with proration support.

## ADDED Requirements

### Requirement: Plan Change Type Detection
The system SHALL detect whether a plan change is an upgrade or downgrade based on plan amounts.

#### Scenario: Upgrade detection
- **WHEN** `switchPlan` is called with `newPlanId`
- **AND** the new plan's `amount` is greater than the current plan's `amount`
- **THEN** the change is processed as an upgrade

#### Scenario: Downgrade detection
- **WHEN** `switchPlan` is called with `newPlanId`
- **AND** the new plan's `amount` is less than the current plan's `amount`
- **THEN** the change is processed as a downgrade

#### Scenario: Same plan rejection
- **WHEN** `switchPlan` is called with `newPlanId` equal to current `planId`
- **THEN** the subscription is returned unchanged

---

### Requirement: Upgrade Proration Calculation
The system SHALL calculate proration for immediate upgrades based on remaining billing period.

#### Scenario: Calculate proration amount
- **GIVEN** a user with 15 days remaining on a 30-day, ₱1000/month plan
- **WHEN** upgrading to a ₱2000/month plan
- **THEN** proration amount is calculated as: `((2000/30)*15) - ((1000/30)*15) = 500`

#### Scenario: Zero proration for end of period
- **GIVEN** a user with 0 days remaining on their billing period
- **WHEN** upgrading to a higher plan
- **THEN** proration amount is `0`

#### Scenario: Proration rounds up
- **WHEN** proration calculation results in a fractional amount
- **THEN** the amount is rounded up to the nearest whole currency unit

---

### Requirement: Upgrade Payment Requirement
The system SHALL require payment for upgrades with positive proration amounts.

#### Scenario: Upgrade requires PaymentIntent
- **WHEN** `switchPlan` is called for an upgrade
- **AND** the proration amount is greater than 0
- **AND** `paymentIntentId` is not provided
- **THEN** an error is thrown with the required `prorationAmount`

#### Scenario: Upgrade with valid payment
- **WHEN** `switchPlan` is called for an upgrade
- **AND** `paymentIntentId` is provided
- **AND** the payment intent status is `succeeded`
- **AND** the payment amount matches or exceeds the proration amount
- **THEN** the plan is switched immediately
- **AND** `lastPaymentIntentId` is updated

#### Scenario: Upgrade with insufficient payment
- **WHEN** `switchPlan` is called for an upgrade
- **AND** `paymentIntentId` is provided
- **AND** the payment amount is less than the proration amount
- **THEN** an error is thrown indicating insufficient payment

#### Scenario: Zero proration upgrade (no payment needed)
- **WHEN** `switchPlan` is called for an upgrade
- **AND** the proration amount is 0 (e.g., at period end)
- **THEN** the plan is switched immediately without requiring payment

---

### Requirement: Downgrade Scheduling
The system SHALL schedule downgrades to take effect at the next billing period.

#### Scenario: Downgrade stores scheduled plan
- **WHEN** `switchPlan` is called for a downgrade
- **THEN** `scheduledPlanId` is set to `newPlanId`
- **AND** `scheduledAt` is set to current timestamp
- **AND** `planId` remains unchanged until period end

#### Scenario: Downgrade replaces previous schedule
- **WHEN** `switchPlan` is called for a downgrade
- **AND** a `scheduledPlanId` already exists
- **THEN** the previous schedule is replaced with the new one

#### Scenario: Scheduled downgrade applied at period end
- **WHEN** `verifySubscription` is called
- **AND** current date is after `currentPeriodEnd`
- **AND** `scheduledPlanId` exists
- **THEN** `planId` is updated to `scheduledPlanId`
- **AND** `scheduledPlanId` and `scheduledAt` are cleared
- **AND** new usage keys from new plan are initialized to 0

---

### Requirement: Downgrade Usage Validation
The system SHALL validate that current usage fits within new plan limits before scheduling a downgrade.

#### Scenario: Downgrade blocked by usage overflow
- **WHEN** `switchPlan` is called for a downgrade
- **AND** current usage for any limit key exceeds the new plan's limit for that key
- **THEN** an error is thrown listing the exceeded limits

#### Scenario: Downgrade allowed when usage fits
- **WHEN** `switchPlan` is called for a downgrade
- **AND** current usage for all limit keys is within the new plan's limits
- **THEN** the downgrade is scheduled successfully

---

### Requirement: Cancel Scheduled Downgrade
The system SHALL allow canceling a scheduled downgrade.

#### Scenario: Cancel pending downgrade
- **WHEN** `cancelScheduledPlanChange` is called
- **AND** a `scheduledPlanId` exists
- **THEN** `scheduledPlanId` and `scheduledAt` are cleared

#### Scenario: No downgrade to cancel
- **WHEN** `cancelScheduledPlanChange` is called
- **AND** no `scheduledPlanId` exists
- **THEN** the subscription is returned unchanged

---

### Requirement: Plan Switch Lifecycle Hook
The system SHALL invoke the `onPlanSwitch` hook when a plan change is applied.

#### Scenario: Upgrade hook invocation
- **WHEN** an upgrade is applied immediately
- **AND** `onPlanSwitch` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `oldPlanId`, and `newPlanId`

#### Scenario: Downgrade hook invocation
- **WHEN** a scheduled downgrade is applied during verification
- **AND** `onPlanSwitch` is configured
- **THEN** the hook is invoked with `userId`, `orgId`, `oldPlanId`, and `newPlanId`

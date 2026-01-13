# Specification: Usage & Limits

## ADDED Requirements

### Requirement: Limit Calculation
The server MUST calculate effective limits based on the base Plan plus any active Add-ons.

#### Scenario: Base limit
Given a plan with `seats: 5`, the effective limit is 5.

#### Scenario: Add-on bonus
Given a plan with `seats: 5` and 2 `extraSeat` add-ons (where `extraSeat` affects `seats`), the effective limit is 5 + 2 = 7.

### Requirement: Usage Enforcement
The server MUST prevent actions that exceed the effective limit.

#### Scenario: Incrementing usage
When `incrementUsage({ limitKey: "seats", amount: 1 })` is called:
- If current usage + 1 <= limit, update usage and return success.
- If current usage + 1 > limit, throw an error.

### Requirement: Contextual Usage Check
The server MUST check usage against the correct scope (User or Organization).

#### Scenario: Check organization limit
When checking limits for an Organization, the server retrieves the Organization's `paymongoData` and ignores the User's personal subscription.

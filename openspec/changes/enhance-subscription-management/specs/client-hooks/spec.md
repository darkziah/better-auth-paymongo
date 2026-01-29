# Client Hooks

Reactive client-side hooks for accessing subscription state using nanostores.

## ADDED Requirements

### Requirement: useCurrentPlan Hook
The system SHALL provide a `useCurrentPlan` hook that returns the current plan with computed limits.

#### Scenario: Get current plan with add-ons included (default)
- **WHEN** `useCurrentPlan()` is called without options
- **THEN** the hook returns an object with:
  - `planId`: the current plan ID
  - `plan`: the plan configuration object
  - `limits`: computed limits (base plan limits + add-on bonuses)
  - `addons`: the active add-ons with quantities
  - `status`: the subscription status
  - `isPending`: loading state
  - `error`: error object if any
  - `refetch`: function to manually refresh

#### Scenario: Get current plan without add-on calculation
- **WHEN** `useCurrentPlan({ includeAddons: false })` is called
- **THEN** the `limits` field contains only the base plan limits (no add-on bonuses applied)

#### Scenario: No subscription exists
- **WHEN** `useCurrentPlan()` is called
- **AND** no subscription exists for the user/organization
- **THEN** `planId` is `null`, `plan` is `null`, `limits` is `{}`

#### Scenario: Organization scope
- **WHEN** `useCurrentPlan({ organizationId: "org_123" })` is called
- **THEN** the hook returns the plan for the specified organization

---

### Requirement: useSubscription Hook
The system SHALL provide a `useSubscription` hook that returns the full subscription data.

#### Scenario: Get full subscription data
- **WHEN** `useSubscription()` is called
- **THEN** the hook returns the full `SubscriptionData` object:
  - `data`: the subscription data (or `null`)
  - `isPending`: loading state
  - `error`: error object if any
  - `refetch`: function to manually refresh

#### Scenario: Organization scope
- **WHEN** `useSubscription({ organizationId: "org_123" })` is called
- **THEN** the hook returns the subscription for the specified organization

---

### Requirement: useUsage Hook
The system SHALL provide a `useUsage` hook for accessing usage vs limits.

#### Scenario: Get usage with computed limits
- **WHEN** `useUsage()` is called
- **THEN** the hook returns an object with:
  - `usage`: current usage values keyed by limit name
  - `limits`: computed limits (includes add-on bonuses)
  - `remaining`: computed remaining capacity for each limit
  - `isOverLimit`: boolean indicating if any limit is exceeded
  - `isPending`: loading state
  - `error`: error object if any

#### Scenario: Get raw usage without add-on calculation
- **WHEN** `useUsage({ includeAddons: false })` is called
- **THEN** `limits` contains only base plan limits
- **AND** `remaining` is calculated against base limits

#### Scenario: No subscription exists
- **WHEN** `useUsage()` is called
- **AND** no subscription exists
- **THEN** `usage` is `{}`, `limits` is `{}`, `remaining` is `{}`

---

### Requirement: useTrialStatus Hook
The system SHALL provide a `useTrialStatus` hook for trial-specific information.

#### Scenario: Active trial
- **WHEN** `useTrialStatus()` is called
- **AND** the subscription status is `trialing`
- **THEN** the hook returns:
  - `isTrialing`: `true`
  - `trialEndsAt`: the trial end date
  - `daysRemaining`: days until trial expires
  - `isPending`: loading state
  - `error`: error object if any

#### Scenario: No trial or trial expired
- **WHEN** `useTrialStatus()` is called
- **AND** the subscription is not in trial state
- **THEN** `isTrialing` is `false`, `trialEndsAt` is `null`, `daysRemaining` is `0`

#### Scenario: Trial already used
- **WHEN** `useTrialStatus()` is called
- **AND** `trialUsedAt` exists on the subscription
- **THEN** `hasUsedTrial` is `true`

---

### Requirement: Automatic State Updates
The system SHALL automatically update hook state when subscription mutations occur.

#### Scenario: State updates after createSubscription
- **WHEN** `createSubscription` action completes successfully
- **THEN** all subscription hooks automatically refetch and reflect new state

#### Scenario: State updates after switchPlan
- **WHEN** `switchPlan` action completes successfully
- **THEN** all subscription hooks automatically refetch and reflect new state

#### Scenario: State updates after cancelSubscription
- **WHEN** `cancelSubscription` action completes successfully
- **THEN** all subscription hooks automatically refetch and reflect new state

#### Scenario: State updates after verifySubscription
- **WHEN** `verifySubscription` action completes successfully
- **THEN** all subscription hooks automatically refetch and reflect new state

---

### Requirement: Framework Compatibility
The system SHALL provide hooks compatible with React, Vue, Svelte, Solid, and vanilla JS.

#### Scenario: React hook usage
- **WHEN** the client is created with `better-auth/react`
- **THEN** `useCurrentPlan()` returns reactive values that trigger re-renders

#### Scenario: Vue hook usage
- **WHEN** the client is created with `better-auth/vue`
- **THEN** `useCurrentPlan()` returns a Vue-compatible reactive ref

#### Scenario: Svelte hook usage
- **WHEN** the client is created with `better-auth/svelte`
- **THEN** `useCurrentPlan()` returns a Svelte-compatible store

#### Scenario: Vanilla usage
- **WHEN** the client is created with `better-auth/client` (vanilla)
- **THEN** `useCurrentPlan` is a nanostore `Atom` that can be subscribed to

---

### Requirement: Nanostores Integration
The system SHALL use nanostores for reactive state management.

#### Scenario: Atoms definition
- **WHEN** the client plugin initializes
- **THEN** the following atoms are created:
  - `$subscription`: holds the full `SubscriptionData`
  - `$subscriptionLoading`: boolean loading state
  - `$subscriptionError`: error object or `null`

#### Scenario: Atom subscriptions
- **WHEN** any hook is called
- **THEN** the hook subscribes to the underlying atoms via `useStore`

#### Scenario: Cross-component synchronization
- **WHEN** multiple components use `useCurrentPlan()`
- **AND** another component calls `refetch()`
- **THEN** all components receive the updated state

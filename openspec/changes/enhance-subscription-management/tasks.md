# Tasks: Enhance Subscription Management

## 1. Type System Updates
- [x] 1.1 Add `scheduledPlanId`, `scheduledAt` fields to `SubscriptionData` interface
- [x] 1.2 Add `trialUsedAt` field to `SubscriptionData` interface
- [x] 1.3 Add `lastPaymentIntentId` field to `SubscriptionData` interface
- [x] 1.4 Add `onTrialExpire` lifecycle hook to `PaymongoPluginConfig`
- [x] 1.5 Add `onTrialConvert` lifecycle hook to `PaymongoPluginConfig`

## 2. Plan Switching Enhancements
- [x] 2.1 Create `calculateProration()` helper function
- [x] 2.2 Modify `switchPlan` endpoint to detect upgrade vs downgrade
- [x] 2.3 Implement upgrade flow with proration calculation
- [x] 2.4 Require `paymentIntentId` for upgrades with positive proration amount
- [x] 2.5 Implement downgrade scheduling (store `scheduledPlanId`, `scheduledAt`)
- [x] 2.6 Add usage validation for downgrades (reject if usage exceeds new limits)
- [x] 2.7 Modify `verifySubscription` to apply scheduled downgrades after period ends
- [ ] 2.8 Add tests for upgrade proration calculation
- [ ] 2.9 Add tests for downgrade scheduling and application

## 3. Trial Period Standardization
- [x] 3.1 Modify `createSubscription` to set `trialUsedAt` when starting trial
- [x] 3.2 Modify `createSubscription` to reject trials if `trialUsedAt` already exists
- [x] 3.3 Modify `verifySubscription` to mark trial as `unpaid` when `trialEndsAt` passes
- [x] 3.4 Create `convertTrial` endpoint to add payment and activate subscription
- [x] 3.5 Add `onTrialExpire` hook invocation when trial expires
- [x] 3.6 Add `onTrialConvert` hook invocation when trial converts to paid
- [ ] 3.7 Add tests for one-trial-per-entity enforcement
- [ ] 3.8 Add tests for trial expiration handling
- [ ] 3.9 Add tests for trial conversion

## 4. Payment Management
- [x] 4.1 Create `updatePayment` endpoint for updating payment on active subscriptions
- [x] 4.2 Verify new `PaymentIntent` succeeded before updating subscription
- [x] 4.3 Update `lastPaymentIntentId` on successful payment updates
- [ ] 4.4 Add tests for payment update flow

## 5. Client Updates
- [x] 5.1 Add `convertTrial` client action
- [x] 5.2 Add `updatePayment` client action
- [x] 5.3 Update type exports for new `SubscriptionData` fields

## 6. Client-Side Hooks
- [x] 6.1 Define `$subscription`, `$subscriptionLoading`, `$subscriptionError` atoms
- [x] 6.2 Create `computeLimits()` helper that merges plan limits with add-on bonuses
- [x] 6.3 Implement `useCurrentPlan` hook with `includeAddons` option (default: `true`)
- [x] 6.4 Implement `useSubscription` hook for full subscription data access
- [x] 6.5 Implement `useUsage` hook with computed `remaining` and `isOverLimit`
- [x] 6.6 Implement `useTrialStatus` hook with `daysRemaining` calculation
- [x] 6.7 Add automatic refetch triggers on mutation actions (`createSubscription`, `switchPlan`, etc.)
- [x] 6.8 Export hooks via `getAtoms` and `atomListeners` for framework compatibility
- [ ] 6.9 Add tests for computed limits with add-ons
- [ ] 6.10 Add tests for automatic state synchronization

## 7. Documentation
- [ ] 7.1 Update README with plan switching (proration, downgrade) documentation
- [ ] 7.2 Update README with trial period documentation
- [ ] 7.3 Update README with payment update documentation
- [ ] 7.4 Update README with client hooks usage examples
- [ ] 7.5 Add code examples for new flows

## 8. Validation & Finalization
- [x] 8.1 Run all tests and ensure passing
- [x] 8.2 Build and verify no type errors
- [ ] 8.3 Test integration with sample Better-Auth app

---

## Dependencies
- Tasks 2.x depend on Task 1.x completion
- Tasks 3.x depend on Task 1.x completion  
- Tasks 4.x depend on Task 1.x completion
- Tasks 5.x depend on Tasks 2.x, 3.x, 4.x completion
- Tasks 6.x (Client Hooks) can start after 1.x and can run in parallel with 2.x-4.x
- Tasks 7.x (Docs) can be done in parallel after 2.x-6.x
- Tasks 8.x must be done last

## Parallelizable Work
- Tasks 2.1-2.6 can be done in parallel with 3.1-3.6, 4.1-4.3, and 6.1-6.8
- All test tasks (*.8, *.9, *.10) can be parallelized within their section

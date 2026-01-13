# Implementation Tasks

## Phase 1: Type System & Configuration
- [ ] Create `plugins/paymongo-plugin/types.ts` with `BasePlanConfig`, `BaseAddonConfig`, and `SubscriptionData` interfaces. <!-- id: 1 -->
- [ ] Define `PaymongoPluginConfig` generic interface. <!-- id: 2 -->
- [ ] Verify type inference for a mock configuration object. <!-- id: 3 -->

## Phase 2: Server Plugin Core
- [ ] Create `plugins/paymongo-plugin/server.ts` scaffolding with `betterAuthPlugin` return type. <!-- id: 4 -->
- [ ] Implement database schema extension (`paymongoData` column for User and Org). <!-- id: 5 -->
- [ ] Implement `paymongoFetch` helper for API communication. <!-- id: 6 -->

## Phase 3: Subscription Lifecycle Endpoints
- [ ] Implement `createPaymentIntent` endpoint (step 1 of flow). <!-- id: 7 -->
- [ ] Implement `createSubscription` endpoint with scope validation and initial DB save. <!-- id: 8 -->
- [ ] Implement `verifySubscription` endpoint for status polling and updates. <!-- id: 9 -->
- [ ] Implement `cancelSubscription` endpoint. <!-- id: 10 -->
- [ ] Add unit tests for subscription lifecycle logic (mocking PayMongo). <!-- id: 11 -->

## Phase 4: Usage & Add-ons
- [ ] Implement `addAddon` endpoint with quantity limit checks. <!-- id: 12 -->
- [ ] Implement `checkUsage` endpoint calculating remaining limits. <!-- id: 13 -->
- [ ] Implement `incrementUsage` and `decrementUsage` endpoints with enforcement logic. <!-- id: 14 -->
- [ ] Implement `getActiveSubscription` with priority logic (Org > User). <!-- id: 15 -->
- [ ] Add unit tests for limit calculations and add-on bonuses. <!-- id: 16 -->

## Phase 5: Client Plugin
- [ ] Create `plugins/paymongo-plugin/client.ts` using `createAuthClientPlugin`. <!-- id: 17 -->
- [ ] Verify client type inference matches server configuration. <!-- id: 18 -->

## Phase 6: Polish & Documentation
- [ ] Create `plugins/paymongo-plugin/index.ts` barrel file. <!-- id: 19 -->
- [ ] Write `plugins/paymongo-plugin/README.md` with configuration examples. <!-- id: 20 -->
- [ ] Ensure full test coverage >80%. <!-- id: 21 -->

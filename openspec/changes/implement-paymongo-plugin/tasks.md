# Implementation Tasks

## Phase 1: Type System & Configuration
- [x] Create `plugins/paymongo-plugin/types.ts` with `BasePlanConfig`, `BaseAddonConfig`, and `SubscriptionData` interfaces. <!-- id: 1 -->
- [x] Define `PaymongoPluginConfig` generic interface. <!-- id: 2 -->
- [x] Verify type inference for a mock configuration object. <!-- id: 3 -->

## Phase 2: Server Plugin Core
- [x] Create `plugins/paymongo-plugin/server.ts` scaffolding using `createAuthEndpoint` and `sessionMiddleware`. <!-- id: 4 -->
- [x] Implement database schema extension (`paymongoData` column for User and Org) in `schema` property. <!-- id: 5 -->
- [x] Implement `paymongoFetch` helper for API communication. <!-- id: 6 -->

## Phase 3: Subscription Lifecycle Endpoints
- [x] Implement `createPaymentIntent` endpoint (`/paymongo/create-payment-intent`). <!-- id: 7 -->
- [x] Implement `createSubscription` endpoint (`/paymongo/create-subscription`) with scope validation and trial period logic. <!-- id: 8 -->
- [x] Implement `verifySubscription` endpoint (`/paymongo/verify-subscription`) for status polling. <!-- id: 9 -->
- [x] Implement `cancelSubscription` endpoint (`/paymongo/cancel-subscription`). <!-- id: 10 -->
- [x] Implement `switchPlan` endpoint (`/paymongo/switch-plan`) for upgrading/downgrading. <!-- id: 22 -->
- [x] Implement lifecycle hook triggers in `createSubscription`, `verifySubscription`, `switchPlan`, and `cancelSubscription`. <!-- id: 23 -->
- [x] Add unit tests for subscription lifecycle logic (mocking PayMongo), including trial periods and plan switching. <!-- id: 11 -->

## Phase 4: Usage & Add-ons
- [x] Implement `addAddon` endpoint (`/paymongo/add-addon`) with quantity limit checks. <!-- id: 12 -->
- [x] Implement `checkUsage` endpoint (`/paymongo/check-usage`) calculating remaining limits. <!-- id: 13 -->
- [x] Implement `incrementUsage` and `decrementUsage` endpoints with enforcement logic. <!-- id: 14 -->
- [x] Implement `getActiveSubscription` with priority logic (Org > User). <!-- id: 15 -->
- [x] Add unit tests for limit calculations and add-on bonuses. <!-- id: 16 -->

## Phase 5: Client Plugin
- [x] Create `plugins/paymongo-plugin/client.ts` using `createAuthClientPlugin`. <!-- id: 17 -->
- [x] Implement client inference using `$InferServerPlugin` property. <!-- id: 18 -->

## Phase 6: Polish & Documentation
- [x] Create `plugins/paymongo-plugin/index.ts` barrel file. <!-- id: 19 -->
- [x] Write `plugins/paymongo-plugin/README.md` with configuration examples. <!-- id: 20 -->
- [x] Ensure full test coverage >80%. <!-- id: 21 -->

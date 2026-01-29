# PayMongo Plugin Implementation Plan

This plan outlines the steps to create a `better-auth` plugin for PayMongo, replicating the features of the existing Stripe plugin.

## Goal Description
Create a `better-auth-paymongo` plugin that provides subscription management, add-ons, and usage-based features using PayMongo as the payment gateway. The plugin will mimic the architecture of the Stripe plugin to ensure consistency and ease of use.

## User Review Required
> [!IMPORTANT]
> Verify PayMongo API capabilities for "Usage-based" billing as it might differ significantly from Stripe. We will assume a standard implementation or use metadata to track usage if native support is limited.

## Proposed Changes

### Plugin Structure
We will create a new directory for the plugin, likely `packages/better-auth-paymongo` or similar if this were a monorepo, but for this task, I'll assume we are creating it in `src/plugins/paymongo` or as a standalone file set in the user's project if it's a single app.
*Note: The user seems to be in a project `better-auth-paymongo`, which seems to be a project to valid/implement this. I will assume we are implementing it in `src/lib/auth/plugins/paymongo` or simply `paymongo-plugin` directory.*

I will create a directory `paymongo-plugin` in the root (or `src` if it exists) to house the plugin code.

### Schema
We need to extend the database schema to store PayMongo-specific fields.

#### [NEW] `paymongo-plugin/schema.ts`
- Define `subscription` table with fields:
    - `paymongoSubscriptionId`
    - `paymongoCustomerId`
    - `plan`
    - `status`
    - `currentPeriodStart`
    - `currentPeriodEnd`
    - `cancelAtPeriodEnd`
    - `seats` (for per-seat billing)
- Extend `user` and `organization` tables with `paymongoCustomerId`.

### Core Logic & Routes
#### [NEW] `paymongo-plugin/index.ts`
- Main plugin entry point.
- Initialize PayMongo client.
- Register database schema.
- Register API endpoints.
- value-add: Sync customer data with PayMongo (hooks on user/org update).

#### [NEW] `paymongo-plugin/routes.ts`
- `upgradeSubscription`: Create or update subscription.
- `cancelSubscription`: Cancel subscription.
- `webhook`: Handle PayMongo webhooks (subscription.created, subscription.updated, subscription.failed, etc.).
- `createPaymentIntent` / `billingPortal`: PayMongo might not have a "Billing Portal" like Stripe, so we might need custom endpoints to manage payment methods or view history.

#### [NEW] `paymongo-plugin/client.ts`
- Client-side helpers for invoking the API.

#### [NEW] `paymongo-plugin/types.ts`
- Type definitions for options, plans, and API responses.

### Features
1.  **Subscription**:
    -   Create subscription using PayMongo API.
    -   Handle recurring payments via webhooks.
2.  **Add-ons**:
    -   Implement logic to add "line items" or "addons" to a subscription.
3.  **Usage-based**:
    -   If PayMongo supports metered billing, integrate it.
    -   Otherwise, implement a mechanism to report usage and update subscription amount (if possible) or create separate invoices.

## Verification Plan

### Automated Tests
-   Mocks for PayMongo API to test logic without hitting real endpoints.
-   Test subscription creation flow.
-   Test webhook handling (simulating PayMongo payloads).

### Manual Verification
-   Set up a local server.
-   Use PayMongo test keys.
-   Trigger subscription creation from the frontend (if we build a UI) or via API calls.
-   Verify database records are created correctly.
-   Verify webhooks update the local state.
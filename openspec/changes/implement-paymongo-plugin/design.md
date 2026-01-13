# Design: PayMongo Plugin Architecture

## Core Concepts

### 1. Deferred Verification Strategy
Unlike standard implementations that rely on webhooks to transition subscription states (e.g., `pending` -> `active`), this plugin adopts a "verify on demand" approach.
-   **Why:** Increases reliability in environments where webhooks are flaky or difficult to configure (e.g., local dev, firewalled servers) and simplifies the architecture.
-   **Flow:**
    1.  User initiates payment -> `createPaymentIntent`.
    2.  User completes payment on client.
    3.  Client calls `createSubscription` -> Stores `subscriptionId` with status `pending`.
    4.  Client/Admin calls `verifySubscription` -> Server polls PayMongo API -> Updates DB status to `verified`.

### 2. Generic Type Inference
The plugin heavily utilizes TypeScript generics to provide a typed developer experience.
-   **Configuration:** Developers pass `plans` and `addons` objects to the plugin factory.
-   **Inference:** The `PaymongoPluginConfig<TPlans, TAddons>` type propagates through the server and client.
-   **Benefit:** `client.paymongo.createSubscription({ planId: "..." })` will autocomplete only valid plan IDs defined in the server config.

### 3. Dual Scope Data Model
To support both User and Organization subscriptions without duplicating logic, we extend both tables with a unified `paymongoData` JSONB column.
-   **Schema:** `user.paymongoData` and `organization.paymongoData`.
-   **Resolution:** The `getActiveSubscription` endpoint intelligently prioritizes Organization subscriptions over User subscriptions when an `organizationId` is provided contextually.

### 4. Usage-Based Billing
Usage is tracked in the `paymongoData` JSON blob.
-   **Limits:** Defined in the Plan configuration.
-   **Add-ons:** "Quantity" type add-ons dynamically increase these limits.
-   **Enforcement:** `incrementUsage` and `checkUsage` methods validate against `current usage` vs `(plan limit + add-on bonuses)`.

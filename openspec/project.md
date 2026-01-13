# Project Context

## Purpose
The goal is to build a production-ready **Better-Auth plugin for PayMongo** (a Philippine payment gateway).
This plugin will enable developers to integrate subscription management, one-time payments, and usage-based billing directly into their Better-Auth authentication flows.

Key features include:
-   **Generic Subscriptions:** Developers define their own plans and add-ons.
-   **Dual Scopes:** Support for both individual User and Organization-level subscriptions.
-   **Usage Limits:** Built-in tracking for limits (e.g., seats, storage, API calls).
-   **Add-ons:** Support for quantity-based and feature-based add-ons.
-   **Deferred Verification:** Avoids reliance on webhooks by storing payment IDs for manual/cron verification.
-   **Embedded Experience:** Fully embedded flow without external dashboards.

## Tech Stack
-   **Language:** TypeScript (Strict Mode)
-   **Runtime:** Bun
-   **Core Framework:** Better-Auth
-   **Validation:** Zod
-   **Testing:** Vitest
-   **External API:** PayMongo API (v1)

## Project Conventions

### Code Style
-   **Strict Typing:** Full TypeScript strict mode. No `any`. Use Generics for flexibility.
-   **Functional Approach:** Prefer functional composition where appropriate.
-   **JSDoc:** Mandatory JSDoc for all public APIs, types, and interfaces.
-   **Exports:** Named exports preferred. Barrel files (`index.ts`) for clean public API.
-   **Formatting:** Prettier (standard JS/TS formatting).

### Architecture Patterns
-   **Plugin Architecture:** Follows Better-Auth's plugin system (Server definition + Client inference).
-   **Client/Server Split:** Distinct `server.ts` (API routes, schema) and `client.ts` (type-safe fetch wrappers).
-   **Type Inference:** The client plugin must automatically infer types from the server configuration.
-   **Schema Extension:** Extends `user` and `organization` tables with a `paymongoData` JSONB column.

### Testing Strategy
-   **Unit Tests:** Vitest for logic verification (limit calculations, scope validation).
-   **Mocking:** Mock PayMongo API calls to avoid external dependencies during tests.
-   **Coverage:** Aim for >80% code coverage.

### Git Workflow
-   **Conventions:** Standard feature-branch workflow.
-   **Commits:** Conventional Commits (e.g., `feat: add subscription endpoint`, `fix: type inference`).

## Domain Context
-   **PayMongo:** A Payment Gateway Service Provider in the Philippines.
-   **Payment Methods:** GCash, PayMaya, Cards, Bank Transfers.
-   **Scopes:**
    -   `user`: Personal subscription attached to a user.
    -   `organization`: Shared subscription attached to an organization (requires `better-auth` organization plugin).
-   **Verification:** Unlike typical Stripe implementations, this project **explicitly avoids webhooks** for simplicity and reliability in certain deployment environments, opting for a "verify on demand" approach (storing IDs and checking status via API).

## Important Constraints
-   **No Webhooks:** The architecture must not rely on PayMongo webhooks for state transitions. State is updated via direct API calls (`verifySubscription`).
-   **Bun Only:** Use `bun` for all package management and script execution.
-   **Type Safety:** The plugin must be generic so consumers can define their own `TPlans` and `TAddons` and get full type support.

## External Dependencies
-   **PayMongo API:** <https://developers.paymongo.com/docs>
-   **Better-Auth:** <https://better-auth.com/>
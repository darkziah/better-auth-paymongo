# Proposal: Implement PayMongo Better-Auth Plugin

## Summary
This proposal outlines the implementation of a production-ready **PayMongo** plugin for **Better-Auth**. The plugin enables subscription management, add-ons, and usage-based billing with support for dual scopes (User and Organization). It is designed to be fully generic, type-safe, and independent of webhooks for verification.

## Motivation
Integrate Philippine payment gateways (GCash, PayMaya, etc.) into Better-Auth applications. The existing Stripe plugin model is adapted to fit PayMongo's API constraints and local requirements, specifically the need for "verify on demand" workflows to avoid webhook reliance in certain environments.

## Proposed Solution
Create a new plugin under `plugins/paymongo-plugin` that includes:
1.  **Server Plugin:** Handles API interactions, database schema extensions (`paymongoData` column), and subscription logic.
2.  **Client Plugin:** Provides type-safe wrappers for API endpoints using Better-Auth's inference.
3.  **Type System:** A generic configuration system allowing developers to define custom plans and add-ons with strict typing.

## Key Features
-   **Generic Plans & Add-ons:** Developers define `TPlans` and `TAddons` interfaces.
-   **Dual Scope Support:** Unified logic for `user` and `organization` subscriptions.
-   **No-Webhook Verification:** Status updates via direct API polling (`verifySubscription`).
-   **Usage Limits:** Integrated logic for checking, incrementing, and enforcing usage limits.
-   **Plan Switching:** Simple upgrade/downgrade logic with immediate effect.
-   **Trial Periods:** Support for trial periods defined in plan configurations, delaying billing start.
-   **Lifecycle Hooks:** Callbacks for creation, activation, update, and cancellation events.

import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption, BetterFetch } from "@better-fetch/fetch";
import { atom } from "nanostores";
import { useAuthQuery } from "better-auth/client";
import type { paymongo } from "./server";
import type { SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";

// Config type for plans and addons
export interface PaymongoConfig {
    plans: Record<string, BasePlanConfig>;
    addons: Record<string, BaseAddonConfig>;
}

export const paymongoClient = () => {
    // Signal atoms for triggering refetches - created OUTSIDE getAtoms but inside the factory
    // This ensures they persist across the lifetime of the client
    const $configSignal = atom<boolean>(false);
    const $subscriptionSignal = atom<boolean>(false);

    return {
        id: "paymongo",
        $InferServerPlugin: {} as ReturnType<typeof paymongo>,

        getAtoms: ($fetch: BetterFetch) => {
            // Create reactive query atoms using better-auth's useAuthQuery
            // These will automatically become useConfig() and useSubscription() hooks
            const config = useAuthQuery<PaymongoConfig>(
                $configSignal,
                "/paymongo/config",
                $fetch,
                { method: "GET" }
            );

            const subscription = useAuthQuery<SubscriptionData | null>(
                $subscriptionSignal,
                "/paymongo/get-subscription",
                $fetch,
                { method: "GET" }
            );

            return {
                // Signal atoms (prefixed with $) - used for triggering refetches
                $configSignal,
                $subscriptionSignal,
                // Query atoms - these become useConfig() and useSubscription() hooks automatically
                config,
                subscription
            };
        },

        getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{ data: T | null; error: { message: string } | null }>) => ({
            /**
             * Create a PaymentIntent for subscribing to a plan
             */
            createPaymentIntent: async (options: { planId: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<{ clientKey: string; paymentIntentId: string }>(`/paymongo/create-payment-intent`, {
                    method: "POST",
                    body: options,
                    ...fetchOptions
                });
            },

            /**
             * Create a subscription (handles trial or paid subscriptions)
             */
            createSubscription: async (options: { planId: string; paymentIntentId?: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData>(`/paymongo/create-subscription`, {
                    method: "POST",
                    body: options,
                    ...fetchOptions
                });
            },

            /**
             * Verify and sync subscription status
             */
            verifySubscription: async (options?: { organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
                return $fetch<SubscriptionData | null>(`/paymongo/verify-subscription${query}`, {
                    method: "GET",
                    ...fetchOptions
                });
            },

            /**
             * Cancel subscription (sets cancelAtPeriodEnd flag)
             */
            cancelSubscription: async (options?: { organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData>(`/paymongo/cancel-subscription`, {
                    method: "POST",
                    body: options ?? {},
                    ...fetchOptions
                });
            },

            /**
             * Get the current plan ID for the active organization or user
             */
            getPlan: async (options?: { organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
                const res = await $fetch<SubscriptionData | null>(`/paymongo/get-subscription${query}`, {
                    method: "GET",
                    ...fetchOptions
                });
                return {
                    data: res.data?.planId ?? null,
                    error: res.error
                };
            },

            /**
             * Get the full subscription data for the active organization or user
             */
            getSubscription: async (options?: { organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
                return $fetch<SubscriptionData | null>(`/paymongo/get-subscription${query}`, {
                    method: "GET",
                    ...fetchOptions
                });
            },

            /**
             * Check if the organization or user has an active subscription
             */
            hasActiveSubscription: async (options?: { organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
                const res = await $fetch<SubscriptionData | null>(`/paymongo/get-subscription${query}`, {
                    method: "GET",
                    ...fetchOptions
                });
                const isActive = res.data?.status === "active" || res.data?.status === "trialing";
                return {
                    data: isActive,
                    error: res.error
                };
            },

            /**
             * Convert a trial subscription to a paid subscription
             */
            convertTrial: async (options: { paymentIntentId: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData>(`/paymongo/convert-trial`, {
                    method: "POST",
                    body: options,
                    ...fetchOptions
                });
            },

            /**
             * Update payment method for an active subscription
             */
            updatePayment: async (options: { paymentIntentId: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData>(`/paymongo/update-payment`, {
                    method: "POST",
                    body: options,
                    ...fetchOptions
                });
            },

            /**
             * Switch to a different plan (handles proration for upgrades, scheduling for downgrades)
             */
            switchPlan: async (options: { newPlanId: string; paymentIntentId?: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData | { requiresPayment: boolean; prorationAmount: number; currency: string }>(`/paymongo/switch-plan`, {
                    method: "POST",
                    body: options,
                    ...fetchOptions
                });
            },

            /**
             * Add an addon to the subscription
             */
            addAddon: async (options: { addonId: string; quantity?: number; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<SubscriptionData>(`/paymongo/add-addon`, {
                    method: "POST",
                    body: { quantity: 1, ...options },
                    ...fetchOptions
                });
            },

            /**
             * Check usage for a specific limit key
             */
            checkUsage: async (options: { limitKey: string; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                const params = new URLSearchParams({ limitKey: options.limitKey });
                if (options.organizationId) params.set('organizationId', options.organizationId);
                return $fetch<{ usage: number; limit: number; remaining: number; allowed: boolean }>(`/paymongo/check-usage?${params}`, {
                    method: "GET",
                    ...fetchOptions
                });
            },

            /**
             * Increment (or decrement with negative) usage for a limit key
             */
            incrementUsage: async (options: { limitKey: string; quantity?: number; organizationId?: string }, fetchOptions?: BetterFetchOption) => {
                return $fetch<{ success: boolean; usage: number; limit: number }>(`/paymongo/increment-usage`, {
                    method: "POST",
                    body: { quantity: 1, ...options },
                    ...fetchOptions
                });
            }
        }),

        // Path methods tell better-auth which HTTP method to use for each path
        pathMethods: {
            "/paymongo/config": "GET",
            "/paymongo/get-subscription": "GET",
            "/paymongo/verify-subscription": "GET",
            "/paymongo/check-usage": "GET"
        },

        // Atom listeners trigger signal updates when matching API calls are made
        atomListeners: [
            {
                matcher(path: string) {
                    return path === "/paymongo/config";
                },
                signal: "$configSignal"
            },
            {
                matcher(path: string) {
                    return path.startsWith("/paymongo/") &&
                        (path.includes("subscription") ||
                            path.includes("switch-plan") ||
                            path.includes("convert-trial") ||
                            path.includes("cancel") ||
                            path.includes("add-addon"));
                },
                signal: "$subscriptionSignal"
            }
        ]
    } satisfies BetterAuthClientPlugin;
};

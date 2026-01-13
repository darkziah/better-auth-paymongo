import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption } from "@better-fetch/fetch";
import type { paymongo } from "./server";
import type { SubscriptionData } from "./types";

export const paymongoClient = () => {
    return {
        id: "paymongo",
        $InferServerPlugin: {} as ReturnType<typeof paymongo>,
        getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{ data: T | null; error: { message: string } | null }>) => ({
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
            }
        })
    } satisfies BetterAuthClientPlugin;
};

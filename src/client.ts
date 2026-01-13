import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption } from "@better-fetch/fetch";
import { atom } from "nanostores";
import type { paymongo } from "./server";
import type { SubscriptionData } from "./types";

// Atoms for reactive subscription state
export const subscriptionAtom = atom<SubscriptionData | null>(null);
export const subscriptionLoadingAtom = atom<boolean>(false);
export const subscriptionErrorAtom = atom<Error | null>(null);

export const paymongoClient = () => {
    return {
        id: "paymongo",
        $InferServerPlugin: {} as ReturnType<typeof paymongo>,

        getAtoms: () => {
            return {
                $subscription: subscriptionAtom,
                $subscriptionLoading: subscriptionLoadingAtom,
                $subscriptionError: subscriptionErrorAtom
            };
        },

        getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{ data: T | null; error: { message: string } | null }>) => ({
            /**
             * Fetch subscription and update atoms
             */
            fetchSubscription: async (options?: { organizationId?: string }) => {
                subscriptionLoadingAtom.set(true);
                subscriptionErrorAtom.set(null);

                try {
                    const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
                    const result = await $fetch<SubscriptionData | null>(`/paymongo/get-subscription${query}`, {
                        method: "GET"
                    });

                    if (result.error) {
                        subscriptionErrorAtom.set(new Error(result.error.message));
                        return { data: null, error: result.error };
                    } else {
                        subscriptionAtom.set(result.data);
                        return { data: result.data, error: null };
                    }
                } catch (e) {
                    const error = e instanceof Error ? e : new Error("Failed to fetch subscription");
                    subscriptionErrorAtom.set(error);
                    return { data: null, error: { message: error.message } };
                } finally {
                    subscriptionLoadingAtom.set(false);
                }
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
            }
        })
    } satisfies BetterAuthClientPlugin;
};

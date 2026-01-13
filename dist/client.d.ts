import type { BetterFetchOption } from "@better-fetch/fetch";
import type { paymongo } from "./server";
import type { SubscriptionData } from "./types";
export declare const subscriptionAtom: import("nanostores").PreinitializedWritableAtom<SubscriptionData | null> & object;
export declare const subscriptionLoadingAtom: import("nanostores").PreinitializedWritableAtom<boolean> & object;
export declare const subscriptionErrorAtom: import("nanostores").PreinitializedWritableAtom<Error | null> & object;
export declare const paymongoClient: () => {
    id: "paymongo";
    $InferServerPlugin: ReturnType<typeof paymongo>;
    getAtoms: () => {
        $subscription: import("nanostores").PreinitializedWritableAtom<SubscriptionData | null> & object;
        $subscriptionLoading: import("nanostores").PreinitializedWritableAtom<boolean> & object;
        $subscriptionError: import("nanostores").PreinitializedWritableAtom<Error | null> & object;
    };
    getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{
        data: T | null;
        error: {
            message: string;
        } | null;
    }>) => {
        /**
         * Fetch subscription and update atoms
         */
        fetchSubscription: (options?: {
            organizationId?: string;
        }) => Promise<{
            data: null;
            error: {
                message: string;
            };
        } | {
            data: SubscriptionData | null;
            error: null;
        }>;
        /**
         * Get the current plan ID for the active organization or user
         */
        getPlan: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: string | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Get the full subscription data for the active organization or user
         */
        getSubscription: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: SubscriptionData | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Check if the organization or user has an active subscription
         */
        hasActiveSubscription: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: boolean;
            error: {
                message: string;
            } | null;
        }>;
    };
};

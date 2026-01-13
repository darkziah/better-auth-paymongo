import type { BetterFetchOption } from "@better-fetch/fetch";
import type { paymongo } from "./server";
import type { SubscriptionData } from "./types";
export declare const paymongoClient: () => {
    id: "paymongo";
    $InferServerPlugin: ReturnType<typeof paymongo>;
    getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{
        data: T | null;
        error: {
            message: string;
        } | null;
    }>) => {
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

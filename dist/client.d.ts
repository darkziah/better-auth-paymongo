import type { BetterFetchOption, BetterFetch } from "@better-fetch/fetch";
import type { paymongo } from "./server";
import type { AttachResponse, CheckResponse, TrackResponse } from "./types";
export declare const paymongoClient: () => {
    id: "paymongo";
    $InferServerPlugin: ReturnType<typeof paymongo>;
    getAtoms: ($fetch: BetterFetch) => {
        $subscriptionSignal: import("nanostores").PreinitializedWritableAtom<boolean> & object;
    };
    getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{
        data: T | null;
        error: {
            message: string;
        } | null;
    }>) => {
        /**
         * Attach a subscription plan to the user or organization.
         * Creates a PayMongo checkout session and returns the URL for payment.
         *
         * @param planId - The plan ID to subscribe to
         * @param options - Checkout configuration
         * @param options.successUrl - URL to redirect after successful payment
         * @param options.cancelUrl - URL to redirect if payment is cancelled
         * @param options.organizationId - Optional organization ID (defaults to current user)
         * @returns Checkout URL and session ID
         */
        attach: (planId: string, options: {
            successUrl: string;
            cancelUrl: string;
            organizationId?: string;
        }) => Promise<{
            data: AttachResponse | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Check if a feature is allowed for the current user or organization.
         * For metered features, also returns usage balance and limit.
         *
         * @param featureId - The feature ID to check
         * @param options - Optional configuration
         * @param options.organizationId - Optional organization ID (defaults to current user)
         * @returns Feature access status and usage info
         */
        check: (featureId: string, options?: {
            organizationId?: string;
        }) => Promise<{
            data: CheckResponse | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Track usage for a metered feature.
         * Increments (or decrements with negative delta) the usage balance.
         *
         * @param featureId - The feature ID to track
         * @param options - Optional configuration
         * @param options.delta - Amount to increment (default: 1, use negative to decrement)
         * @param options.organizationId - Optional organization ID (defaults to current user)
         * @returns Updated usage balance and limit
         */
        track: (featureId: string, options?: {
            delta?: number;
            organizationId?: string;
        }) => Promise<{
            data: TrackResponse | null;
            error: {
                message: string;
            } | null;
        }>;
    };
    pathMethods: {
        "/paymongo/check": "GET";
    };
    atomListeners: {
        matcher: (path: string) => boolean;
        signal: "$subscriptionSignal";
    }[];
};

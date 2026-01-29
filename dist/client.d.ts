import type { BetterFetchOption, BetterFetch } from "@better-fetch/fetch";
import type { paymongo } from "./server";
import type { BasePlanConfig, BaseAddonConfig } from "./types";
export interface PaymongoConfig {
    plans: Record<string, BasePlanConfig>;
    addons: Record<string, BaseAddonConfig>;
}
export declare const paymongoClient: () => {
    id: "paymongo";
    $InferServerPlugin: ReturnType<typeof paymongo>;
    getAtoms: ($fetch: BetterFetch) => {
        $configSignal: import("nanostores").PreinitializedWritableAtom<boolean> & object;
        $subscriptionSignal: import("nanostores").PreinitializedWritableAtom<boolean> & object;
        config: import("better-auth/client").AuthQueryAtom<PaymongoConfig>;
        subscription: import("better-auth/client").AuthQueryAtom<any>;
    };
    getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{
        data: T | null;
        error: {
            message: string;
        } | null;
    }>) => {
        /**
         * Create a PaymentIntent for subscribing to a plan
         */
        createPaymentIntent: (options: {
            planId: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: {
                clientKey: string;
                paymentIntentId: string;
            } | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Create a subscription (handles trial or paid subscriptions)
         */
        createSubscription: (options: {
            planId: string;
            paymentIntentId?: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Verify and sync subscription status
         */
        verifySubscription: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Cancel subscription (sets cancelAtPeriodEnd flag)
         */
        cancelSubscription: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Get the current plan ID for the active organization or user
         */
        getPlan: (options?: {
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
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
            data: any;
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
        /**
         * Convert a trial subscription to a paid subscription
         */
        convertTrial: (options: {
            paymentIntentId: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Update payment method for an active subscription
         */
        updatePayment: (options: {
            paymentIntentId: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Switch to a different plan (handles proration for upgrades, scheduling for downgrades)
         */
        switchPlan: (options: {
            newPlanId: string;
            paymentIntentId?: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Add an addon to the subscription
         */
        addAddon: (options: {
            addonId: string;
            quantity?: number;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: any;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Check usage for a specific limit key
         */
        checkUsage: (options: {
            limitKey: string;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: {
                usage: number;
                limit: number;
                remaining: number;
                allowed: boolean;
            } | null;
            error: {
                message: string;
            } | null;
        }>;
        /**
         * Increment (or decrement with negative) usage for a limit key
         */
        incrementUsage: (options: {
            limitKey: string;
            quantity?: number;
            organizationId?: string;
        }, fetchOptions?: BetterFetchOption) => Promise<{
            data: {
                success: boolean;
                usage: number;
                limit: number;
            } | null;
            error: {
                message: string;
            } | null;
        }>;
    };
    pathMethods: {
        "/paymongo/config": "GET";
        "/paymongo/get-subscription": "GET";
        "/paymongo/verify-subscription": "GET";
        "/paymongo/check-usage": "GET";
    };
    atomListeners: ({
        matcher(path: string): path is "/paymongo/config";
        signal: "$configSignal";
    } | {
        matcher(path: string): boolean;
        signal: "$subscriptionSignal";
    })[];
};

import type { SubscriptionData } from "./types";
/**
 * Options for subscription hooks
 */
export interface UseSubscriptionOptions {
    /** Organization ID to fetch subscription for. If not provided, fetches for current user */
    organizationId?: string;
    /** Whether to fetch on mount. Defaults to true */
    fetchOnMount?: boolean;
    /** Polling interval in ms. Set to 0 to disable polling */
    pollingInterval?: number;
}
/**
 * Return type for useSubscription hook
 */
export interface UseSubscriptionReturn {
    subscription: SubscriptionData | null;
    planId: string | null;
    isActive: boolean;
    isTrialing: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}
/**
 * Create subscription hooks for the PayMongo client
 *
 * @example
 * ```tsx
 * import { createAuthClient } from "better-auth/react";
 * import { paymongoClient } from "./paymongo-plugin/client";
 * import { createSubscriptionHooks } from "./paymongo-plugin/react";
 *
 * const authClient = createAuthClient({ plugins: [paymongoClient()] });
 * const { useSubscription, usePlan } = createSubscriptionHooks(authClient);
 *
 * function MyComponent() {
 *   const { planId, isActive } = usePlan({ organizationId: "org_123" });
 *   return <div>Plan: {planId}, Active: {isActive ? "Yes" : "No"}</div>;
 * }
 * ```
 */
export declare function createSubscriptionHooks(authClient: {
    paymongo: {
        getSubscription: (options?: {
            organizationId?: string;
        }) => Promise<{
            data: SubscriptionData | null;
            error: {
                message: string;
            } | null;
        }>;
    };
}): {
    useSubscription: (options?: UseSubscriptionOptions) => UseSubscriptionReturn;
    usePlan: (options?: UseSubscriptionOptions) => {
        planId: string | null;
        isActive: boolean;
        isTrialing: boolean;
        isLoading: boolean;
        error: Error | null;
        refetch: () => Promise<void>;
    };
    useIsSubscribed: (options?: UseSubscriptionOptions) => {
        isSubscribed: boolean;
        isActive: boolean;
        isTrialing: boolean;
        isLoading: boolean;
        error: Error | null;
        refetch: () => Promise<void>;
    };
    useUsage: (limitKey: string, options?: UseSubscriptionOptions) => {
        usage: number;
        plan: string | undefined;
        isLoading: boolean;
        error: Error | null;
        refetch: () => Promise<void>;
    };
};

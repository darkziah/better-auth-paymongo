import type { SubscriptionData } from "./types";
/**
 * Hook to get the current subscription data
 * Uses nanostores for reactive updates
 *
 * @example
 * ```tsx
 * import { useSubscription } from "better-auth-paymongo/react";
 *
 * function MyComponent() {
 *   const { subscription, isLoading } = useSubscription();
 *   if (isLoading) return <Spinner />;
 *   return <div>Plan: {subscription?.planId}</div>;
 * }
 * ```
 */
export declare function useSubscription(): {
    subscription: SubscriptionData | null;
    planId: string | null;
    status: "active" | "canceled" | "past_due" | "pending" | "trialing" | "unpaid" | null;
    isActive: boolean;
    isTrialing: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    error: Error | null;
};
/**
 * Hook to get just the plan ID
 */
export declare function usePlan(): {
    planId: string | null;
    isActive: boolean;
    isTrialing: boolean;
    isLoading: boolean;
    error: Error | null;
};
/**
 * Hook to check if user/org has active subscription
 */
export declare function useIsSubscribed(): {
    isSubscribed: boolean;
    isActive: boolean;
    isTrialing: boolean;
    isLoading: boolean;
    error: Error | null;
};
/**
 * Hook to get usage for a specific limit
 */
export declare function useUsage(limitKey: string): {
    usage: number;
    planId: string | null;
    isLoading: boolean;
    error: Error | null;
};
export { subscriptionAtom, subscriptionLoadingAtom, subscriptionErrorAtom } from "./client";

import { useStore } from "@nanostores/react";
import { subscriptionAtom, subscriptionLoadingAtom, subscriptionErrorAtom } from "./client";
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
export function useSubscription() {
  const subscription = useStore(subscriptionAtom);
  const isLoading = useStore(subscriptionLoadingAtom);
  const error = useStore(subscriptionErrorAtom);

  const isActive = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";

  return {
    subscription,
    planId: subscription?.planId ?? null,
    status: subscription?.status ?? null,
    isActive,
    isTrialing,
    isSubscribed: isActive || isTrialing,
    isLoading,
    error
  };
}

/**
 * Hook to get just the plan ID
 */
export function usePlan() {
  const { planId, isActive, isTrialing, isLoading, error } = useSubscription();
  return { planId, isActive, isTrialing, isLoading, error };
}

/**
 * Hook to check if user/org has active subscription
 */
export function useIsSubscribed() {
  const { isSubscribed, isActive, isTrialing, isLoading, error } = useSubscription();
  return { isSubscribed, isActive, isTrialing, isLoading, error };
}

/**
 * Hook to get usage for a specific limit
 */
export function useUsage(limitKey: string) {
  const { subscription, isLoading, error } = useSubscription();
  const usage = subscription?.usage?.[limitKey] ?? 0;

  return {
    usage,
    planId: subscription?.planId ?? null,
    isLoading,
    error
  };
}

// Re-export atoms for advanced usage
export { subscriptionAtom, subscriptionLoadingAtom, subscriptionErrorAtom } from "./client";

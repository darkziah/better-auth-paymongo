import { useState, useEffect, useCallback } from "react";
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
export function createSubscriptionHooks(authClient: {
  paymongo: {
    getSubscription: (options?: { organizationId?: string }) => Promise<{ data: SubscriptionData | null; error: { message: string } | null }>;
  };
}) {
  /**
   * Hook to get full subscription data with reactive updates
   */
  function useSubscription(options: UseSubscriptionOptions = {}): UseSubscriptionReturn {
    const { organizationId, fetchOnMount = true, pollingInterval = 0 } = options;

    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [isLoading, setIsLoading] = useState(fetchOnMount);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authClient.paymongo.getSubscription(
          organizationId ? { organizationId } : undefined
        );
        if (result.error) {
          setError(new Error(result.error.message));
        } else {
          setSubscription(result.data);
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Failed to fetch subscription"));
      } finally {
        setIsLoading(false);
      }
    }, [organizationId]);

    useEffect(() => {
      if (fetchOnMount) {
        refetch();
      }
    }, [fetchOnMount, refetch]);

    useEffect(() => {
      if (pollingInterval > 0) {
        const interval = setInterval(refetch, pollingInterval);
        return () => clearInterval(interval);
      }
    }, [pollingInterval, refetch]);

    const isActive = subscription?.status === "active";
    const isTrialing = subscription?.status === "trialing";

    return {
      subscription,
      planId: subscription?.planId ?? null,
      isActive,
      isTrialing,
      isLoading,
      error,
      refetch
    };
  }

  /**
   * Hook to get just the plan ID with reactive updates
   */
  function usePlan(options: UseSubscriptionOptions = {}) {
    const { planId, isActive, isTrialing, isLoading, error, refetch } = useSubscription(options);
    return { planId, isActive, isTrialing, isLoading, error, refetch };
  }

  /**
   * Hook to check if subscription is active
   */
  function useIsSubscribed(options: UseSubscriptionOptions = {}) {
    const { isActive, isTrialing, isLoading, error, refetch } = useSubscription(options);
    return {
      isSubscribed: isActive || isTrialing,
      isActive,
      isTrialing,
      isLoading,
      error,
      refetch
    };
  }

  /**
   * Hook to get usage information for a specific limit
   */
  function useUsage(
    limitKey: string,
    options: UseSubscriptionOptions = {}
  ) {
    const { subscription, isLoading, error, refetch } = useSubscription(options);

    const plan = subscription?.planId;
    const usage = subscription?.usage[limitKey] ?? 0;

    return {
      usage,
      plan,
      isLoading,
      error,
      refetch
    };
  }

  return {
    useSubscription,
    usePlan,
    useIsSubscribed,
    useUsage
  };
}

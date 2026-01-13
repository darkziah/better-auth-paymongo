// src/react.ts
import { useState, useEffect, useCallback } from "react";
function createSubscriptionHooks(authClient) {
  function useSubscription(options = {}) {
    const { organizationId, fetchOnMount = true, pollingInterval = 0 } = options;
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(fetchOnMount);
    const [error, setError] = useState(null);
    const refetch = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authClient.paymongo.getSubscription(organizationId ? { organizationId } : undefined);
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
  function usePlan(options = {}) {
    const { planId, isActive, isTrialing, isLoading, error, refetch } = useSubscription(options);
    return { planId, isActive, isTrialing, isLoading, error, refetch };
  }
  function useIsSubscribed(options = {}) {
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
  function useUsage(limitKey, options = {}) {
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
export {
  createSubscriptionHooks
};

//# debugId=2644A1D9D72E4E7264756E2164756E21

import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';
import { useEffect, useState, useCallback } from 'react';
import type { CheckResponse } from './types';

/**
 * Atom to trigger re-fetches across hooks
 */
export const $refreshTrigger = atom(0);

/**
 * Hook to check feature permissions
 */
export function useCheck(
  featureId: string,
  options?: { organizationId?: string }
) {
  const [state, setState] = useState<{
    data: CheckResponse | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: true, error: null });

  const trigger = useStore($refreshTrigger);

  const fetchCheck = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ feature: featureId });
      if (options?.organizationId) {
        params.set('organizationId', options.organizationId);
      }
      const res = await fetch(`/api/auth/paymongo/check?${params}`);
      if (!res.ok) throw new Error('Check failed');
      const data: CheckResponse = await res.json();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e as Error });
    }
  }, [featureId, options?.organizationId]);

  useEffect(() => {
    fetchCheck();
  }, [fetchCheck, trigger]);

  return {
    allowed: state.data?.allowed ?? false,
    balance: state.data?.balance,
    limit: state.data?.limit,
    planId: state.data?.planId,
    loading: state.loading,
    error: state.error,
    refetch: fetchCheck
  };
}

/**
 * Hook to get current subscription state
 */
export function useSubscription() {
  const [state, setState] = useState<{
    planId: string | null;
    loading: boolean;
    error: Error | null;
  }>({ planId: null, loading: true, error: null });

  const trigger = useStore($refreshTrigger);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/auth/paymongo/check?feature=_subscription');
      if (!res.ok) throw new Error('Failed to get subscription');
      const data: CheckResponse = await res.json();
      setState({ planId: data.planId ?? null, loading: false, error: null });
    } catch (e) {
      setState({ planId: null, loading: false, error: e as Error });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, trigger]);

  return {
    planId: state.planId,
    loading: state.loading,
    error: state.error,
    refresh
  };
}

/**
 * Trigger global refresh for all hooks
 */
export function refreshBilling() {
  $refreshTrigger.set($refreshTrigger.get() + 1);
}

// src/react.ts
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import { useEffect, useState, useCallback } from "react";
var $refreshTrigger = atom(0);
function useCheck(featureId, options) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const trigger = useStore($refreshTrigger);
  const fetchCheck = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ feature: featureId });
      if (options?.organizationId) {
        params.set("organizationId", options.organizationId);
      }
      const res = await fetch(`/api/auth/paymongo/check?${params}`);
      if (!res.ok)
        throw new Error("Check failed");
      const data = await res.json();
      setState({ data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e });
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
function useSubscription() {
  const [state, setState] = useState({ planId: null, loading: true, error: null });
  const trigger = useStore($refreshTrigger);
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/paymongo/check?feature=_subscription");
      if (!res.ok)
        throw new Error("Failed to get subscription");
      const data = await res.json();
      setState({ planId: data.planId ?? null, loading: false, error: null });
    } catch (e) {
      setState({ planId: null, loading: false, error: e });
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
function refreshBilling() {
  $refreshTrigger.set($refreshTrigger.get() + 1);
}
export {
  useSubscription,
  useCheck,
  refreshBilling,
  $refreshTrigger
};

//# debugId=CB55344ACA6EE76564756E2164756E21

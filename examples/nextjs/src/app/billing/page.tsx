"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { CheckResponse } from "better-auth-paymongo";

function UsageMeter({ featureId, label, refreshKey }: { featureId: string; label: string; refreshKey: number }) {
  const [usage, setUsage] = useState<CheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [consuming, setConsuming] = useState(false);

  const fetchUsage = useCallback(() => {
    setLoading(true);
    authClient.paymongo
      .check({ query: { feature: featureId } })
      .then(({ data }) => {
        if (data) setUsage(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [featureId]);

  useEffect(() => {
    fetchUsage();
  }, [featureId, refreshKey, fetchUsage]);

  const consumeResource = async (amount: number) => {
    setConsuming(true);
    try {
      await authClient.paymongo.track({ feature: featureId, delta: amount });
      fetchUsage();
    } catch (err) {
      console.error("Failed to consume:", err);
    } finally {
      setConsuming(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 mb-4"></div>
        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
      </div>
    );
  }

  if (!usage) return null;

  const percentage =
    usage.limit && usage.balance !== undefined
      ? Math.round((usage.balance / usage.limit) * 100)
      : 0;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
      <div className="flex justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-zinc-500">
          {usage.balance ?? 0} / {usage.limit ?? "∞"}
        </span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 80
              ? "bg-red-500"
              : percentage > 50
                ? "bg-yellow-500"
                : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {!usage.allowed && (
        <p className="text-red-500 text-sm mt-2">Limit reached</p>
      )}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => consumeResource(1)}
          disabled={consuming || !usage.allowed}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use 1
        </button>
        <button
          onClick={() => consumeResource(10)}
          disabled={consuming || !usage.allowed}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use 10
        </button>
        <button
          onClick={() => consumeResource(50)}
          disabled={consuming || !usage.allowed}
          className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use 50
        </button>
      </div>
    </div>
  );
}

function CurrentPlan({ refreshKey }: { refreshKey: number }) {
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    authClient.paymongo
      .check({ query: { feature: "projects" } })
      .then(({ data }) => {
        setPlanId(data?.planId || null);
      })
      .catch(console.error);
  }, [refreshKey]);

  const planNames: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
      <h2 className="text-xl font-bold mb-4">Current Plan</h2>
      <p className="text-3xl font-bold text-orange-600">
        {planId ? planNames[planId] || planId : "No Plan"}
      </p>
      <a
        href="/pricing"
        className="inline-block mt-4 text-orange-600 hover:underline"
      >
        Change Plan →
      </a>
    </div>
  );
}

function FeatureAccess({ featureId, label, refreshKey }: { featureId: string; label: string; refreshKey: number }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    authClient.paymongo
      .check({ query: { feature: featureId } })
      .then(({ data }) => setAllowed(data?.allowed ?? null))
      .catch(console.error);
  }, [featureId, refreshKey]);

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-0">
      <span>{label}</span>
      <span
        className={`px-2 py-1 rounded text-sm ${
          allowed
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {allowed ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [verifying, setVerifying] = useState(!!ref);
  const [verified, setVerified] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (ref && !verified) {
      authClient.paymongo
        .verify({ ref })
        .then(({ data, error }) => {
          if (error) throw error;
          setVerified(true);
          window.history.replaceState({}, "", "/billing");
          setRefreshKey((k) => k + 1);
        })
        .catch(console.error)
        .finally(() => setVerifying(false));
    }
  }, [ref, verified]);

  if (verifying) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
        <p className="text-lg">Verifying payment...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <CurrentPlan refreshKey={refreshKey} />
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-bold mb-4">Feature Access</h2>
          <FeatureAccess featureId="priority_support" label="Priority Support" refreshKey={refreshKey} />
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6">Usage</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <UsageMeter featureId="projects" label="Projects" refreshKey={refreshKey} />
        <UsageMeter featureId="storage" label="Storage (MB)" refreshKey={refreshKey} />
        <UsageMeter featureId="api_calls" label="API Calls" refreshKey={refreshKey} />
      </div>
    </div>
  );
}

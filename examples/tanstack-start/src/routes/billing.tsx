import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

type FeatureUsage = {
  allowed: boolean;
  balance?: number;
  limit?: number;
  planId?: string;
};

function UsageCard({ title, featureId }: { title: string; featureId: string }) {
  const [usage, setUsage] = useState<FeatureUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.paymongo
      .check(featureId)
      .then(({ data }) => {
        if (data) setUsage(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [featureId]);

  if (loading) {
    return (
      <div className="p-6 border rounded-lg bg-white animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!usage) return null;

  const used = (usage.limit || 0) - (usage.balance || 0);
  const percentage = usage.limit ? (used / usage.limit) * 100 : 0;

  return (
    <div className="p-6 border rounded-lg bg-white">
      <h3 className="font-semibold text-gray-600">{title}</h3>
      <p className="text-2xl font-bold mt-1">
        {used} / {usage.limit}
      </p>
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percentage > 80 ? "bg-red-500" : "bg-orange-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {usage.balance} remaining this month
      </p>
    </div>
  );
}

function BillingPage() {
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    authClient.paymongo
      .check("projects")
      .then(({ data }) => setPlanId(data?.planId || null))
      .catch(console.error);
  }, []);

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Billing Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Current Plan:{" "}
        <span className="font-semibold text-orange-600">
          {planId || "Free"}
        </span>
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <UsageCard title="Projects" featureId="projects" />
        <UsageCard title="API Calls" featureId="api_calls" />
      </div>

      <div className="p-6 border rounded-lg bg-white">
        <h2 className="text-xl font-semibold mb-4">Feature Access</h2>
        <FeatureCheck title="PDF Export" featureId="export_pdf" />
        <FeatureCheck title="Priority Support" featureId="priority_support" />
      </div>
    </main>
  );
}

function FeatureCheck({
  title,
  featureId,
}: {
  title: string;
  featureId: string;
}) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    authClient.paymongo
      .check(featureId)
      .then(({ data }) => setAllowed(data?.allowed ?? null))
      .catch(console.error);
  }, [featureId]);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <span>{title}</span>
      {allowed === null ? (
        <span className="text-gray-400">Loading...</span>
      ) : allowed ? (
        <span className="text-green-600 font-medium">✓ Enabled</span>
      ) : (
        <span className="text-gray-400">✗ Not included</span>
      )}
    </div>
  );
}

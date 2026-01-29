"use client";

import { authClient } from "@/lib/auth-client";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    period: "/month",
    features: ["3 Projects", "100MB Storage", "100 API calls/month"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱999",
    period: "/month",
    features: ["25 Projects", "10GB Storage", "10,000 API calls/month"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₱4,999",
    period: "/month",
    features: [
      "1000 Projects",
      "100GB Storage",
      "100,000 API calls/month",
      "Priority Support",
    ],
    highlight: false,
  },
];

export default function PricingPage() {
  async function subscribe(planId: string) {
    const { data, error } = await authClient.paymongo.attach({
      planId,
      successUrl: `${window.location.origin}/billing`,
      cancelUrl: `${window.location.origin}/pricing`,
    });

    if (error || !data) {
      console.error("Failed to create checkout:", error);
      alert("Please sign in first to subscribe");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h1>
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl p-8 ${
              plan.highlight
                ? "bg-orange-600 text-white ring-2 ring-orange-600"
                : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="opacity-70">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(plan.id)}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                plan.highlight
                  ? "bg-white text-orange-600 hover:bg-zinc-100"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {plan.id === "free" ? "Get Started" : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

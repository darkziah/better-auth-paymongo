import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const plans = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    period: "/month",
    features: ["3 projects", "100 API calls", "Community support"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₱499",
    period: "/month",
    features: ["10 projects", "1,000 API calls", "PDF Export", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱999",
    period: "/month",
    popular: true,
    features: [
      "100 projects",
      "10,000 API calls",
      "PDF Export",
      "Priority support",
    ],
  },
];

function PricingPage() {
  async function subscribe(planId: string) {
    const { data, error } = await authClient.paymongo.attach(planId, {
      successUrl: `${window.location.origin}/billing?success=true`,
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
    <main className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing</h1>
        <p className="text-gray-600">Choose the plan that works for you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 bg-white ${
              plan.popular ? "border-orange-500 ring-2 ring-orange-500" : ""
            }`}
          >
            {plan.popular && (
              <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                Popular
              </span>
            )}
            <h2 className="text-2xl font-bold mt-4">{plan.name}</h2>
            <p className="mt-2">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-gray-500">{plan.period}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(plan.id)}
              className="mt-8 w-full py-3 rounded-lg font-semibold bg-orange-500 text-white hover:bg-orange-600 transition"
            >
              {plan.id === "free" ? "Get Started" : "Subscribe"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

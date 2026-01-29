import { describe, expect, it } from "bun:test";

describe("PayMongo Plugin Configuration", () => {
  const features = {
    projects: { type: "metered" as const, limit: 3 },
    storage: { type: "metered" as const, limit: 100 },
    api_calls: { type: "metered" as const, limit: 1000 },
    priority_support: { type: "boolean" as const },
  };

  const plans = {
    free: {
      amount: 0,
      currency: "PHP",
      displayName: "Free",
      interval: "monthly" as const,
      features: { projects: 3, storage: 100, api_calls: 100, priority_support: false },
    },
    pro: {
      amount: 99900,
      currency: "PHP",
      displayName: "Pro",
      interval: "monthly" as const,
      features: { projects: 25, storage: 10000, api_calls: 10000, priority_support: false },
    },
    enterprise: {
      amount: 499900,
      currency: "PHP",
      displayName: "Enterprise",
      interval: "monthly" as const,
      features: { projects: 1000, storage: 100000, api_calls: 100000, priority_support: true },
    },
  };

  it("should have valid feature configurations", () => {
    expect(features.projects.type).toBe("metered");
    expect(features.projects.limit).toBe(3);
    expect(features.priority_support.type).toBe("boolean");
  });

  it("should have valid plan configurations", () => {
    expect(plans.free.amount).toBe(0);
    expect(plans.pro.amount).toBe(99900);
    expect(plans.enterprise.amount).toBe(499900);
  });

  it("should have correct currency for all plans", () => {
    Object.values(plans).forEach((plan) => {
      expect(plan.currency).toBe("PHP");
    });
  });

  it("should have all features in each plan", () => {
    const featureKeys = Object.keys(features);
    Object.values(plans).forEach((plan) => {
      featureKeys.forEach((key) => {
        expect(plan.features).toHaveProperty(key);
      });
    });
  });

  it("enterprise should have priority_support enabled", () => {
    expect(plans.enterprise.features.priority_support).toBe(true);
    expect(plans.free.features.priority_support).toBe(false);
    expect(plans.pro.features.priority_support).toBe(false);
  });

  it("should have valid billing intervals", () => {
    Object.values(plans).forEach((plan) => {
      expect(["monthly", "yearly"]).toContain(plan.interval);
    });
  });
});

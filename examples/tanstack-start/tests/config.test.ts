import { describe, test, expect, beforeAll } from "bun:test";
import { auth, paymongoConfig } from "../src/lib/auth";

describe("PayMongo Plugin Configuration", () => {
  test("paymongoConfig has required properties", () => {
    expect(paymongoConfig).toHaveProperty("secretKey");
    expect(paymongoConfig).toHaveProperty("features");
    expect(paymongoConfig).toHaveProperty("plans");
  });

  test("features are correctly configured", () => {
    const { features } = paymongoConfig;
    
    expect(features.projects).toEqual({ type: "metered", limit: 3 });
    expect(features.api_calls).toEqual({ type: "metered", limit: 100 });
    expect(features.export_pdf).toEqual({ type: "boolean" });
    expect(features.priority_support).toEqual({ type: "boolean" });
  });

  test("plans have correct structure", () => {
    const { plans } = paymongoConfig;
    
    expect(Object.keys(plans)).toEqual(["free", "starter", "pro"]);
    
    expect(plans.free).toMatchObject({
      amount: 0,
      currency: "PHP",
      interval: "monthly",
    });
    
    expect(plans.pro).toMatchObject({
      amount: 99900,
      currency: "PHP",
      displayName: "Pro",
      interval: "monthly",
    });
  });

  test("plan features override defaults correctly", () => {
    const { plans, features } = paymongoConfig;
    
    expect(plans.free.features.projects).toBe(3);
    expect(plans.starter.features.projects).toBe(10);
    expect(plans.pro.features.projects).toBe(100);
    
    expect(plans.free.features.export_pdf).toBe(false);
    expect(plans.starter.features.export_pdf).toBe(true);
    expect(plans.pro.features.export_pdf).toBe(true);
  });
});

describe("Better-Auth Instance", () => {
  test("auth instance is created", () => {
    expect(auth).toBeDefined();
  });

  test("auth has handler function", () => {
    expect(typeof auth.handler).toBe("function");
  });
});

import { betterAuth } from "better-auth";
import { paymongo } from "better-auth-paymongo";
import Database from "better-sqlite3";

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
    features: {
      projects: 3,
      storage: 100,
      api_calls: 100,
      priority_support: false,
    },
  },
  pro: {
    amount: 99900,
    currency: "PHP",
    displayName: "Pro",
    interval: "monthly" as const,
    features: {
      projects: 25,
      storage: 10000,
      api_calls: 10000,
      priority_support: false,
    },
  },
  enterprise: {
    amount: 499900,
    currency: "PHP",
    displayName: "Enterprise",
    interval: "monthly" as const,
    features: {
      projects: 1000,
      storage: 100000,
      api_calls: 100000,
      priority_support: true,
    },
  },
};

export const auth = betterAuth({
  database: new Database("local.db"),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  plugins: [
    paymongo({
      secretKey: process.env.PAYMONGO_SECRET_KEY!,
      features,
      plans,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

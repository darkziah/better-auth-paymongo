import { betterAuth } from "better-auth";
import { paymongo } from "better-auth-paymongo";
import { Database } from "bun:sqlite";

export const paymongoConfig = {
  secretKey: process.env.PAYMONGO_SECRET_KEY!,
  features: {
    projects: { type: "metered" as const, limit: 3 },
    api_calls: { type: "metered" as const, limit: 100 },
    export_pdf: { type: "boolean" as const },
    priority_support: { type: "boolean" as const },
  },
  plans: {
    free: {
      amount: 0,
      currency: "PHP",
      displayName: "Free",
      interval: "monthly" as const,
      features: {
        projects: 3,
        api_calls: 100,
        export_pdf: false,
        priority_support: false,
      },
    },
    starter: {
      amount: 49900,
      currency: "PHP",
      displayName: "Starter",
      interval: "monthly" as const,
      features: {
        projects: 10,
        api_calls: 1000,
        export_pdf: true,
        priority_support: false,
      },
    },
    pro: {
      amount: 99900,
      currency: "PHP",
      displayName: "Pro",
      interval: "monthly" as const,
      features: {
        projects: 100,
        api_calls: 10000,
        export_pdf: true,
        priority_support: true,
      },
    },
  },
};

export const auth = betterAuth({
  database: new Database("local.db"),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [paymongo(paymongoConfig)],
});

export type Session = typeof auth.$Infer.Session;

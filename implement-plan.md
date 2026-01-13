
```markdown
# COMPREHENSIVE PROMPT: Build PayMongo Better-Auth Plugin with Generic Subscriptions

You are an expert TypeScript developer specializing in authentication systems, payment integrations, and plugin architecture. Your task is to create a production-ready Better-Auth plugin that integrates PayMongo (Philippine payment gateway) with full support for user and organization subscriptions, custom plans, add-ons, and usage-based limits.

## PROJECT CONTEXT

### What is Better-Auth?
Better-Auth is a modern authentication framework for TypeScript that uses a plugin-based architecture. Plugins can:
- Extend database schemas (user, session, organization tables)
- Add custom endpoints (server-side API routes)
- Provide client-side methods (type-safe API calls)
- Use hooks to intercept auth lifecycle events
- Be fully type-safe with TypeScript generics

### What is PayMongo?
PayMongo is a Philippine payment gateway supporting:
- GCash, credit/debit cards, PayMaya, bank transfers
- Payment Intents API for one-time payments
- Subscriptions API for recurring billing
- Webhooks for payment events (we will NOT use webhooks)

### Plugin Requirements
Create a plugin that:
1. **Is fully generic** - Developers must define their own plans and add-ons
2. **Supports dual scopes** - User-level AND organization-level subscriptions
3. **Enforces usage limits** - Track and enforce limits like seats, storage, API calls
4. **Provides add-ons** - Quantity-based (extra seats) and feature-based (priority support)
5. **Defers verification** - Store payment IDs for later verification (no webhooks)
6. **Is type-safe** - Full TypeScript inference across server and client
7. **Is embedded** - No external dashboard, everything in the codebase

---

## PHASE 1: TYPE SYSTEM DESIGN

### File: `plugins/paymongo-plugin/types.ts`

Create comprehensive type definitions:

```typescript
/**
 * Base configuration for a subscription plan
 * Developers must implement this interface for each plan
 */
export interface BasePlanConfig {
  /** Unique identifier for the plan */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Price in PHP (e.g., 999 for ₱999.00) */
  price: number;
  
  /** Billing interval */
  interval?: "monthly" | "yearly";
  
  /** List of features included in the plan */
  features: string[];
  
  /** 
   * Usage limits for this plan
   * Keys are arbitrary (e.g., "seats", "storage", "apiCalls", "projects")
   * Developers define their own limit keys
   */
  limits: Record<string, number>;
  
  /** 
   * Who can subscribe to this plan
   * - "user": Individual users only
   * - "organization": Organizations only  
   * - "both": Available to both
   */
  scope: "user" | "organization" | "both";
}

/**
 * Base configuration for subscription add-ons
 * Developers must implement this interface for each add-on
 */
export interface BaseAddonConfig {
  /** Unique identifier for the add-on */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Price per unit in PHP */
  price: number;
  
  /** 
   * Add-on type:
   * - "quantity": Purchasable in quantities (e.g., 10 extra seats)
   * - "feature": One-time unlock (e.g., priority support)
   */
  type: "quantity" | "feature";
  
  /** Unit label for quantity add-ons (e.g., "seat", "GB", "project") */
  unitLabel?: string;
  
  /** Maximum quantity that can be purchased (optional) */
  maxQuantity?: number;
  
  /** 
   * Which limit key this add-on affects (for quantity type)
   * Must match a key in plan.limits
   * Example: "seats" add-on would set affectsLimit: "seats"
   */
  affectsLimit?: string;
  
  /** Who can purchase this add-on */
  scope: "user" | "organization" | "both";
}

/**
 * Plugin configuration that developers must provide
 */
export interface PaymongoPluginConfig<
  TPlans extends Record<string, BasePlanConfig>,
  TAddons extends Record<string, BaseAddonConfig>
> {
  /** PayMongo secret key (from dashboard) */
  secretKey: string;
  
  /** PayMongo publishable key (for client-side) */
  publishableKey: string;
  
  /** Developer-defined plans */
  plans: TPlans;
  
  /** Developer-defined add-ons */
  addons: TAddons;
}

/**
 * Extract plan IDs as union type
 * Example: "free" | "pro" | "enterprise"
 */
export type PlanId<T extends Record<string, BasePlanConfig>> = keyof T & string;

/**
 * Extract add-on IDs as union type
 * Example: "extraSeats" | "extraStorage"
 */
export type AddonId<T extends Record<string, BaseAddonConfig>> = keyof T & string;

/**
 * Subscription data stored in database
 * Saved in user.paymongoData or organization.paymongoData
 */
export interface SubscriptionData<
  TPlans extends Record<string, BasePlanConfig>,
  TAddons extends Record<string, BaseAddonConfig>
> {
  /** PayMongo subscription ID */
  subscriptionId: string;
  
  /** Selected plan ID (type-safe from TPlans) */
  planId: PlanId<TPlans>;
  
  /** Current subscription status */
  status: "pending" | "verified" | "cancelled";
  
  /** Purchased add-ons with quantities */
  addons: Array<{
    addonId: AddonId<TAddons>;
    quantity: number;
  }>;
  
  /** 
   * Current usage for each limit
   * Keys match plan.limits keys
   */
  usage: Record<string, number>;
  
  /** 
   * Total limits (plan limits + add-on bonuses)
   * Keys match plan.limits keys
   */
  limits: Record<string, number>;
}

/**
 * PayMongo Payment Intent response structure
 */
export interface PaymongoPaymentIntent {
  id: string;
  attributes: {
    client_key: string;
    amount: number;
    currency: string;
    status: string;
    payment_method?: {
      id: string;
      type: string;
    };
  };
}

/**
 * PayMongo Subscription response structure
 */
export interface PaymongoSubscription {
  id: string;
  attributes: {
    status: "active" | "cancelled" | "pending";
    amount: number;
    payment_method_id?: string;
  };
}
```


---

## PHASE 2: SERVER PLUGIN IMPLEMENTATION

### File: `plugins/paymongo-plugin/server.ts`

Implement the full server plugin with all endpoints:

```typescript
import { BetterAuthPlugin } from "better-auth";
import type {
  PaymongoPluginConfig,
  BasePlanConfig,
  BaseAddonConfig,
  PlanId,
  AddonId,
  SubscriptionData,
  PaymongoPaymentIntent,
  PaymongoSubscription,
} from "./types";
import { z } from "zod";

/**
 * PayMongo Better-Auth Plugin
 * 
 * @template TPlans - Record of developer-defined plans
 * @template TAddons - Record of developer-defined add-ons
 * 
 * @example
 * ```typescript
 * const auth = betterAuth({
 *   plugins: [
 *     paymongo({
 *       secretKey: process.env.PAYMONGO_SECRET_KEY!,
 *       publishableKey: process.env.PAYMONGO_PUB_KEY!,
 *       plans: myPlans,
 *       addons: myAddons,
 *     })
 *   ]
 * });
 * ```
 */
export function paymongo<
  TPlans extends Record<string, BasePlanConfig>,
  TAddons extends Record<string, BaseAddonConfig>
>(config: PaymongoPluginConfig<TPlans, TAddons>) {
  // Extract type-safe plan and addon IDs
  type TPlanId = PlanId<TPlans>;
  type TAddonId = AddonId<TAddons>;

  const planKeys = Object.keys(config.plans) as TPlanId[];
  const addonKeys = Object.keys(config.addons) as TAddonId[];

  // Helper: Make authenticated PayMongo API calls
  const paymongoFetch = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = "https://api.paymongo.com/v1";
    const authHeader = `Basic ${Buffer.from(config.secretKey + ":").toString("base64")}`;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayMongo API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  };

  return {
    id: "paymongo",
    
    /**
     * Database schema extensions
     * Adds paymongoData JSONB field to user and organization tables
     */
    schema: {
      user: {
        fields: {
          paymongoData: {
            type: "json",
            defaultValue: null,
            nullable: true,
          },
        },
      },
      organization: {
        fields: {
          paymongoData: {
            type: "json",
            defaultValue: null,
            nullable: true,
          },
        },
      },
    },

    /**
     * Server endpoints (API routes)
     */
    endpoints: {
      /**
       * ENDPOINT: Create Payment Intent
       * 
       * Step 1 of subscription flow
       * Creates PayMongo payment intent for client to attach payment method
       * 
       * @returns clientKey and paymentIntentId for client-side form
       */
      createPaymentIntent: {
        method: "POST",
        body: z.object({
          amount: z.number().min(1).describe("Amount in PHP"),
          currency: z.string().default("PHP"),
          paymentMethods: z
            .array(z.string())
            .default(["gcash", "card"])
            .describe("Allowed payment methods"),
        }),
        handler: async ({ body }) => {
          const response = await paymongoFetch("/payment_intents", {
            method: "POST",
            body: JSON.stringify({
              data: {
                attributes: {
                  amount: body.amount * 100, // Convert to centavos
                  payment_method_allowed: body.paymentMethods,
                  currency: body.currency,
                  description: "Subscription Payment",
                },
              },
            }),
          });

          const data = response.data as PaymongoPaymentIntent;

          return {
            clientKey: data.attributes.client_key,
            paymentIntentId: data.id,
            status: data.attributes.status,
          };
        },
      },

      /**
       * ENDPOINT: Create Subscription
       * 
       * Step 2 of subscription flow (after client attaches payment method)
       * Creates subscription, calculates limits, saves to database
       * 
       * Supports both user and organization scopes
       */
      createSubscription: {
        method: "POST",
        middleware: ["sessionMiddleware"], // Requires authenticated user
        body: z.object({
          paymentIntentId: z.string().describe("Payment intent from step 1"),
          planId: z.enum(planKeys as [TPlanId, ...TPlanId[]]).describe("Selected plan"),
          addons: z
            .array(
              z.object({
                addonId: z.enum(addonKeys as [TAddonId, ...TAddonId[]]),
                quantity: z.number().min(1).max(1000),
              })
            )
            .optional()
            .describe("Optional add-ons to purchase"),
          scope: z.enum(["user", "organization"]).describe("Subscription scope"),
          organizationId: z
            .string()
            .optional()
            .describe("Required if scope is organization"),
        }),
        handler: async ({ body, context }) => {
          const plan = config.plans[body.planId];

          // VALIDATION: Check plan scope
          if (plan.scope !== "both" && plan.scope !== body.scope) {
            throw new Error(
              `Plan "${body.planId}" is only available for ${plan.scope} subscriptions`
            );
          }

          // VALIDATION: Require organizationId for org subscriptions
          if (body.scope === "organization" && !body.organizationId) {
            throw new Error("organizationId is required for organization subscriptions");
          }

          // VALIDATION: User must be org member/owner
          if (body.scope === "organization") {
            const membership = await context.adapter.findOrganizationMembership({
              userId: context.session.user.id,
              organizationId: body.organizationId!,
            });
            
            if (!membership || membership.role !== "owner") {
              throw new Error("Only organization owners can create subscriptions");
            }
          }

          // CALCULATE LIMITS: Start with plan base limits
          const limits: Record<string, number> = { ...plan.limits };
          let totalAmount = plan.price;

          // Initialize usage to 0 for all limit keys
          const usage: Record<string, number> = {};
          Object.keys(limits).forEach((key) => {
            usage[key] = 0;
          });

          // PROCESS ADD-ONS
          if (body.addons) {
            for (const addon of body.addons) {
              const addonConfig = config.addons[addon.addonId];

              // Validate addon scope
              if (addonConfig.scope !== "both" && addonConfig.scope !== body.scope) {
                throw new Error(
                  `Add-on "${addon.addonId}" is not available for ${body.scope} subscriptions`
                );
              }

              // Validate max quantity
              if (addonConfig.maxQuantity && addon.quantity > addonConfig.maxQuantity) {
                throw new Error(
                  `Add-on "${addon.addonId}" exceeds maximum quantity of ${addonConfig.maxQuantity}`
                );
              }

              // Add to limits if quantity-based
              if (addonConfig.type === "quantity" && addonConfig.affectsLimit) {
                const limitKey = addonConfig.affectsLimit;
                
                // Ensure limit key exists in plan
                if (!(limitKey in limits)) {
                  throw new Error(
                    `Add-on "${addon.addonId}" affects unknown limit "${limitKey}"`
                  );
                }
                
                limits[limitKey] = (limits[limitKey] || 0) + addon.quantity;
              }

              // Add to total cost
              totalAmount += addonConfig.price * addon.quantity;
            }
          }

          // PAYMONGO API CALL: Attach payment method to intent
          const attachResponse = await paymongoFetch(
            `/payment_intents/${body.paymentIntentId}/attach`,
            {
              method: "POST",
              body: JSON.stringify({
                data: {
                  attributes: {
                    payment_method: body.paymentIntentId,
                  },
                },
              }),
            }
          );

          const paymentMethod = attachResponse.data.attributes.payment_method;

          // PAYMONGO API CALL: Create subscription
          const subscriptionResponse = await paymongoFetch("/subscriptions", {
            method: "POST",
            body: JSON.stringify({
              data: {
                attributes: {
                  payment_method_id: paymentMethod?.id,
                  amount: totalAmount * 100, // Convert to centavos
                  currency: "PHP",
                  description: `${plan.name} Plan`,
                  metadata: {
                    planId: body.planId,
                    scope: body.scope,
                    userId: context.session.user.id,
                    organizationId: body.organizationId || null,
                  },
                },
              },
            }),
          });

          const subscription = subscriptionResponse.data as PaymongoSubscription;

          // PREPARE SUBSCRIPTION DATA
          const subscriptionData: SubscriptionData<TPlans, TAddons> = {
            subscriptionId: subscription.id,
            planId: body.planId,
            status: "pending", // Will verify later
            addons: body.addons || [],
            usage,
            limits,
          };

          // SAVE TO DATABASE
          if (body.scope === "user") {
            await context.adapter.updateUser(context.session.user.id, {
              paymongoData: subscriptionData,
            });
          } else {
            await context.adapter.updateOrganization(body.organizationId!, {
              paymongoData: subscriptionData,
            });
          }

          return {
            success: true,
            subscriptionId: subscription.id,
            subscriptionData,
            totalAmount,
            scope: body.scope,
            paymongoStatus: subscription.attributes.status,
          };
        },
      },

      /**
       * ENDPOINT: Verify Subscription
       * 
       * Manually verify subscription status with PayMongo
       * Call this from cron jobs, admin panels, or user actions
       */
      verifySubscription: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          subscriptionId: z.string(),
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          // FETCH FROM PAYMONGO
          const response = await paymongoFetch(`/subscriptions/${body.subscriptionId}`);
          const subscription = response.data as PaymongoSubscription;

          // DETERMINE STATUS
          const newStatus: "verified" | "cancelled" | "pending" =
            subscription.attributes.status === "active"
              ? "verified"
              : subscription.attributes.status === "cancelled"
              ? "cancelled"
              : "pending";

          // FETCH CURRENT DATA
          let currentData: SubscriptionData<TPlans, TAddons> | null = null;
          let targetId = "";

          if (body.scope === "user") {
            currentData = context.session.user.paymongoData;
            targetId = context.session.user.id;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            currentData = org?.paymongoData;
            targetId = body.organizationId;
          }

          if (!currentData) {
            throw new Error("No subscription data found");
          }

          // UPDATE STATUS
          const updatedData = { ...currentData, status: newStatus };

          if (body.scope === "user") {
            await context.adapter.updateUser(targetId, { paymongoData: updatedData });
          } else {
            await context.adapter.updateOrganization(targetId, {
              paymongoData: updatedData,
            });
          }

          return {
            success: true,
            status: newStatus,
            paymongoStatus: subscription.attributes.status,
            subscriptionId: body.subscriptionId,
          };
        },
      },

      /**
       * ENDPOINT: Add Add-on
       * 
       * Purchase additional add-ons for existing subscription
       * Updates limits and creates one-time payment
       */
      addAddon: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          addonId: z.enum(addonKeys as [TAddonId, ...TAddonId[]]),
          quantity: z.number().min(1).max(1000),
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          const addonConfig = config.addons[body.addonId];

          // VALIDATION: Check addon scope
          if (addonConfig.scope !== "both" && addonConfig.scope !== body.scope) {
            throw new Error(
              `Add-on "${body.addonId}" is not available for ${body.scope} subscriptions`
            );
          }

          // FETCH CURRENT SUBSCRIPTION DATA
          let userData: SubscriptionData<TPlans, TAddons> | null = null;
          let targetId = "";

          if (body.scope === "user") {
            userData = context.session.user.paymongoData;
            targetId = context.session.user.id;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            userData = org?.paymongoData;
            targetId = body.organizationId;
          }

          if (!userData?.subscriptionId) {
            throw new Error("No active subscription found");
          }

          if (userData.status !== "verified") {
            throw new Error("Subscription must be verified before adding add-ons");
          }

          // CHECK EXISTING QUANTITY
          const existingAddon = userData.addons.find((a) => a.addonId === body.addonId);
          const newQuantity = (existingAddon?.quantity || 0) + body.quantity;

          // VALIDATE MAX QUANTITY
          if (addonConfig.maxQuantity && newQuantity > addonConfig.maxQuantity) {
            throw new Error(
              `Maximum ${addonConfig.maxQuantity} ${addonConfig.unitLabel}(s) allowed for "${body.addonId}"`
            );
          }

          // UPDATE LIMITS
          const limits = { ...userData.limits };
          if (addonConfig.type === "quantity" && addonConfig.affectsLimit) {
            const limitKey = addonConfig.affectsLimit;
            
            if (!(limitKey in limits)) {
              throw new Error(`Add-on affects unknown limit "${limitKey}"`);
            }
            
            limits[limitKey] = (limits[limitKey] || 0) + body.quantity;
          }

          // CALCULATE COST
          const amount = addonConfig.price * body.quantity;

          // CREATE ONE-TIME PAYMENT INTENT (developers handle client payment)
          const paymentResponse = await paymongoFetch("/payment_intents", {
            method: "POST",
            body: JSON.stringify({
              data: {
                attributes: {
                  amount: amount * 100,
                  payment_method_allowed: ["gcash", "card"],
                  currency: "PHP",
                  description: `Add-on: ${addonConfig.name} x${body.quantity}`,
                },
              },
            }),
          });

          // UPDATE ADDONS LIST
          const updatedAddons = existingAddon
            ? userData.addons.map((a) =>
                a.addonId === body.addonId ? { ...a, quantity: newQuantity } : a
              )
            : [...userData.addons, { addonId: body.addonId, quantity: body.quantity }];

          // SAVE TO DATABASE
          const updatedData = { ...userData, addons: updatedAddons, limits };

          if (body.scope === "user") {
            await context.adapter.updateUser(targetId, { paymongoData: updatedData });
          } else {
            await context.adapter.updateOrganization(targetId, {
              paymongoData: updatedData,
            });
          }

          return {
            success: true,
            limits,
            addons: updatedAddons,
            amount,
            paymentIntentId: paymentResponse.data.id,
            clientKey: paymentResponse.data.attributes.client_key,
          };
        },
      },

      /**
       * ENDPOINT: Check Usage
       * 
       * Get current usage, limits, and remaining quota
       */
      checkUsage: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          let userData: SubscriptionData<TPlans, TAddons> | null = null;

          if (body.scope === "user") {
            userData = context.session.user.paymongoData;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            userData = org?.paymongoData;
          }

          if (!userData) {
            throw new Error("No subscription data found");
          }

          // CALCULATE REMAINING
          const remaining: Record<string, number> = {};
          Object.keys(userData.limits).forEach((key) => {
            remaining[key] = Math.max(0, userData.limits[key] - (userData.usage[key] || 0));
          });

          return {
            usage: userData.usage,
            limits: userData.limits,
            remaining,
            planId: userData.planId,
            status: userData.status,
          };
        },
      },

      /**
       * ENDPOINT: Increment Usage
       * 
       * Increment usage for a specific limit key
       * Throws error if limit exceeded
       * 
       * Call this from your app when users:
       * - Invite team members (seats)
       * - Upload files (storage)
       * - Make API calls (apiCalls)
       * - Create projects (projects)
       */
      incrementUsage: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          limitKey: z.string().describe("Limit key to increment"),
          amount: z.number().min(1).describe("Amount to increment by"),
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          // FETCH CURRENT DATA
          let userData: SubscriptionData<TPlans, TAddons> | null = null;
          let targetId = "";

          if (body.scope === "user") {
            userData = context.session.user.paymongoData;
            targetId = context.session.user.id;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            userData = org?.paymongoData;
            targetId = body.organizationId;
          }

          if (!userData) {
            throw new Error("No subscription found");
          }

          // VALIDATE LIMIT KEY
          if (!(body.limitKey in userData.limits)) {
            throw new Error(`Invalid limit key: "${body.limitKey}"`);
          }

          // CALCULATE NEW USAGE
          const currentUsage = userData.usage[body.limitKey] || 0;
          const newUsage = currentUsage + body.amount;
          const limit = userData.limits[body.limitKey];

          // CHECK LIMIT
          if (newUsage > limit) {
            throw new Error(
              `Limit exceeded for "${body.limitKey}". Current: ${currentUsage}, Attempted: ${newUsage}, Limit: ${limit}`
            );
          }

          // UPDATE USAGE
          const updatedData = {
            ...userData,
            usage: { ...userData.usage, [body.limitKey]: newUsage },
          };

          if (body.scope === "user") {
            await context.adapter.updateUser(targetId, { paymongoData: updatedData });
          } else {
            await context.adapter.updateOrganization(targetId, {
              paymongoData: updatedData,
            });
          }

          return {
            success: true,
            limitKey: body.limitKey,
            newUsage,
            limit,
            remaining: limit - newUsage,
          };
        },
      },

      /**
       * ENDPOINT: Decrement Usage
       * 
       * Decrease usage (e.g., when user deletes files, removes team members)
       */
      decrementUsage: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          limitKey: z.string(),
          amount: z.number().min(1),
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          let userData: SubscriptionData<TPlans, TAddons> | null = null;
          let targetId = "";

          if (body.scope === "user") {
            userData = context.session.user.paymongoData;
            targetId = context.session.user.id;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            userData = org?.paymongoData;
            targetId = body.organizationId;
          }

          if (!userData || !(body.limitKey in userData.limits)) {
            throw new Error("Invalid subscription or limit key");
          }

          const currentUsage = userData.usage[body.limitKey] || 0;
          const newUsage = Math.max(0, currentUsage - body.amount);

          const updatedData = {
            ...userData,
            usage: { ...userData.usage, [body.limitKey]: newUsage },
          };

          if (body.scope === "user") {
            await context.adapter.updateUser(targetId, { paymongoData: updatedData });
          } else {
            await context.adapter.updateOrganization(targetId, {
              paymongoData: updatedData,
            });
          }

          return {
            success: true,
            limitKey: body.limitKey,
            newUsage,
            limit: userData.limits[body.limitKey],
            remaining: userData.limits[body.limitKey] - newUsage,
          };
        },
      },

      /**
       * ENDPOINT: Get Active Subscription
       * 
       * Intelligently returns the active subscription for current context
       * Priority: Organization subscription > User subscription
       */
      getActiveSubscription: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          organizationId: z.string().optional().describe("Organization context if applicable"),
        }),
        handler: async ({ body, context }) => {
          // CHECK ORGANIZATION SUBSCRIPTION FIRST
          if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            const orgSub = org?.paymongoData as SubscriptionData<TPlans, TAddons> | null;

            if (orgSub && orgSub.status === "verified") {
              return {
                subscription: orgSub,
                scope: "organization" as const,
                source: "organization" as const,
                organizationId: body.organizationId,
              };
            }
          }

          // FALLBACK TO USER SUBSCRIPTION
          const userSub = context.session.user.paymongoData as
            | SubscriptionData<TPlans, TAddons>
            | null;

          if (userSub && userSub.status === "verified") {
            return {
              subscription: userSub,
              scope: "user" as const,
              source: "user" as const,
              userId: context.session.user.id,
            };
          }

          // NO ACTIVE SUBSCRIPTION
          return {
            subscription: null,
            scope: null,
            source: null,
          };
        },
      },

      /**
       * ENDPOINT: Cancel Subscription
       * 
       * Cancel subscription with PayMongo and update database
       */
      cancelSubscription: {
        method: "POST",
        middleware: ["sessionMiddleware"],
        body: z.object({
          scope: z.enum(["user", "organization"]),
          organizationId: z.string().optional(),
        }),
        handler: async ({ body, context }) => {
          let userData: SubscriptionData<TPlans, TAddons> | null = null;
          let targetId = "";

          if (body.scope === "user") {
            userData = context.session.user.paymongoData;
            targetId = context.session.user.id;
          } else if (body.organizationId) {
            const org = await context.adapter.findOrganization(body.organizationId);
            userData = org?.paymongoData;
            targetId = body.organizationId;
          }

          if (!userData?.subscriptionId) {
            throw new Error("No active subscription to cancel");
          }

          // CANCEL WITH PAYMONGO
          await paymongoFetch(`/subscriptions/${userData.subscriptionId}`, {
            method: "DELETE",
          });

          // UPDATE DATABASE
          const updatedData = { ...userData, status: "cancelled" as const };

          if (body.scope === "user") {
            await context.adapter.updateUser(targetId, { paymongoData: updatedData });
          } else {
            await context.adapter.updateOrganization(targetId, {
              paymongoData: updatedData,
            });
          }

          return {
            success: true,
            status: "cancelled",
            subscriptionId: userData.subscriptionId,
          };
        },
      },
    },
  } satisfies BetterAuthPlugin;
}
```


---

## PHASE 3: CLIENT PLUGIN

### File: `plugins/paymongo-plugin/client.ts`

```typescript
import { createAuthClientPlugin } from "better-auth/client";

/**
 * Client-side plugin for PayMongo
 * Automatically infers types from server plugin
 */
export const paymongoClient = createAuthClientPlugin({
  name: "paymongo",
});

/**
 * Export type helper for client inference
 */
export type PaymongoClient = typeof paymongoClient;
```


---

## PHASE 4: DOCUMENTATION \& USAGE EXAMPLES

### File: `plugins/paymongo-plugin/README.md`

Create comprehensive documentation with:

1. **Installation instructions**
2. **Configuration examples** (3-4 different use cases)
3. **Complete workflow examples** with code
4. **API reference** for all endpoints
5. **Error handling guide**
6. **Testing strategies**
7. **Production deployment checklist**

### Example Configuration

```typescript
// Example 1: SaaS with user and org plans
const myPlans = {
  personal: {
    id: "personal",
    name: "Personal",
    price: 499,
    scope: "user",
    limits: { projects: 5, storage: 10, apiCalls: 1000 },
    features: ["basic-analytics", "email-support"],
  },
  team: {
    id: "team",
    name: "Team",
    price: 2999,
    interval: "monthly",
    scope: "organization",
    limits: { seats: 10, projects: 50, storage: 100, apiCalls: 50000 },
    features: ["team-collaboration", "advanced-analytics", "priority-support"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 9999,
    interval: "monthly",
    scope: "organization",
    limits: { seats: 100, projects: 500, storage: 1000, apiCalls: 500000 },
    features: ["sso", "audit-logs", "dedicated-support", "custom-integrations"],
  },
} as const satisfies Record<string, BasePlanConfig>;

const myAddons = {
  extraSeats: {
    id: "extraSeats",
    name: "Extra Team Seats",
    price: 299,
    type: "quantity",
    scope: "organization",
    unitLabel: "seat",
    maxQuantity: 50,
    affectsLimit: "seats",
  },
  extraStorage: {
    id: "extraStorage",
    name: "Extra Storage",
    price: 99,
    type: "quantity",
    scope: "both",
    unitLabel: "GB",
    maxQuantity: 500,
    affectsLimit: "storage",
  },
  prioritySupport: {
    id: "prioritySupport",
    name: "Priority Support",
    price: 499,
    type: "feature",
    scope: "both",
  },
} as const satisfies Record<string, BaseAddonConfig>;
```


### Complete Usage Flow

```typescript
// auth.ts - Setup
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { paymongo } from "./plugins/paymongo-plugin/server";

export const auth = betterAuth({
  database: db,
  plugins: [
    organization(),
    paymongo({
      secretKey: process.env.PAYMONGO_SECRET_KEY!,
      publishableKey: process.env.PAYMONGO_PUB_KEY!,
      plans: myPlans,
      addons: myAddons,
    }),
  ],
});

// client.ts - Client setup
import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "./plugins/paymongo-plugin/client";

export const authClient = createAuthClient({
  plugins: [paymongoClient],
});

// components/SubscriptionFlow.tsx - React component
async function subscribe() {
  // Step 1: Create payment intent
  const { paymentIntentId, clientKey } = await authClient.paymongo.createPaymentIntent({
    amount: 2999,
  });

  // Step 2: Show PayMongo Elements form (client attaches payment method)
  // ... PayMongo Elements UI code ...

  // Step 3: Create subscription
  const result = await authClient.paymongo.createSubscription({
    paymentIntentId,
    planId: "team",
    scope: "organization",
    organizationId: currentOrgId,
    addons: [
      { addonId: "extraSeats", quantity: 5 },
      { addonId: "extraStorage", quantity: 50 },
    ],
  });

  // Step 4: Verify later (from cron job or admin action)
  await authClient.paymongo.verifySubscription({
    subscriptionId: result.subscriptionId,
    scope: "organization",
    organizationId: currentOrgId,
  });
}

// middleware.ts - Usage enforcement
async function checkLimit(limitKey: string, amount: number) {
  const { remaining } = await authClient.paymongo.checkUsage({
    scope: "organization",
    organizationId: currentOrgId,
  });

  if (remaining[limitKey] < amount) {
    throw new Error(`Insufficient ${limitKey}. Please upgrade.`);
  }

  await authClient.paymongo.incrementUsage({
    limitKey,
    amount,
    scope: "organization",
    organizationId: currentOrgId,
  });
}

// Usage in app
await checkLimit("seats", 1); // Before inviting user
await checkLimit("storage", 5); // Before uploading 5GB file
await checkLimit("apiCalls", 1); // On each API call
```


---

## PHASE 5: TESTING REQUIREMENTS

Create test files:

### File: `plugins/paymongo-plugin/__tests__/server.test.ts`

Test coverage:

1. ✅ Generic type inference works correctly
2. ✅ Invalid plan IDs are rejected at compile time
3. ✅ Scope validation (user plans for users, org plans for orgs)
4. ✅ Limit calculations with add-ons
5. ✅ Usage increment/decrement with limit checks
6. ✅ Add-on max quantity enforcement
7. ✅ Organization membership validation
8. ✅ Active subscription priority (org > user)
9. ✅ PayMongo API error handling
10. ✅ Database transaction safety

---

## PHASE 6: EXPORT \& PACKAGING

### File: `plugins/paymongo-plugin/index.ts`

```typescript
// Server exports
export { paymongo } from "./server";
export type {
  BasePlanConfig,
  BaseAddonConfig,
  PaymongoPluginConfig,
  SubscriptionData,
  PlanId,
  AddonId,
} from "./types";

// Client exports
export { paymongoClient } from "./client";
export type { PaymongoClient } from "./client";
```


### File: `plugins/paymongo-plugin/package.json`

```json
{
  "name": "@your-org/better-auth-paymongo",
  "version": "1.0.0",
  "description": "PayMongo subscription plugin for Better-Auth with user and organization support",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./server": {
      "import": "./dist/server.js",
      "types": "./dist/server.d.ts"
    },
    "./client": {
      "import": "./dist/client.js",
      "types": "./dist/client.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint ."
  },
  "peerDependencies": {
    "better-auth": "^0.x.x",
    "zod": "^3.x.x"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "keywords": [
    "better-auth",
    "paymongo",
    "philippines",
    "subscriptions",
    "payment",
    "gcash",
    "plugin"
  ]
}
```


---

## DELIVERABLES CHECKLIST

Ensure all files are created with:

- [x] Full TypeScript strict mode compliance
- [x] JSDoc comments on all public APIs
- [x] Error handling with descriptive messages
- [x] Input validation with Zod schemas
- [x] PayMongo API error handling
- [x] Database transaction safety
- [x] Type-safe generics throughout
- [x] Comprehensive README with examples
- [x] Test coverage >80%
- [x] Export barrel files (index.ts)
- [x] Package.json with proper exports
- [x] MIT License file
- [x] CHANGELOG.md

---

## ADDITIONAL REQUIREMENTS

1. **Error Messages**: Use descriptive, actionable error messages (e.g., "Plan 'enterprise' is only available for organization subscriptions")
2. **Type Safety**: Ensure TypeScript errors appear at compile time for invalid configurations
3. **Validation**: Validate all inputs with Zod before processing
4. **PayMongo Integration**: Handle all PayMongo API errors gracefully with retry logic where appropriate
5. **Database Safety**: Use transactions where multiple updates occur
6. **Documentation**: Every public function needs JSDoc with @param, @returns, @throws, @example
7. **Performance**: Minimize database queries (batch operations where possible)
8. **Security**: Never expose PayMongo secret keys to client, validate organization membership before allowing subscription changes

---

## OUTPUT FORMAT

Generate complete, production-ready code files with:

- Proper imports
- Type annotations
- Error handling
- Comments explaining complex logic
- Usage examples in comments
- Export statements

Do not use placeholders like `// ... rest of code`. Write complete implementations.

Start with types.ts, then server.ts, then client.ts, then README.md.

```
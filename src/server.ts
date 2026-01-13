import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import type { PaymongoPluginConfig, SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";

// Type extension for adapter methods that exist at runtime but not in type definitions
interface ExtendedAdapter {
    findUser(id: string): Promise<{ id: string; paymongoData?: string | null } | null>;
    updateUser(id: string, data: { paymongoData: string }): Promise<void>;
    findOrganization(id: string): Promise<{ id: string; paymongoData?: string | null } | null>;
    updateOrganization(id: string, data: { paymongoData: string }): Promise<void>;
}

// Helper to get typed adapter
const getAdapter = (ctx: { context: { adapter: unknown } }): ExtendedAdapter =>
    ctx.context.adapter as ExtendedAdapter;

// Helper for PayMongo API calls
export const paymongoFetch = async (endpoint: string, method: string, secretKey: string, body?: unknown): Promise<{ data: { id: string; attributes: Record<string, unknown> } }> => {
    const url = `https://api.paymongo.com/v1${endpoint}`;
    const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${btoa(secretKey + ':')}`
    };

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { errors?: Array<{ detail?: string }> };
        throw new Error(error.errors?.[0]?.detail || `PayMongo API Error: ${response.statusText}`);
    }

    return response.json() as Promise<{ data: { id: string; attributes: Record<string, unknown> } }>;
};

const getPaymongoData = (record: any): SubscriptionData | null => {
    if (!record.paymongoData) return null;
    try {
        return JSON.parse(record.paymongoData);
    } catch {
        return null;
    }
};

export const paymongo = <
    TPlans extends Record<string, BasePlanConfig>,
    TAddons extends Record<string, BaseAddonConfig>
>(
    config: PaymongoPluginConfig<TPlans, TAddons>
) => {
    return {
        id: "paymongo",
        schema: {
            user: {
                fields: {
                    paymongoData: {
                        type: "string",
                        required: false,
                        returned: false,
                    },
                },
            },
            organization: {
                fields: {
                    paymongoData: {
                        type: "string",
                        required: false,
                        returned: false,
                    },
                },
            },
        },
        endpoints: {
            createPaymentIntent: createAuthEndpoint("/paymongo/create-payment-intent", {
                method: "POST",
                body: z.object({
                    planId: z.string(),
                    organizationId: z.string().optional(),
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { planId, organizationId } = ctx.body;
                const plan = config.plans[planId];
                if (!plan) {
                    throw new Error("Invalid plan ID");
                }

                let amount: number;
                let currency: string;

                try {
                    const priceData = await paymongoFetch(`/prices/${plan.priceId}`, "GET", config.secretKey);
                    amount = priceData.data.attributes.unit_amount as number;
                    currency = priceData.data.attributes.currency as string;
                } catch (e) {
                    throw new Error(`Failed to fetch price details: ${e instanceof Error ? e.message : "Unknown error"}`);
                }

                const paymentIntent = await paymongoFetch("/payment_intents", "POST", config.secretKey, {
                    data: {
                        attributes: {
                            amount,
                            currency,
                            description: `Subscription to ${plan.displayName}`,
                            payment_method_allowed: ["card", "gcash", "paymaya"],
                            metadata: {
                                planId,
                                userId: ctx.context.session.user.id,
                                organizationId,
                            }
                        }
                    }
                });

                return {
                    clientKey: paymentIntent.data.attributes.client_key,
                    paymentIntentId: paymentIntent.data.id
                };
            }),

            createSubscription: createAuthEndpoint("/paymongo/create-subscription", {
                method: "POST",
                body: z.object({
                    planId: z.string(),
                    paymentIntentId: z.string().optional(),
                    organizationId: z.string().optional(),
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { planId, paymentIntentId, organizationId } = ctx.body;
                const plan = config.plans[planId];
                if (!plan) throw new Error("Invalid plan ID");

                let status: SubscriptionData['status'] = 'pending';
                let currentPeriodEnd = new Date();
                let trialEndsAt: Date | undefined;

                // Handle Trial
                if (plan.trialPeriodDays && plan.trialPeriodDays > 0 && !paymentIntentId) {
                    status = 'trialing';
                    trialEndsAt = new Date();
                    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialPeriodDays);
                    currentPeriodEnd = trialEndsAt;
                }
                // Handle Payment
                else if (paymentIntentId) {
                    const pi = await paymongoFetch(`/payment_intents/${paymentIntentId}`, "GET", config.secretKey);
                    const piStatus = pi.data.attributes.status;
                    if (piStatus === 'succeeded' || piStatus === 'processing') {
                        status = piStatus === 'succeeded' ? 'active' : 'pending';
                        const daysToAdd = plan.interval === 'year' ? 365 : 30;
                        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysToAdd);
                    } else {
                        throw new Error(`PaymentIntent status is ${piStatus}`);
                    }
                } else {
                    throw new Error("PaymentIntent required for non-trial plans");
                }

                const subData: SubscriptionData = {
                    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    status,
                    planId,
                    currentPeriodEnd,
                    cancelAtPeriodEnd: false,
                    addons: {},
                    usage: {},
                    trialEndsAt,
                    paymentIntentId
                };

                if (plan.limits) {
                    for (const key of Object.keys(plan.limits)) {
                        subData.usage[key] = 0;
                    }
                }

                const updateData = { paymongoData: JSON.stringify(subData) };

                const adapter = getAdapter(ctx);
                if (organizationId) {
                    await adapter.updateOrganization(organizationId, updateData);
                } else {
                    await adapter.updateUser(ctx.context.session.user.id, updateData);
                }

                if (config.onSubscriptionCreate) {
                    await config.onSubscriptionCreate({
                        userId: ctx.context.session.user.id,
                        orgId: organizationId,
                        subscriptionId: subData.id,
                        planId
                    });
                }

                return subData;
            }),

            verifySubscription: createAuthEndpoint("/paymongo/verify-subscription", {
                method: "GET",
                query: z.object({
                    organizationId: z.string().optional()
                }).optional(),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const organizationId = ctx.query?.organizationId;
                const adapter = getAdapter(ctx);
                let record;
                if (organizationId) {
                    record = await adapter.findOrganization(organizationId);
                } else {
                    record = await adapter.findUser(ctx.context.session.user.id);
                }

                if (!record) throw new Error("Record not found");

                const subData = getPaymongoData(record);
                if (!subData) return null;

                if ((subData.status === 'pending' || subData.status === 'unpaid') && subData.paymentIntentId) {
                    try {
                        const pi = await paymongoFetch(`/payment_intents/${subData.paymentIntentId}`, "GET", config.secretKey);
                        const piStatus = pi.data.attributes.status;

                        let newStatus: SubscriptionData['status'] = subData.status;

                        if (piStatus === 'succeeded') {
                            newStatus = 'active';
                        } else if (piStatus === 'cancelled') {
                            newStatus = 'canceled';
                        }

                        if (newStatus !== subData.status) {
                            subData.status = newStatus;
                            const updateData = { paymongoData: JSON.stringify(subData) };
                            if (organizationId) {
                                await adapter.updateOrganization(organizationId, updateData);
                            } else {
                                await adapter.updateUser(ctx.context.session.user.id, updateData);
                            }

                            if (config.onSubscriptionVerify) {
                                await config.onSubscriptionVerify({
                                    userId: ctx.context.session.user.id,
                                    orgId: organizationId,
                                    subscriptionId: subData.id,
                                    status: newStatus
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore error
                    }
                }

                return subData;
            }),

            cancelSubscription: createAuthEndpoint("/paymongo/cancel-subscription", {
                method: "POST",
                body: z.object({
                    organizationId: z.string().optional()
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { organizationId } = ctx.body;
                const userId = ctx.context.session.user.id;
                const adapter = getAdapter(ctx);

                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(userId);

                if (!record) throw new Error("Record not found");

                const subData = getPaymongoData(record);
                if (!subData) throw new Error("No subscription found");

                if (subData.status === 'canceled') return subData;

                subData.cancelAtPeriodEnd = true;

                const updateData = { paymongoData: JSON.stringify(subData) };
                if (organizationId) {
                    await adapter.updateOrganization(organizationId, updateData);
                } else {
                    await adapter.updateUser(userId, updateData);
                }

                if (config.onSubscriptionCancel) {
                    await config.onSubscriptionCancel({
                        userId,
                        orgId: organizationId,
                        subscriptionId: subData.id
                    });
                }

                return subData;
            }),

            switchPlan: createAuthEndpoint("/paymongo/switch-plan", {
                method: "POST",
                body: z.object({
                    newPlanId: z.string(),
                    organizationId: z.string().optional()
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { newPlanId, organizationId } = ctx.body;
                const userId = ctx.context.session.user.id;
                const adapter = getAdapter(ctx);

                const newPlan = config.plans[newPlanId];
                if (!newPlan) throw new Error("Invalid plan ID");

                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(userId);

                if (!record) throw new Error("Record not found");
                const subData = getPaymongoData(record);
                if (!subData) throw new Error("No subscription found");

                const oldPlanId = subData.planId;
                if (oldPlanId === newPlanId) return subData;

                subData.planId = newPlanId;
                if (newPlan.limits) {
                    for (const key of Object.keys(newPlan.limits)) {
                        if (subData.usage[key] === undefined) {
                            subData.usage[key] = 0;
                        }
                    }
                }

                const updateData = { paymongoData: JSON.stringify(subData) };
                if (organizationId) {
                    await adapter.updateOrganization(organizationId, updateData);
                } else {
                    await adapter.updateUser(userId, updateData);
                }

                if (config.onPlanSwitch) {
                    await config.onPlanSwitch({
                        userId,
                        orgId: organizationId,
                        oldPlanId,
                        newPlanId
                    });
                }

                return subData;
            }),

            addAddon: createAuthEndpoint("/paymongo/add-addon", {
                method: "POST",
                body: z.object({
                    addonId: z.string(),
                    quantity: z.number().min(1).default(1),
                    organizationId: z.string().optional()
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { addonId, quantity, organizationId } = ctx.body;
                const addon = config.addons?.[addonId];
                if (!addon) throw new Error("Invalid addon ID");
                const adapter = getAdapter(ctx);

                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(ctx.context.session.user.id);

                if (!record) throw new Error("Record not found");
                const subData = getPaymongoData(record);
                if (!subData) throw new Error("No subscription found");

                if (!subData.addons[addonId]) {
                    subData.addons[addonId] = 0;
                }
                subData.addons[addonId] += quantity;

                const updateData = { paymongoData: JSON.stringify(subData) };
                if (organizationId) {
                    await adapter.updateOrganization(organizationId, updateData);
                } else {
                    await adapter.updateUser(ctx.context.session.user.id, updateData);
                }
                return subData;
            }),

            checkUsage: createAuthEndpoint("/paymongo/check-usage", {
                method: "GET",
                query: z.object({
                    limitKey: z.string(),
                    organizationId: z.string().optional()
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { limitKey, organizationId } = ctx.query;
                const adapter = getAdapter(ctx);
                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(ctx.context.session.user.id);

                if (!record) throw new Error("Record not found");
                const subData = getPaymongoData(record);
                if (!subData) throw new Error("No subscription found");

                const plan = config.plans[subData.planId];
                if (!plan) throw new Error("Plan not found");
                const baseLimit = plan.limits[limitKey] || 0;

                let bonus = 0;
                if (config.addons) {
                    for (const [addonId, qty] of Object.entries(subData.addons)) {
                        const addon = config.addons[addonId];
                        if (addon?.limitBonuses?.[limitKey]) {
                            bonus += addon.limitBonuses[limitKey] * qty;
                        }
                    }
                }

                const totalLimit = baseLimit + bonus;
                const usage = subData.usage[limitKey] || 0;
                const remaining = Math.max(0, totalLimit - usage);

                return {
                    usage,
                    limit: totalLimit,
                    remaining,
                    allowed: usage < totalLimit
                };
            }),

            incrementUsage: createAuthEndpoint("/paymongo/increment-usage", {
                method: "POST",
                body: z.object({
                    limitKey: z.string(),
                    quantity: z.number().default(1),
                    organizationId: z.string().optional()
                }),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const { limitKey, quantity, organizationId } = ctx.body;
                const adapter = getAdapter(ctx);
                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(ctx.context.session.user.id);

                if (!record) throw new Error("Record not found");
                const subData = getPaymongoData(record);
                if (!subData) throw new Error("No subscription found");

                const plan = config.plans[subData.planId];
                if (!plan) throw new Error("Plan not found");
                const baseLimit = plan.limits[limitKey] || 0;
                let bonus = 0;
                if (config.addons) {
                    for (const [addonId, qty] of Object.entries(subData.addons)) {
                        const addon = config.addons[addonId];
                        if (addon?.limitBonuses?.[limitKey]) {
                            bonus += addon.limitBonuses[limitKey] * qty;
                        }
                    }
                }
                const totalLimit = baseLimit + bonus;
                const currentUsage = subData.usage[limitKey] || 0;
                const newUsage = Math.max(0, currentUsage + quantity);

                if (quantity > 0 && newUsage > totalLimit) {
                    throw new Error("Usage limit exceeded");
                }

                subData.usage[limitKey] = newUsage;

                const updateData = { paymongoData: JSON.stringify(subData) };
                if (organizationId) {
                    await adapter.updateOrganization(organizationId, updateData);
                } else {
                    await adapter.updateUser(ctx.context.session.user.id, updateData);
                }

                return {
                    success: true,
                    usage: subData.usage[limitKey],
                    limit: totalLimit
                };
            }),

            getActiveSubscription: createAuthEndpoint("/paymongo/get-subscription", {
                method: "GET",
                query: z.object({
                    organizationId: z.string().optional()
                }).optional(),
                use: [sessionMiddleware],
            }, async (ctx) => {
                const organizationId = ctx.query?.organizationId;
                const adapter = getAdapter(ctx);
                const record = organizationId
                    ? await adapter.findOrganization(organizationId)
                    : await adapter.findUser(ctx.context.session.user.id);

                if (!record) return null;
                return getPaymongoData(record);
            })
        }
    } satisfies BetterAuthPlugin;
};
import type { BetterAuthPlugin } from "better-auth";
import type { PaymongoAutumnConfig, AttachResponse, CheckResponse, UsageRecord } from "./types";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

export const paymongo = <
    TPlans extends Record<string, any>,
    TFeatures extends Record<string, any>
>(
    config: PaymongoAutumnConfig<TPlans, TFeatures>
) => {
    const paymongoFetch = async (path: string, options: RequestInit) => {
        const auth = Buffer.from(config.secretKey + ':').toString('base64');
        return fetch(`https://api.paymongo.com/v1${path}`, {
            ...options,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    };

    return {
        id: "paymongo",
        schema: {
            paymongoUsage: {
                fields: {
                    entityType: {
                        type: "string",
                        required: true,
                    },
                    entityId: {
                        type: "string",
                        required: true,
                    },
                    featureId: {
                        type: "string",
                        required: true,
                    },
                    balance: {
                        type: "number",
                        required: true,
                    },
                    limit: {
                        type: "number",
                        required: true,
                    },
                    periodStart: {
                        type: "date",
                        required: true,
                    },
                    periodEnd: {
                        type: "date",
                        required: true,
                    },
                    planId: {
                        type: "string",
                        required: true,
                    },
                    checkoutSessionId: {
                        type: "string",
                        required: false,
                    },
                    createdAt: {
                        type: "date",
                        required: true,
                    },
                    updatedAt: {
                        type: "date",
                        required: true,
                    },
                },
            },
            paymongoSession: {
                fields: {
                    sessionId: {
                        type: "string",
                        required: true,
                    },
                    referenceId: {
                        type: "string",
                        required: true,
                    },
                    entityType: {
                        type: "string",
                        required: true,
                    },
                    entityId: {
                        type: "string",
                        required: true,
                    },
                    planId: {
                        type: "string",
                        required: true,
                    },
                    status: {
                        type: "string",
                        required: true,
                    },
                    createdAt: {
                        type: "date",
                        required: true,
                    },
                },
            },
        },
        endpoints: {
            attach: createAuthEndpoint(
                '/paymongo/attach',
                {
                    method: 'POST',
                    use: [sessionMiddleware],
                    body: z.object({
                        planId: z.string(),
                        successUrl: z.string(),
                        cancelUrl: z.string(),
                        organizationId: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    const user = ctx.context.session.user;
                    const { planId, successUrl, cancelUrl, organizationId } = ctx.body;

                    const plan = config.plans[planId];
                    if (!plan) {
                        throw new Error(`Plan ${planId} not found`);
                    }

                    const entityType = organizationId ? 'organization' : 'user';
                    const entityId = organizationId || user.id;
                    
                    const referenceId = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                    
                    const successUrlWithRef = new URL(successUrl);
                    successUrlWithRef.searchParams.set('ref', referenceId);

                    const checkoutResponse = await paymongoFetch('/checkout_sessions', {
                        method: 'POST',
                        body: JSON.stringify({
                            data: {
                                attributes: {
                                    line_items: [
                                        {
                                            name: plan.displayName,
                                            amount: plan.amount,
                                            currency: plan.currency,
                                            quantity: 1
                                        }
                                    ],
                                    payment_method_types: ['card', 'gcash', 'grab_pay'],
                                    success_url: successUrlWithRef.toString(),
                                    cancel_url: cancelUrl,
                                    reference_number: referenceId,
                                    billing: {
                                        email: user.email
                                    }
                                }
                            }
                        })
                    });

                    if (!checkoutResponse.ok) {
                        const error = await checkoutResponse.text();
                        throw new Error(`PayMongo API error: ${error}`);
                    }

                    const checkoutData = await checkoutResponse.json();
                    const sessionId = checkoutData.data.id;
                    const checkoutUrl = checkoutData.data.attributes.checkout_url;

                    await ctx.context.adapter.create({
                        model: 'paymongoSession',
                        data: {
                            sessionId,
                            referenceId,
                            entityType,
                            entityId,
                            planId,
                            status: 'pending',
                            createdAt: new Date()
                        }
                    });

                    return ctx.json<AttachResponse>({
                        checkoutUrl,
                        sessionId
                    });
                }
            ),
            setplan: createAuthEndpoint(
                '/paymongo/set-plan',
                {
                    method: 'POST',
                    use: [sessionMiddleware],
                    body: z.object({
                        planId: z.string(),
                        organizationId: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    const user = ctx.context.session.user;
                    const { planId, organizationId } = ctx.body;

                    const plan = config.plans[planId];
                    if (!plan) {
                        throw new Error(`Plan ${planId} not found`);
                    }

                    const entityType = organizationId ? 'organization' : 'user';
                    const entityId = organizationId || user.id;

                    const existingRecords = await ctx.context.adapter.findMany({
                        model: 'paymongoUsage',
                        where: [
                            { field: 'entityType', value: entityType },
                            { field: 'entityId', value: entityId }
                        ]
                    }) as Array<{ id: string; featureId: string; balance: number; limit: number }>;

                    const usageByFeature = new Map<string, { consumed: number }>();
                    for (const record of existingRecords) {
                        const consumed = record.limit - record.balance;
                        usageByFeature.set(record.featureId, { consumed });
                        
                        await ctx.context.adapter.delete({
                            model: 'paymongoUsage',
                            where: [{ field: 'id', value: record.id }]
                        });
                    }

                    const now = new Date();
                    const periodEnd = new Date(now);
                    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'yearly' ? 12 : 1));

                    const planFeatures = plan.features;
                    
                    for (const [featureId, featureValue] of Object.entries(planFeatures)) {
                        const featureConfig = config.features[featureId];
                        
                        if (featureConfig && featureConfig.type === 'metered') {
                            const newLimit = typeof featureValue === 'number' ? featureValue : featureConfig.limit;
                            const previousUsage = usageByFeature.get(featureId);
                            const consumed = previousUsage?.consumed ?? 0;
                            const newBalance = Math.max(0, newLimit - consumed);
                            
                            await ctx.context.adapter.create({
                                model: 'paymongoUsage',
                                data: {
                                    entityType,
                                    entityId,
                                    featureId,
                                    balance: newBalance,
                                    limit: newLimit,
                                    periodStart: now,
                                    periodEnd,
                                    planId,
                                    checkoutSessionId: null,
                                    createdAt: now,
                                    updatedAt: now
                                }
                            });
                        }
                    }

                    return ctx.json({ success: true, planId });
                }
            ),
            verify: createAuthEndpoint(
                '/paymongo/verify',
                {
                    method: 'POST',
                    use: [sessionMiddleware],
                    body: z.object({
                        ref: z.string(),
                    }),
                },
                async (ctx) => {
                    const { ref } = ctx.body;

                    const pendingSession = await ctx.context.adapter.findOne({
                        model: 'paymongoSession',
                        where: [{ field: 'referenceId', value: ref }]
                    }) as { sessionId: string; referenceId: string; entityType: string; entityId: string; planId: string; status: string } | null;

                    if (!pendingSession) {
                        throw new Error(`Session not found for ref: ${ref}`);
                    }

                    if (pendingSession.status === 'completed') {
                        return ctx.json({ success: true, planId: pendingSession.planId });
                    }

                    const sessionResponse = await paymongoFetch(`/checkout_sessions/${pendingSession.sessionId}`, {
                        method: 'GET'
                    });

                    if (!sessionResponse.ok) {
                        const error = await sessionResponse.text();
                        throw new Error(`PayMongo API error: ${error}`);
                    }

                    const sessionData = await sessionResponse.json();
                    const paymentStatus = sessionData.data?.attributes?.payment_status || sessionData.data?.attributes?.payments?.[0]?.attributes?.status;

                    if (paymentStatus !== 'paid') {
                        throw new Error(`Payment not completed. Status: ${paymentStatus}`);
                    }

                    const plan = config.plans[pendingSession.planId];
                    if (!plan) {
                        throw new Error(`Plan ${pendingSession.planId} not found`);
                    }

                    const existingRecords = await ctx.context.adapter.findMany({
                        model: 'paymongoUsage',
                        where: [
                            { field: 'entityType', value: pendingSession.entityType },
                            { field: 'entityId', value: pendingSession.entityId }
                        ]
                    }) as Array<{ id: string; featureId: string; balance: number; limit: number }>;

                    const usageByFeature = new Map<string, { consumed: number }>();
                    for (const record of existingRecords) {
                        const consumed = record.limit - record.balance;
                        usageByFeature.set(record.featureId, { consumed });
                        
                        await ctx.context.adapter.delete({
                            model: 'paymongoUsage',
                            where: [{ field: 'id', value: record.id }]
                        });
                    }

                    const now = new Date();
                    const periodEnd = new Date(now);
                    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'yearly' ? 12 : 1));

                    const planFeatures = plan.features;
                    
                    for (const [featureId, featureValue] of Object.entries(planFeatures)) {
                        const featureConfig = config.features[featureId];
                        
                        if (featureConfig && featureConfig.type === 'metered') {
                            const newLimit = typeof featureValue === 'number' ? featureValue : featureConfig.limit;
                            const previousUsage = usageByFeature.get(featureId);
                            const consumed = previousUsage?.consumed ?? 0;
                            const newBalance = Math.max(0, newLimit - consumed);
                            
                            await ctx.context.adapter.create({
                                model: 'paymongoUsage',
                                data: {
                                    entityType: pendingSession.entityType,
                                    entityId: pendingSession.entityId,
                                    featureId,
                                    balance: newBalance,
                                    limit: newLimit,
                                    periodStart: now,
                                    periodEnd,
                                    planId: pendingSession.planId,
                                    checkoutSessionId: pendingSession.sessionId,
                                    createdAt: now,
                                    updatedAt: now
                                }
                            });
                        }
                    }

                    await ctx.context.adapter.update({
                        model: 'paymongoSession',
                        where: [{ field: 'referenceId', value: ref }],
                        update: { status: 'completed' }
                    });

                    return ctx.json({ success: true, planId: pendingSession.planId });
                }
            ),
            check: createAuthEndpoint(
                '/paymongo/check',
                {
                    method: 'GET',
                    use: [sessionMiddleware],
                    query: z.object({
                        feature: z.string(),
                        organizationId: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    const user = ctx.context.session.user;
                    const { feature: featureId, organizationId } = ctx.query;

                    const entityType = organizationId ? 'organization' : 'user';
                    const entityId = organizationId || user.id;

                    const usageRecord = await ctx.context.adapter.findOne({
                        model: 'paymongoUsage',
                        where: [
                            { field: 'entityType', value: entityType },
                            { field: 'entityId', value: entityId },
                            { field: 'featureId', value: featureId }
                        ]
                    }) as UsageRecord | null;

                    if (!usageRecord) {
                        return ctx.json<CheckResponse>({
                            allowed: false
                        });
                    }

                    const featureConfig = config.features[featureId];
                    const now = new Date();

                    if (usageRecord.periodEnd < now) {
                        const newPeriodEnd = new Date(now);
                        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
                        
                        await ctx.context.adapter.update({
                            model: 'paymongoUsage',
                            where: [{ field: 'id', value: usageRecord.id }],
                            update: {
                                balance: usageRecord.limit,
                                periodStart: now,
                                periodEnd: newPeriodEnd,
                                updatedAt: now
                            }
                        });

                        usageRecord.balance = usageRecord.limit;
                        usageRecord.periodStart = now;
                        usageRecord.periodEnd = newPeriodEnd;
                    }

                    if (featureConfig && featureConfig.type === 'metered') {
                        return ctx.json<CheckResponse>({
                            allowed: usageRecord.balance > 0,
                            balance: usageRecord.balance,
                            limit: usageRecord.limit,
                            planId: usageRecord.planId
                        });
                    } else {
                        return ctx.json<CheckResponse>({
                            allowed: true,
                            planId: usageRecord.planId
                        });
                    }
                }
            ),
            track: createAuthEndpoint(
                '/paymongo/track',
                {
                    method: 'POST',
                    use: [sessionMiddleware],
                    body: z.object({
                        feature: z.string(),
                        delta: z.number().optional().default(1),
                        organizationId: z.string().optional(),
                    }),
                },
                async (ctx) => {
                    const user = ctx.context.session.user;
                    const { feature, delta, organizationId } = ctx.body;

                    const entityType = organizationId ? 'organization' : 'user';
                    const entityId = organizationId || user.id;

                    const usageRecord = await ctx.context.adapter.findOne({
                        model: 'paymongoUsage',
                        where: [
                            { field: 'entityType', value: entityType },
                            { field: 'entityId', value: entityId },
                            { field: 'featureId', value: feature }
                        ]
                    }) as UsageRecord | null;

                    if (!usageRecord) {
                        throw new Error(`No usage record found for feature: ${feature}`);
                    }

                    const newBalance = Math.max(0, usageRecord.balance - delta);

                    await ctx.context.adapter.update({
                        model: 'paymongoUsage',
                        where: [{ field: 'id', value: usageRecord.id }],
                        update: { balance: newBalance, updatedAt: new Date() }
                    });

                    return ctx.json({ success: true, balance: newBalance, limit: usageRecord.limit });
                }
            )
        }
    } satisfies BetterAuthPlugin;
};
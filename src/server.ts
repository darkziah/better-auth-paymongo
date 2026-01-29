import type { BetterAuthPlugin } from "better-auth";
import type { PaymongoAutumnConfig, AttachResponse } from "./types";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";

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
        },
        endpoints: {
            attach: createAuthEndpoint(
                '/paymongo/attach',
                {
                    method: 'POST',
                    use: [sessionMiddleware]
                },
                async (ctx) => {
                    const user = ctx.context.session.user;
                    const body = ctx.body as {
                        planId: string;
                        successUrl: string;
                        cancelUrl: string;
                        organizationId?: string;
                    };

                    const { planId, successUrl, cancelUrl, organizationId } = body;

                    const plan = config.plans[planId];
                    if (!plan) {
                        throw new Error(`Plan ${planId} not found`);
                    }

                    const entityType = organizationId ? 'organization' : 'user';
                    const entityId = organizationId || user.id;

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
                                    success_url: successUrl,
                                    cancel_url: cancelUrl,
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

                    const now = new Date();
                    const periodEnd = new Date(now);
                    periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === 'yearly' ? 12 : 1));

                    const planFeatures = plan.features;
                    
                    for (const [featureId, featureValue] of Object.entries(planFeatures)) {
                        const featureConfig = config.features[featureId];
                        
                        if (featureConfig && featureConfig.type === 'metered') {
                            const limit = typeof featureValue === 'number' ? featureValue : featureConfig.limit;
                            
                            await ctx.context.adapter.create({
                                model: 'paymongoUsage',
                                data: {
                                    entityType,
                                    entityId,
                                    featureId,
                                    balance: limit,
                                    limit,
                                    periodStart: now,
                                    periodEnd,
                                    planId,
                                    checkoutSessionId: sessionId,
                                    createdAt: now,
                                    updatedAt: now
                                }
                            });
                        }
                    }

                    return ctx.json<AttachResponse>({
                        checkoutUrl,
                        sessionId
                    });
                }
            )
        }
    } satisfies BetterAuthPlugin;
};
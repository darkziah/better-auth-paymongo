import type { BetterAuthPlugin } from "better-auth";
import type { PaymongoAutumnConfig } from "./types";

export const paymongo = <
    TPlans extends Record<string, any>,
    TFeatures extends Record<string, any>
>(
    config: PaymongoAutumnConfig<TPlans, TFeatures>
) => {
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
        endpoints: {}
    } satisfies BetterAuthPlugin;
};
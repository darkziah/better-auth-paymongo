import { z } from "zod";
import type { PaymongoPluginConfig, SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";
export declare const paymongoFetch: (endpoint: string, method: string, secretKey: string, body?: unknown) => Promise<{
    data: {
        id: string;
        attributes: Record<string, unknown>;
    };
}>;
export declare const paymongo: <TPlans extends Record<string, BasePlanConfig>, TAddons extends Record<string, BaseAddonConfig>>(config: PaymongoPluginConfig<TPlans, TAddons>) => {
    id: "paymongo";
    schema: {
        user: {
            fields: {
                paymongoData: {
                    type: "string";
                    required: false;
                    returned: false;
                };
            };
        };
        organization: {
            fields: {
                paymongoData: {
                    type: "string";
                    required: false;
                    returned: false;
                };
            };
        };
    };
    endpoints: {
        createPaymentIntent: import("better-call").StrictEndpoint<"/paymongo/create-payment-intent", {
            method: "POST";
            body: z.ZodObject<{
                planId: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, {
            clientKey: unknown;
            paymentIntentId: string;
        }>;
        createSubscription: import("better-call").StrictEndpoint<"/paymongo/create-subscription", {
            method: "POST";
            body: z.ZodObject<{
                planId: z.ZodString;
                paymentIntentId: z.ZodOptional<z.ZodString>;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData>;
        verifySubscription: import("better-call").StrictEndpoint<"/paymongo/verify-subscription", {
            method: "GET";
            query: z.ZodOptional<z.ZodObject<{
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData | null>;
        cancelSubscription: import("better-call").StrictEndpoint<"/paymongo/cancel-subscription", {
            method: "POST";
            body: z.ZodObject<{
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData>;
        switchPlan: import("better-call").StrictEndpoint<"/paymongo/switch-plan", {
            method: "POST";
            body: z.ZodObject<{
                newPlanId: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData>;
        addAddon: import("better-call").StrictEndpoint<"/paymongo/add-addon", {
            method: "POST";
            body: z.ZodObject<{
                addonId: z.ZodString;
                quantity: z.ZodDefault<z.ZodNumber>;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData>;
        checkUsage: import("better-call").StrictEndpoint<"/paymongo/check-usage", {
            method: "GET";
            query: z.ZodObject<{
                limitKey: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, {
            usage: number;
            limit: number;
            remaining: number;
            allowed: boolean;
        }>;
        incrementUsage: import("better-call").StrictEndpoint<"/paymongo/increment-usage", {
            method: "POST";
            body: z.ZodObject<{
                limitKey: z.ZodString;
                quantity: z.ZodDefault<z.ZodNumber>;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, {
            success: boolean;
            usage: number;
            limit: number;
        }>;
        getActiveSubscription: import("better-call").StrictEndpoint<"/paymongo/get-subscription", {
            method: "GET";
            query: z.ZodOptional<z.ZodObject<{
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<{
                session: {
                    session: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
                        expiresAt: Date;
                        token: string;
                        ipAddress?: string | null | undefined;
                        userAgent?: string | null | undefined;
                    };
                    user: Record<string, any> & {
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        email: string;
                        emailVerified: boolean;
                        name: string;
                        image?: string | null | undefined;
                    };
                };
            }>)[];
        }, SubscriptionData | null>;
    };
};

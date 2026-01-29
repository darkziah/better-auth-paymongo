import type { PaymongoAutumnConfig, AttachResponse, CheckResponse } from "./types";
import { z } from "zod";
export declare const paymongo: <TPlans extends Record<string, any>, TFeatures extends Record<string, any>>(config: PaymongoAutumnConfig<TPlans, TFeatures>) => {
    id: "paymongo";
    schema: {
        paymongoUsage: {
            fields: {
                entityType: {
                    type: "string";
                    required: true;
                };
                entityId: {
                    type: "string";
                    required: true;
                };
                featureId: {
                    type: "string";
                    required: true;
                };
                balance: {
                    type: "number";
                    required: true;
                };
                limit: {
                    type: "number";
                    required: true;
                };
                periodStart: {
                    type: "date";
                    required: true;
                };
                periodEnd: {
                    type: "date";
                    required: true;
                };
                planId: {
                    type: "string";
                    required: true;
                };
                checkoutSessionId: {
                    type: "string";
                    required: false;
                };
                createdAt: {
                    type: "date";
                    required: true;
                };
                updatedAt: {
                    type: "date";
                    required: true;
                };
            };
        };
        paymongoSession: {
            fields: {
                sessionId: {
                    type: "string";
                    required: true;
                };
                referenceId: {
                    type: "string";
                    required: true;
                };
                entityType: {
                    type: "string";
                    required: true;
                };
                entityId: {
                    type: "string";
                    required: true;
                };
                planId: {
                    type: "string";
                    required: true;
                };
                status: {
                    type: "string";
                    required: true;
                };
                createdAt: {
                    type: "date";
                    required: true;
                };
            };
        };
    };
    endpoints: {
        attach: import("better-call").StrictEndpoint<"/paymongo/attach", {
            method: "POST";
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
            body: z.ZodObject<{
                planId: z.ZodString;
                successUrl: z.ZodString;
                cancelUrl: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, AttachResponse>;
        setplan: import("better-call").StrictEndpoint<"/paymongo/set-plan", {
            method: "POST";
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
            body: z.ZodObject<{
                planId: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, {
            success: boolean;
            planId: string;
        }>;
        verify: import("better-call").StrictEndpoint<"/paymongo/verify", {
            method: "POST";
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
            body: z.ZodObject<{
                ref: z.ZodString;
            }, z.core.$strip>;
        }, {
            success: boolean;
            planId: string;
        }>;
        check: import("better-call").StrictEndpoint<"/paymongo/check", {
            method: "GET";
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
            query: z.ZodObject<{
                feature: z.ZodString;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, CheckResponse>;
        track: import("better-call").StrictEndpoint<"/paymongo/track", {
            method: "POST";
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
            body: z.ZodObject<{
                feature: z.ZodString;
                delta: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
                organizationId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        }, {
            success: boolean;
            balance: number;
            limit: number;
        }>;
    };
};

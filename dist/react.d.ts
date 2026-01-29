/**
 * React utilities for better-auth-paymongo
 *
 * When using better-auth's React client (createAuthClient from "better-auth/react"),
 * hooks are automatically generated from the plugin's getAtoms():
 *
 * - client.useConfig() - Returns the config (plans and addons)
 * - client.useSubscription() - Returns the current subscription
 *
 * This module exports helper functions to compute limits and extract
 * useful data from the hook results.
 */
import type { SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";
import type { PaymongoConfig } from "./client";
export type { PaymongoConfig } from "./client";
export type { SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";
export interface AuthQueryResult<T> {
    data: T | null;
    error: {
        message: string;
    } | null;
    isPending: boolean;
    isRefetching: boolean;
    refetch: (queryParams?: {
        query?: Record<string, string>;
    }) => Promise<void>;
}
/**
 * Compute limits by merging base plan limits with add-on bonuses
 */
export declare function computeLimits(subscription: SubscriptionData | null, plans: Record<string, BasePlanConfig>, addons?: Record<string, BaseAddonConfig>): Record<string, number>;
/**
 * Extract the current plan from config and subscription data
 */
export declare function getCurrentPlan(config: PaymongoConfig | null, subscription: SubscriptionData | null): BasePlanConfig | null;
/**
 * Check if a subscription is active (active or trialing)
 */
export declare function isSubscriptionActive(subscription: SubscriptionData | null): boolean;
/**
 * Get trial status information
 */
export declare function getTrialStatus(subscription: SubscriptionData | null): {
    isTrialing: boolean;
    trialEndsAt: Date | null;
    daysRemaining: number;
    hasUsedTrial: boolean;
};
/**
 * Get usage information for a specific limit
 */
export declare function getUsageInfo(limitKey: string, subscription: SubscriptionData | null, config: PaymongoConfig | null, includeAddons?: boolean): {
    usage: number;
    limit: number;
    remaining: number;
    isOverLimit: boolean;
};
/**
 * Format price amount for display
 * @param amount Amount in smallest currency unit (e.g., centavos)
 * @param currency Currency code (e.g., "PHP")
 */
export declare function formatPrice(amount: number, currency: string): string;

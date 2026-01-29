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

// Re-export types for convenience
export type { PaymongoConfig } from "./client";
export type { SubscriptionData, BasePlanConfig, BaseAddonConfig } from "./types";

// =============================================================================
// Type for useConfig/useSubscription hook results (from better-auth)
// =============================================================================

export interface AuthQueryResult<T> {
  data: T | null;
  error: { message: string } | null;
  isPending: boolean;
  isRefetching: boolean;
  refetch: (queryParams?: { query?: Record<string, string> }) => Promise<void>;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Compute limits by merging base plan limits with add-on bonuses
 */
export function computeLimits(
  subscription: SubscriptionData | null,
  plans: Record<string, BasePlanConfig>,
  addons?: Record<string, BaseAddonConfig>
): Record<string, number> {
  if (!subscription) return {};

  const plan = plans[subscription.planId];
  if (!plan) return {};

  const limits = { ...plan.limits };

  if (addons && subscription.addons) {
    for (const [addonId, qty] of Object.entries(subscription.addons)) {
      const addon = addons[addonId];
      if (addon?.limitBonuses) {
        for (const [key, bonus] of Object.entries(addon.limitBonuses)) {
          limits[key] = (limits[key] || 0) + bonus * qty;
        }
      }
    }
  }

  return limits;
}

/**
 * Extract the current plan from config and subscription data
 */
export function getCurrentPlan(
  config: PaymongoConfig | null,
  subscription: SubscriptionData | null
): BasePlanConfig | null {
  if (!config || !subscription) return null;
  return config.plans[subscription.planId] ?? null;
}

/**
 * Check if a subscription is active (active or trialing)
 */
export function isSubscriptionActive(subscription: SubscriptionData | null): boolean {
  return subscription?.status === "active" || subscription?.status === "trialing";
}

/**
 * Get trial status information
 */
export function getTrialStatus(subscription: SubscriptionData | null): {
  isTrialing: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  hasUsedTrial: boolean;
} {
  const isTrialing = subscription?.status === "trialing";
  let trialEndsAt: Date | null = null;
  let daysRemaining = 0;

  if (subscription?.trialEndsAt) {
    trialEndsAt = new Date(subscription.trialEndsAt);
    const now = new Date();
    const msRemaining = trialEndsAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  }

  return {
    isTrialing,
    trialEndsAt,
    daysRemaining,
    hasUsedTrial: !!subscription?.trialUsedAt
  };
}

/**
 * Get usage information for a specific limit
 */
export function getUsageInfo(
  limitKey: string,
  subscription: SubscriptionData | null,
  config: PaymongoConfig | null,
  includeAddons: boolean = true
): {
  usage: number;
  limit: number;
  remaining: number;
  isOverLimit: boolean;
} {
  const usage = subscription?.usage?.[limitKey] ?? 0;
  let limit = 0;

  if (subscription?.planId && config?.plans[subscription.planId]) {
    const computedLimits = includeAddons
      ? computeLimits(subscription, config.plans, config.addons)
      : (config.plans[subscription.planId]?.limits ?? {});
    limit = computedLimits[limitKey] ?? 0;
  }

  const remaining = Math.max(0, limit - usage);
  const isOverLimit = usage >= limit && limit > 0;

  return { usage, limit, remaining, isOverLimit };
}

/**
 * Format price amount for display
 * @param amount Amount in smallest currency unit (e.g., centavos)
 * @param currency Currency code (e.g., "PHP")
 */
export function formatPrice(amount: number, currency: string): string {
  const majorUnits = amount / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency
  }).format(majorUnits);
}

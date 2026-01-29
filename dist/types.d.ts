/**
 * Feature configuration for the Autumn billing pattern.
 * Features can be either boolean (simple access control) or metered (usage tracking).
 */
export type FeatureConfig = {
    type: 'boolean';
} | {
    type: 'metered';
    limit: number;
};
/**
 * Plan configuration defining pricing and feature access.
 *
 * @example
 * ```typescript
 * const proPlan: PlanConfig = {
 *   amount: 99900, // 999.00 PHP in centavos
 *   currency: 'PHP',
 *   displayName: 'Pro',
 *   interval: 'monthly',
 *   features: {
 *     'projects': 10,        // metered feature with limit of 10
 *     'exportPdf': true,     // boolean feature enabled
 *   }
 * };
 * ```
 */
export interface PlanConfig {
    /** Amount in smallest currency unit (e.g., centavos for PHP). Minimum 2000 (= 20.00) */
    amount: number;
    /** Three-letter ISO currency code (e.g., "PHP", "USD") */
    currency: string;
    /** Human-readable plan name displayed to users */
    displayName: string;
    /** Billing interval */
    interval: 'monthly' | 'yearly';
    /**
     * Feature access configuration.
     * - For boolean features: `true` enables access, `false` denies
     * - For metered features: number sets the usage limit
     */
    features: Record<string, boolean | number>;
}
/**
 * Main configuration for the PayMongo Autumn plugin.
 *
 * @typeParam TPlans - Record of plan IDs to plan configurations
 * @typeParam TFeatures - Record of feature IDs to feature configurations
 *
 * @example
 * ```typescript
 * const config: PaymongoAutumnConfig<typeof plans, typeof features> = {
 *   secretKey: process.env.PAYMONGO_SECRET_KEY!,
 *   plans: {
 *     free: { amount: 0, currency: 'PHP', displayName: 'Free', interval: 'monthly', features: { projects: 3 } },
 *     pro: { amount: 99900, currency: 'PHP', displayName: 'Pro', interval: 'monthly', features: { projects: 10 } }
 *   },
 *   features: {
 *     projects: { type: 'metered', limit: 3 },
 *     exportPdf: { type: 'boolean' }
 *   },
 *   scopes: ['user', 'organization']
 * };
 * ```
 */
export interface PaymongoAutumnConfig<TPlans extends Record<string, PlanConfig>, TFeatures extends Record<string, FeatureConfig>> {
    /** PayMongo secret key for API authentication */
    secretKey: string;
    /** Available subscription plans */
    plans: TPlans;
    /** Feature definitions */
    features: TFeatures;
    /** Entity types that can have subscriptions (defaults to ['user'] if not specified) */
    scopes?: Array<'user' | 'organization'>;
}
/**
 * Response from the /attach endpoint.
 * Contains the checkout URL for the user to complete payment.
 */
export interface AttachResponse {
    /** PayMongo checkout session URL for payment */
    checkoutUrl: string;
    /** Checkout session ID for tracking */
    sessionId: string;
}
/**
 * Response from the /check endpoint.
 * Indicates whether a feature is allowed and provides usage information for metered features.
 */
export interface CheckResponse {
    /** Whether the feature access is allowed */
    allowed: boolean;
    /** Current usage balance (only for metered features) */
    balance?: number;
    /** Usage limit (only for metered features) */
    limit?: number;
    /** Active plan ID (if subscribed) */
    planId?: string;
}
/**
 * Response from the /track endpoint.
 * Confirms the usage tracking update and returns current state.
 */
export interface TrackResponse {
    /** Whether the tracking operation succeeded */
    success: boolean;
    /** Updated usage balance (for metered features) */
    balance: number;
    /** Current limit (for metered features) */
    limit: number;
}
/**
 * Database row type for the usage tracking table.
 * Stores feature usage and subscription state per entity.
 */
export interface UsageRecord {
    /** Unique record identifier */
    id: string;
    /** Type of entity ('user' or 'organization') */
    entityType: 'user' | 'organization';
    /** Entity identifier (userId or organizationId) */
    entityId: string;
    /** Feature identifier being tracked */
    featureId: string;
    /** Current usage balance (for metered features) */
    balance: number;
    /** Maximum allowed usage (for metered features) */
    limit: number;
    /** Start of the current billing period */
    periodStart: Date;
    /** End of the current billing period */
    periodEnd: Date;
    /** Active plan ID */
    planId: string;
    /** PayMongo checkout session ID */
    checkoutSessionId: string;
    /** Record creation timestamp */
    createdAt: Date;
    /** Record last update timestamp */
    updatedAt: Date;
}

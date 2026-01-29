import type { PaymongoAutumnConfig, UsageRecord } from './types';

/**
 * Configuration for seat-based billing in organizations.
 */
export interface SeatConfig {
  /** Feature ID to use for seat tracking. Defaults to 'seats' */
  featureId?: string;
  /** Default seat limit when no subscription exists. Defaults to 5 */
  defaultLimit?: number;
}

/**
 * Creates organization plugin configuration with seat-based billing integration.
 * 
 * @param config - The PayMongo Autumn configuration
 * @param seatConfig - Optional seat configuration overrides
 * @returns Configuration object spreadable into Better-Auth's organization plugin
 * 
 * @example
 * ```typescript
 * import { betterAuth } from "better-auth";
 * import { organization } from "better-auth/plugins";
 * import { paymongo, createPaymongoOrganization } from "better-auth-paymongo";
 * 
 * const paymongoConfig = {
 *   secretKey: process.env.PAYMONGO_SECRET_KEY!,
 *   features: {
 *     seats: { type: "metered", limit: 5 },
 *   },
 *   plans: {
 *     pro: {
 *       features: { seats: 25 },
 *     },
 *   },
 * };
 * 
 * export const auth = betterAuth({
 *   plugins: [
 *     paymongo(paymongoConfig),
 *     organization({
 *       ...createPaymongoOrganization(paymongoConfig),
 *     }),
 *   ],
 * });
 * ```
 */
export function createPaymongoOrganization<
  TPlans extends Record<string, any>,
  TFeatures extends Record<string, any>
>(
  config: PaymongoAutumnConfig<TPlans, TFeatures>,
  seatConfig?: SeatConfig
) {
  const featureId = seatConfig?.featureId ?? 'seats';
  const defaultLimit = seatConfig?.defaultLimit ?? 5;

  return {
    membershipLimit: async ({
      organizationId,
      adapter,
    }: {
      organizationId: string;
      adapter: any;
    }): Promise<number> => {
      const usageRecord = await adapter.findOne({
        model: 'paymongoUsage',
        where: [
          { field: 'entityType', value: 'organization' },
          { field: 'entityId', value: organizationId },
          { field: 'featureId', value: featureId },
        ],
      }) as UsageRecord | null;

      if (!usageRecord) {
        return defaultLimit;
      }

      return usageRecord.limit;
    },
  };
}

/**
 * Creates a dynamic seat limit function for Better-Auth's organization plugin.
 * 
 * @param adapter - Better-Auth adapter instance
 * @param options - Optional configuration for seat tracking
 * @returns Async function compatible with Better-Auth's membershipLimit option
 * 
 * @example
 * ```typescript
 * import { createSeatLimit } from "better-auth-paymongo";
 * 
 * organization({
 *   membershipLimit: createSeatLimit(adapter, {
 *     featureId: 'team_seats',
 *     defaultLimit: 10,
 *   }),
 * })
 * ```
 */
export function createSeatLimit(
  adapter: any,
  options?: SeatConfig
): (params: { organizationId: string; adapter: any }) => Promise<number> {
  const featureId = options?.featureId ?? 'seats';
  const defaultLimit = options?.defaultLimit ?? 5;

  return async ({ organizationId }: { organizationId: string; adapter: any }): Promise<number> => {
    const usageRecord = await adapter.findOne({
      model: 'paymongoUsage',
      where: [
        { field: 'entityType', value: 'organization' },
        { field: 'entityId', value: organizationId },
        { field: 'featureId', value: featureId },
      ],
    }) as UsageRecord | null;

    if (!usageRecord) {
      return defaultLimit;
    }

    return usageRecord.limit;
  };
}

/**
 * Retrieves seat usage information for an organization.
 * 
 * @param adapter - Better-Auth adapter instance
 * @param orgId - Organization ID
 * @param featureId - Feature ID to check (defaults to 'seats')
 * @returns Object with used, limit, and remaining seat counts
 * 
 * @example
 * ```typescript
 * import { getOrganizationSeats } from "better-auth-paymongo";
 * 
 * const seats = await getOrganizationSeats(adapter, "org_123");
 * console.log(`${seats.used} / ${seats.limit} seats used`);
 * console.log(`${seats.remaining} seats remaining`);
 * ```
 */
export async function getOrganizationSeats(
  adapter: any,
  orgId: string,
  featureId: string = 'seats'
): Promise<{ used: number; limit: number; remaining: number }> {
  const usageRecord = await adapter.findOne({
    model: 'paymongoUsage',
    where: [
      { field: 'entityType', value: 'organization' },
      { field: 'entityId', value: orgId },
      { field: 'featureId', value: featureId },
    ],
  }) as UsageRecord | null;

  if (!usageRecord) {
    return {
      used: 0,
      limit: 5,
      remaining: 5,
    };
  }

  const used = usageRecord.limit - usageRecord.balance;
  const remaining = usageRecord.balance;

  return {
    used,
    limit: usageRecord.limit,
    remaining,
  };
}

import type { BetterAuthClientPlugin } from "better-auth/client";
import type { BetterFetchOption, BetterFetch } from "@better-fetch/fetch";
import { atom } from "nanostores";
import type { paymongo } from "./server";
import type { AttachResponse, CheckResponse, TrackResponse } from "./types";

export const paymongoClient = () => {
	const $subscriptionSignal = atom<boolean>(false);

	return {
		id: "paymongo",
		$InferServerPlugin: {} as ReturnType<typeof paymongo>,

		getAtoms: ($fetch: BetterFetch) => ({
			$subscriptionSignal,
		}),

		getActions: ($fetch: <T>(url: string, options?: BetterFetchOption) => Promise<{ data: T | null; error: { message: string } | null }>) => ({
			/**
			 * Attach a subscription plan to the user or organization.
			 * Creates a PayMongo checkout session and returns the URL for payment.
			 * 
			 * @param planId - The plan ID to subscribe to
			 * @param options - Checkout configuration
			 * @param options.successUrl - URL to redirect after successful payment
			 * @param options.cancelUrl - URL to redirect if payment is cancelled
			 * @param options.organizationId - Optional organization ID (defaults to current user)
			 * @returns Checkout URL and session ID
			 */
			attach: async (planId: string, options: { successUrl: string; cancelUrl: string; organizationId?: string }) => {
				const result = await $fetch<AttachResponse>('/paymongo/attach', {
					method: 'POST',
					body: { planId, ...options }
				});
				if (result.data) {
					$subscriptionSignal.set(!$subscriptionSignal.get());
				}
				return result;
			},

			/**
			 * Check if a feature is allowed for the current user or organization.
			 * For metered features, also returns usage balance and limit.
			 * 
			 * @param featureId - The feature ID to check
			 * @param options - Optional configuration
			 * @param options.organizationId - Optional organization ID (defaults to current user)
			 * @returns Feature access status and usage info
			 */
			check: async (featureId: string, options?: { organizationId?: string }) => {
				const params = new URLSearchParams({ feature: featureId });
				if (options?.organizationId) params.set('organizationId', options.organizationId);
				return $fetch<CheckResponse>(`/paymongo/check?${params}`, { method: 'GET' });
			},

			/**
			 * Track usage for a metered feature.
			 * Increments (or decrements with negative delta) the usage balance.
			 * 
			 * @param featureId - The feature ID to track
			 * @param options - Optional configuration
			 * @param options.delta - Amount to increment (default: 1, use negative to decrement)
			 * @param options.organizationId - Optional organization ID (defaults to current user)
			 * @returns Updated usage balance and limit
			 */
			track: async (featureId: string, options?: { delta?: number; organizationId?: string }) => {
				const result = await $fetch<TrackResponse>('/paymongo/track', {
					method: 'POST',
					body: { feature: featureId, delta: options?.delta, organizationId: options?.organizationId }
				});
				if (result.data) {
					$subscriptionSignal.set(!$subscriptionSignal.get());
				}
				return result;
			}
		}),

		pathMethods: {
			"/paymongo/check": "GET"
		},

		atomListeners: [
			{
				matcher: (path: string) => path.startsWith("/paymongo/"),
				signal: "$subscriptionSignal"
			}
		]
	} satisfies BetterAuthClientPlugin;
};

/**
 * Atom to trigger re-fetches across hooks
 */
export declare const $refreshTrigger: import("nanostores").PreinitializedWritableAtom<number> & object;
/**
 * Hook to check feature permissions
 */
export declare function useCheck(featureId: string, options?: {
    organizationId?: string;
}): {
    allowed: boolean;
    balance: number | undefined;
    limit: number | undefined;
    planId: string | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
};
/**
 * Hook to get current subscription state
 */
export declare function useSubscription(): {
    planId: string | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
};
/**
 * Trigger global refresh for all hooks
 */
export declare function refreshBilling(): void;

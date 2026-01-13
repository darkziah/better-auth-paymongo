export interface BasePlanConfig {
    priceId: string;
    displayName: string;
    limits: Record<string, number>;
    trialPeriodDays?: number;
    interval?: "month" | "year";
}
export interface BaseAddonConfig {
    priceId: string;
    displayName: string;
    type: "quantity" | "flat";
    limitBonuses?: Record<string, number>;
}
export interface SubscriptionData {
    id: string;
    status: "active" | "canceled" | "past_due" | "pending" | "trialing" | "unpaid";
    planId: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    addons: Record<string, number>;
    usage: Record<string, number>;
    trialEndsAt?: Date | null;
    paymentIntentId?: string;
}
export interface PaymongoPluginConfig<TPlans extends Record<string, BasePlanConfig>, TAddons extends Record<string, BaseAddonConfig>> {
    secretKey: string;
    plans: TPlans;
    addons?: TAddons;
    onSubscriptionCreate?: (data: {
        userId: string;
        orgId?: string;
        subscriptionId: string;
        planId: keyof TPlans;
    }) => Promise<void> | void;
    onSubscriptionVerify?: (data: {
        userId: string;
        orgId?: string;
        subscriptionId: string;
        status: SubscriptionData['status'];
    }) => Promise<void> | void;
    onPlanSwitch?: (data: {
        userId: string;
        orgId?: string;
        oldPlanId: string;
        newPlanId: string;
    }) => Promise<void> | void;
    onSubscriptionCancel?: (data: {
        userId: string;
        orgId?: string;
        subscriptionId: string;
    }) => Promise<void> | void;
}

// src/react.ts
function computeLimits(subscription, plans, addons) {
  if (!subscription)
    return {};
  const plan = plans[subscription.planId];
  if (!plan)
    return {};
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
function getCurrentPlan(config, subscription) {
  if (!config || !subscription)
    return null;
  return config.plans[subscription.planId] ?? null;
}
function isSubscriptionActive(subscription) {
  return subscription?.status === "active" || subscription?.status === "trialing";
}
function getTrialStatus(subscription) {
  const isTrialing = subscription?.status === "trialing";
  let trialEndsAt = null;
  let daysRemaining = 0;
  if (subscription?.trialEndsAt) {
    trialEndsAt = new Date(subscription.trialEndsAt);
    const now = new Date;
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
function getUsageInfo(limitKey, subscription, config, includeAddons = true) {
  const usage = subscription?.usage?.[limitKey] ?? 0;
  let limit = 0;
  if (subscription?.planId && config?.plans[subscription.planId]) {
    const computedLimits = includeAddons ? computeLimits(subscription, config.plans, config.addons) : config.plans[subscription.planId]?.limits ?? {};
    limit = computedLimits[limitKey] ?? 0;
  }
  const remaining = Math.max(0, limit - usage);
  const isOverLimit = usage >= limit && limit > 0;
  return { usage, limit, remaining, isOverLimit };
}
function formatPrice(amount, currency) {
  const majorUnits = amount / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency
  }).format(majorUnits);
}
export {
  isSubscriptionActive,
  getUsageInfo,
  getTrialStatus,
  getCurrentPlan,
  formatPrice,
  computeLimits
};

//# debugId=3B24400A1869146664756E2164756E21

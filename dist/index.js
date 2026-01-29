// src/server.ts
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";

// src/cache.ts
var store = new Map;
var cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry)
      return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key, value, ttlSeconds = 60) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  },
  delete(key) {
    store.delete(key);
  }
};

// src/server.ts
var paymongo = (config) => {
  const paymongoFetch = async (path, options) => {
    const auth = Buffer.from(config.secretKey + ":").toString("base64");
    return fetch(`https://api.paymongo.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });
  };
  return {
    id: "paymongo",
    schema: {
      paymongoUsage: {
        fields: {
          entityType: {
            type: "string",
            required: true
          },
          entityId: {
            type: "string",
            required: true
          },
          featureId: {
            type: "string",
            required: true
          },
          balance: {
            type: "number",
            required: true
          },
          limit: {
            type: "number",
            required: true
          },
          periodStart: {
            type: "date",
            required: true
          },
          periodEnd: {
            type: "date",
            required: true
          },
          planId: {
            type: "string",
            required: true
          },
          checkoutSessionId: {
            type: "string",
            required: false
          },
          createdAt: {
            type: "date",
            required: true
          },
          updatedAt: {
            type: "date",
            required: true
          }
        }
      }
    },
    endpoints: {
      attach: createAuthEndpoint("/paymongo/attach", {
        method: "POST",
        use: [sessionMiddleware]
      }, async (ctx) => {
        const user = ctx.context.session.user;
        const body = ctx.body;
        const { planId, successUrl, cancelUrl, organizationId } = body;
        const plan = config.plans[planId];
        if (!plan) {
          throw new Error(`Plan ${planId} not found`);
        }
        const entityType = organizationId ? "organization" : "user";
        const entityId = organizationId || user.id;
        const checkoutResponse = await paymongoFetch("/checkout_sessions", {
          method: "POST",
          body: JSON.stringify({
            data: {
              attributes: {
                line_items: [
                  {
                    name: plan.displayName,
                    amount: plan.amount,
                    currency: plan.currency,
                    quantity: 1
                  }
                ],
                payment_method_types: ["card", "gcash", "grab_pay"],
                success_url: successUrl,
                cancel_url: cancelUrl,
                billing: {
                  email: user.email
                }
              }
            }
          })
        });
        if (!checkoutResponse.ok) {
          const error = await checkoutResponse.text();
          throw new Error(`PayMongo API error: ${error}`);
        }
        const checkoutData = await checkoutResponse.json();
        const sessionId = checkoutData.data.id;
        const checkoutUrl = checkoutData.data.attributes.checkout_url;
        const now = new Date;
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + (plan.interval === "yearly" ? 12 : 1));
        const planFeatures = plan.features;
        for (const [featureId, featureValue] of Object.entries(planFeatures)) {
          const featureConfig = config.features[featureId];
          if (featureConfig && featureConfig.type === "metered") {
            const limit = typeof featureValue === "number" ? featureValue : featureConfig.limit;
            await ctx.context.adapter.create({
              model: "paymongoUsage",
              data: {
                entityType,
                entityId,
                featureId,
                balance: limit,
                limit,
                periodStart: now,
                periodEnd,
                planId,
                checkoutSessionId: sessionId,
                createdAt: now,
                updatedAt: now
              }
            });
          }
        }
        return ctx.json({
          checkoutUrl,
          sessionId
        });
      }),
      check: createAuthEndpoint("/paymongo/check", {
        method: "GET",
        use: [sessionMiddleware]
      }, async (ctx) => {
        const user = ctx.context.session.user;
        const query = ctx.query;
        const { feature: featureId, organizationId } = query;
        if (!featureId) {
          throw new Error("Missing required query param: feature");
        }
        const entityType = organizationId ? "organization" : "user";
        const entityId = organizationId || user.id;
        const usageRecord = await ctx.context.adapter.findOne({
          model: "paymongoUsage",
          where: [
            { field: "entityType", value: entityType },
            { field: "entityId", value: entityId },
            { field: "featureId", value: featureId }
          ]
        });
        if (!usageRecord) {
          return ctx.json({
            allowed: false
          });
        }
        const cacheKey = `paymongo:${entityType}:${entityId}:session`;
        let sessionStatus = cache.get(cacheKey);
        if (!sessionStatus && usageRecord.checkoutSessionId) {
          const response = await paymongoFetch(`/checkout_sessions/${usageRecord.checkoutSessionId}`, {
            method: "GET"
          });
          if (response.ok) {
            const data = await response.json();
            sessionStatus = data.data.attributes.payment_intent?.attributes?.status || "pending";
            cache.set(cacheKey, sessionStatus, 60);
          }
        }
        if (sessionStatus && sessionStatus !== "succeeded") {
          return ctx.json({
            allowed: false,
            planId: usageRecord.planId
          });
        }
        const featureConfig = config.features[featureId];
        const now = new Date;
        if (usageRecord.periodEnd < now) {
          const newPeriodEnd = new Date(now);
          newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
          await ctx.context.adapter.update({
            model: "paymongoUsage",
            where: [{ field: "id", value: usageRecord.id }],
            update: {
              balance: usageRecord.limit,
              periodStart: now,
              periodEnd: newPeriodEnd,
              updatedAt: now
            }
          });
          usageRecord.balance = usageRecord.limit;
          usageRecord.periodStart = now;
          usageRecord.periodEnd = newPeriodEnd;
        }
        if (featureConfig && featureConfig.type === "metered") {
          return ctx.json({
            allowed: usageRecord.balance > 0,
            balance: usageRecord.balance,
            limit: usageRecord.limit,
            planId: usageRecord.planId
          });
        } else {
          return ctx.json({
            allowed: true,
            planId: usageRecord.planId
          });
        }
      }),
      track: createAuthEndpoint("/paymongo/track", {
        method: "POST",
        use: [sessionMiddleware]
      }, async (ctx) => {
        const user = ctx.context.session.user;
        const { feature, delta = 1, organizationId } = ctx.body;
        const entityType = organizationId ? "organization" : "user";
        const entityId = organizationId || user.id;
        const usageRecord = await ctx.context.adapter.findOne({
          model: "paymongoUsage",
          where: [
            { field: "entityType", value: entityType },
            { field: "entityId", value: entityId },
            { field: "featureId", value: feature }
          ]
        });
        if (!usageRecord) {
          throw new Error(`No usage record found for feature: ${feature}`);
        }
        const newBalance = Math.max(0, usageRecord.balance - delta);
        await ctx.context.adapter.update({
          model: "paymongoUsage",
          where: [{ field: "id", value: usageRecord.id }],
          update: { balance: newBalance, updatedAt: new Date }
        });
        return ctx.json({ success: true, balance: newBalance, limit: usageRecord.limit });
      })
    }
  };
};
// node_modules/nanostores/clean-stores/index.js
var clean = Symbol("clean");

// node_modules/nanostores/atom/index.js
var listenerQueue = [];
var lqIndex = 0;
var QUEUE_ITEMS_PER_LISTENER = 4;
var epoch = 0;
var atom = (initialValue) => {
  let listeners = [];
  let $atom = {
    get() {
      if (!$atom.lc) {
        $atom.listen(() => {})();
      }
      return $atom.value;
    },
    lc: 0,
    listen(listener) {
      $atom.lc = listeners.push(listener);
      return () => {
        for (let i = lqIndex + QUEUE_ITEMS_PER_LISTENER;i < listenerQueue.length; ) {
          if (listenerQueue[i] === listener) {
            listenerQueue.splice(i, QUEUE_ITEMS_PER_LISTENER);
          } else {
            i += QUEUE_ITEMS_PER_LISTENER;
          }
        }
        let index = listeners.indexOf(listener);
        if (~index) {
          listeners.splice(index, 1);
          if (!--$atom.lc)
            $atom.off();
        }
      };
    },
    notify(oldValue, changedKey) {
      epoch++;
      let runListenerQueue = !listenerQueue.length;
      for (let listener of listeners) {
        listenerQueue.push(listener, $atom.value, oldValue, changedKey);
      }
      if (runListenerQueue) {
        for (lqIndex = 0;lqIndex < listenerQueue.length; lqIndex += QUEUE_ITEMS_PER_LISTENER) {
          listenerQueue[lqIndex](listenerQueue[lqIndex + 1], listenerQueue[lqIndex + 2], listenerQueue[lqIndex + 3]);
        }
        listenerQueue.length = 0;
      }
    },
    off() {},
    set(newValue) {
      let oldValue = $atom.value;
      if (oldValue !== newValue) {
        $atom.value = newValue;
        $atom.notify(oldValue);
      }
    },
    subscribe(listener) {
      let unbind = $atom.listen(listener);
      listener($atom.value);
      return unbind;
    },
    value: initialValue
  };
  if (true) {
    $atom[clean] = () => {
      listeners = [];
      $atom.lc = 0;
      $atom.off();
    };
  }
  return $atom;
};
// src/client.ts
import { useAuthQuery } from "better-auth/client";
var paymongoClient = () => {
  const $configSignal = atom(false);
  const $subscriptionSignal = atom(false);
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getAtoms: ($fetch) => {
      const config = useAuthQuery($configSignal, "/paymongo/config", $fetch, { method: "GET" });
      const subscription = useAuthQuery($subscriptionSignal, "/paymongo/get-subscription", $fetch, { method: "GET" });
      return {
        $configSignal,
        $subscriptionSignal,
        config,
        subscription
      };
    },
    getActions: ($fetch) => ({
      createPaymentIntent: async (options, fetchOptions) => {
        return $fetch(`/paymongo/create-payment-intent`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      createSubscription: async (options, fetchOptions) => {
        return $fetch(`/paymongo/create-subscription`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      verifySubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        return $fetch(`/paymongo/verify-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      cancelSubscription: async (options, fetchOptions) => {
        return $fetch(`/paymongo/cancel-subscription`, {
          method: "POST",
          body: options ?? {},
          ...fetchOptions
        });
      },
      getPlan: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        const res = await $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
        return {
          data: res.data?.planId ?? null,
          error: res.error
        };
      },
      getSubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        return $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      hasActiveSubscription: async (options, fetchOptions) => {
        const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
        const res = await $fetch(`/paymongo/get-subscription${query}`, {
          method: "GET",
          ...fetchOptions
        });
        const isActive = res.data?.status === "active" || res.data?.status === "trialing";
        return {
          data: isActive,
          error: res.error
        };
      },
      convertTrial: async (options, fetchOptions) => {
        return $fetch(`/paymongo/convert-trial`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      updatePayment: async (options, fetchOptions) => {
        return $fetch(`/paymongo/update-payment`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      switchPlan: async (options, fetchOptions) => {
        return $fetch(`/paymongo/switch-plan`, {
          method: "POST",
          body: options,
          ...fetchOptions
        });
      },
      addAddon: async (options, fetchOptions) => {
        return $fetch(`/paymongo/add-addon`, {
          method: "POST",
          body: { quantity: 1, ...options },
          ...fetchOptions
        });
      },
      checkUsage: async (options, fetchOptions) => {
        const params = new URLSearchParams({ limitKey: options.limitKey });
        if (options.organizationId)
          params.set("organizationId", options.organizationId);
        return $fetch(`/paymongo/check-usage?${params}`, {
          method: "GET",
          ...fetchOptions
        });
      },
      incrementUsage: async (options, fetchOptions) => {
        return $fetch(`/paymongo/increment-usage`, {
          method: "POST",
          body: { quantity: 1, ...options },
          ...fetchOptions
        });
      }
    }),
    pathMethods: {
      "/paymongo/config": "GET",
      "/paymongo/get-subscription": "GET",
      "/paymongo/verify-subscription": "GET",
      "/paymongo/check-usage": "GET"
    },
    atomListeners: [
      {
        matcher(path) {
          return path === "/paymongo/config";
        },
        signal: "$configSignal"
      },
      {
        matcher(path) {
          return path.startsWith("/paymongo/") && (path.includes("subscription") || path.includes("switch-plan") || path.includes("convert-trial") || path.includes("cancel") || path.includes("add-addon"));
        },
        signal: "$subscriptionSignal"
      }
    ]
  };
};
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
  paymongoClient,
  paymongo,
  isSubscriptionActive,
  getUsageInfo,
  getTrialStatus,
  getCurrentPlan,
  formatPrice,
  computeLimits
};

//# debugId=7F9FCAD8A4199A6864756E2164756E21

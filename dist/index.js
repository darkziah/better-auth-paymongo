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
// node_modules/nanostores/listen-keys/index.js
function listenKeys($store, keys, listener) {
  let keysSet = new Set(keys).add(undefined);
  return $store.listen((value, oldValue, changed) => {
    if (keysSet.has(changed)) {
      listener(value, oldValue, changed);
    }
  });
}
// src/client.ts
var subscriptionAtom = atom(null);
var subscriptionLoadingAtom = atom(false);
var subscriptionErrorAtom = atom(null);
var paymongoClient = () => {
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getAtoms: () => {
      return {
        $subscription: subscriptionAtom,
        $subscriptionLoading: subscriptionLoadingAtom,
        $subscriptionError: subscriptionErrorAtom
      };
    },
    getActions: ($fetch) => ({
      fetchSubscription: async (options) => {
        subscriptionLoadingAtom.set(true);
        subscriptionErrorAtom.set(null);
        try {
          const query = options?.organizationId ? `?organizationId=${options.organizationId}` : "";
          const result = await $fetch(`/paymongo/get-subscription${query}`, {
            method: "GET"
          });
          if (result.error) {
            subscriptionErrorAtom.set(new Error(result.error.message));
            return { data: null, error: result.error };
          } else {
            subscriptionAtom.set(result.data);
            return { data: result.data, error: null };
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error("Failed to fetch subscription");
          subscriptionErrorAtom.set(error);
          return { data: null, error: { message: error.message } };
        } finally {
          subscriptionLoadingAtom.set(false);
        }
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
      }
    })
  };
};

// node_modules/@nanostores/react/index.js
import { useCallback, useRef, useSyncExternalStore } from "react";
var emit = (snapshotRef, onChange) => (value) => {
  if (snapshotRef.current === value)
    return;
  snapshotRef.current = value;
  onChange();
};
function useStore(store, { keys, deps = [store, keys] } = {}) {
  let snapshotRef = useRef();
  snapshotRef.current = store.get();
  let subscribe = useCallback((onChange) => {
    emit(snapshotRef, onChange)(store.value);
    return keys?.length > 0 ? listenKeys(store, keys, emit(snapshotRef, onChange)) : store.listen(emit(snapshotRef, onChange));
  }, deps);
  let get = () => snapshotRef.current;
  return useSyncExternalStore(subscribe, get, get);
}

// src/react.ts
function useSubscription() {
  const subscription = useStore(subscriptionAtom);
  const isLoading = useStore(subscriptionLoadingAtom);
  const error = useStore(subscriptionErrorAtom);
  const isActive = subscription?.status === "active";
  const isTrialing = subscription?.status === "trialing";
  return {
    subscription,
    planId: subscription?.planId ?? null,
    status: subscription?.status ?? null,
    isActive,
    isTrialing,
    isSubscribed: isActive || isTrialing,
    isLoading,
    error
  };
}
function usePlan() {
  const { planId, isActive, isTrialing, isLoading, error } = useSubscription();
  return { planId, isActive, isTrialing, isLoading, error };
}
function useIsSubscribed() {
  const { isSubscribed, isActive, isTrialing, isLoading, error } = useSubscription();
  return { isSubscribed, isActive, isTrialing, isLoading, error };
}
function useUsage(limitKey) {
  const { subscription, isLoading, error } = useSubscription();
  const usage = subscription?.usage?.[limitKey] ?? 0;
  return {
    usage,
    planId: subscription?.planId ?? null,
    isLoading,
    error
  };
}
// src/server.ts
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
var getAdapter = (ctx) => ctx.context.adapter;
var paymongoFetch = async (endpoint, method, secretKey, body) => {
  const url = `https://api.paymongo.com/v1${endpoint}`;
  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Basic ${btoa(secretKey + ":")}`
  };
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.detail || `PayMongo API Error: ${response.statusText}`);
  }
  return response.json();
};
var getPaymongoData = (record) => {
  if (!record.paymongoData)
    return null;
  try {
    return JSON.parse(record.paymongoData);
  } catch {
    return null;
  }
};
var paymongo = (config) => {
  return {
    id: "paymongo",
    schema: {
      user: {
        fields: {
          paymongoData: {
            type: "string",
            required: false,
            returned: false
          }
        }
      },
      organization: {
        fields: {
          paymongoData: {
            type: "string",
            required: false,
            returned: false
          }
        }
      }
    },
    endpoints: {
      createPaymentIntent: createAuthEndpoint("/paymongo/create-payment-intent", {
        method: "POST",
        body: z.object({
          planId: z.string(),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { planId, organizationId } = ctx.body;
        const plan = config.plans[planId];
        if (!plan) {
          throw new Error("Invalid plan ID");
        }
        let amount;
        let currency;
        try {
          const priceData = await paymongoFetch(`/prices/${plan.priceId}`, "GET", config.secretKey);
          amount = priceData.data.attributes.unit_amount;
          currency = priceData.data.attributes.currency;
        } catch (e) {
          throw new Error(`Failed to fetch price details: ${e instanceof Error ? e.message : "Unknown error"}`);
        }
        const paymentIntent = await paymongoFetch("/payment_intents", "POST", config.secretKey, {
          data: {
            attributes: {
              amount,
              currency,
              description: `Subscription to ${plan.displayName}`,
              payment_method_allowed: ["card", "gcash", "paymaya"],
              metadata: {
                planId,
                userId: ctx.context.session.user.id,
                organizationId
              }
            }
          }
        });
        return {
          clientKey: paymentIntent.data.attributes.client_key,
          paymentIntentId: paymentIntent.data.id
        };
      }),
      createSubscription: createAuthEndpoint("/paymongo/create-subscription", {
        method: "POST",
        body: z.object({
          planId: z.string(),
          paymentIntentId: z.string().optional(),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { planId, paymentIntentId, organizationId } = ctx.body;
        const plan = config.plans[planId];
        if (!plan)
          throw new Error("Invalid plan ID");
        let status = "pending";
        let currentPeriodEnd = new Date;
        let trialEndsAt;
        if (plan.trialPeriodDays && plan.trialPeriodDays > 0 && !paymentIntentId) {
          status = "trialing";
          trialEndsAt = new Date;
          trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialPeriodDays);
          currentPeriodEnd = trialEndsAt;
        } else if (paymentIntentId) {
          const pi = await paymongoFetch(`/payment_intents/${paymentIntentId}`, "GET", config.secretKey);
          const piStatus = pi.data.attributes.status;
          if (piStatus === "succeeded" || piStatus === "processing") {
            status = piStatus === "succeeded" ? "active" : "pending";
            const daysToAdd = plan.interval === "year" ? 365 : 30;
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + daysToAdd);
          } else {
            throw new Error(`PaymentIntent status is ${piStatus}`);
          }
        } else {
          throw new Error("PaymentIntent required for non-trial plans");
        }
        const subData = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status,
          planId,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          addons: {},
          usage: {},
          trialEndsAt,
          paymentIntentId
        };
        if (plan.limits) {
          for (const key of Object.keys(plan.limits)) {
            subData.usage[key] = 0;
          }
        }
        const updateData = { paymongoData: JSON.stringify(subData) };
        const adapter = getAdapter(ctx);
        if (organizationId) {
          await adapter.updateOrganization(organizationId, updateData);
        } else {
          await adapter.updateUser(ctx.context.session.user.id, updateData);
        }
        if (config.onSubscriptionCreate) {
          await config.onSubscriptionCreate({
            userId: ctx.context.session.user.id,
            orgId: organizationId,
            subscriptionId: subData.id,
            planId
          });
        }
        return subData;
      }),
      verifySubscription: createAuthEndpoint("/paymongo/verify-subscription", {
        method: "GET",
        query: z.object({
          organizationId: z.string().optional()
        }).optional(),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const organizationId = ctx.query?.organizationId;
        const adapter = getAdapter(ctx);
        let record;
        if (organizationId) {
          record = await adapter.findOrganization(organizationId);
        } else {
          record = await adapter.findUser(ctx.context.session.user.id);
        }
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          return null;
        if ((subData.status === "pending" || subData.status === "unpaid") && subData.paymentIntentId) {
          try {
            const pi = await paymongoFetch(`/payment_intents/${subData.paymentIntentId}`, "GET", config.secretKey);
            const piStatus = pi.data.attributes.status;
            let newStatus = subData.status;
            if (piStatus === "succeeded") {
              newStatus = "active";
            } else if (piStatus === "cancelled") {
              newStatus = "canceled";
            }
            if (newStatus !== subData.status) {
              subData.status = newStatus;
              const updateData = { paymongoData: JSON.stringify(subData) };
              if (organizationId) {
                await adapter.updateOrganization(organizationId, updateData);
              } else {
                await adapter.updateUser(ctx.context.session.user.id, updateData);
              }
              if (config.onSubscriptionVerify) {
                await config.onSubscriptionVerify({
                  userId: ctx.context.session.user.id,
                  orgId: organizationId,
                  subscriptionId: subData.id,
                  status: newStatus
                });
              }
            }
          } catch (e) {}
        }
        return subData;
      }),
      cancelSubscription: createAuthEndpoint("/paymongo/cancel-subscription", {
        method: "POST",
        body: z.object({
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { organizationId } = ctx.body;
        const userId = ctx.context.session.user.id;
        const adapter = getAdapter(ctx);
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(userId);
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          throw new Error("No subscription found");
        if (subData.status === "canceled")
          return subData;
        subData.cancelAtPeriodEnd = true;
        const updateData = { paymongoData: JSON.stringify(subData) };
        if (organizationId) {
          await adapter.updateOrganization(organizationId, updateData);
        } else {
          await adapter.updateUser(userId, updateData);
        }
        if (config.onSubscriptionCancel) {
          await config.onSubscriptionCancel({
            userId,
            orgId: organizationId,
            subscriptionId: subData.id
          });
        }
        return subData;
      }),
      switchPlan: createAuthEndpoint("/paymongo/switch-plan", {
        method: "POST",
        body: z.object({
          newPlanId: z.string(),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { newPlanId, organizationId } = ctx.body;
        const userId = ctx.context.session.user.id;
        const adapter = getAdapter(ctx);
        const newPlan = config.plans[newPlanId];
        if (!newPlan)
          throw new Error("Invalid plan ID");
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(userId);
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          throw new Error("No subscription found");
        const oldPlanId = subData.planId;
        if (oldPlanId === newPlanId)
          return subData;
        subData.planId = newPlanId;
        if (newPlan.limits) {
          for (const key of Object.keys(newPlan.limits)) {
            if (subData.usage[key] === undefined) {
              subData.usage[key] = 0;
            }
          }
        }
        const updateData = { paymongoData: JSON.stringify(subData) };
        if (organizationId) {
          await adapter.updateOrganization(organizationId, updateData);
        } else {
          await adapter.updateUser(userId, updateData);
        }
        if (config.onPlanSwitch) {
          await config.onPlanSwitch({
            userId,
            orgId: organizationId,
            oldPlanId,
            newPlanId
          });
        }
        return subData;
      }),
      addAddon: createAuthEndpoint("/paymongo/add-addon", {
        method: "POST",
        body: z.object({
          addonId: z.string(),
          quantity: z.number().min(1).default(1),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { addonId, quantity, organizationId } = ctx.body;
        const addon = config.addons?.[addonId];
        if (!addon)
          throw new Error("Invalid addon ID");
        const adapter = getAdapter(ctx);
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(ctx.context.session.user.id);
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          throw new Error("No subscription found");
        if (!subData.addons[addonId]) {
          subData.addons[addonId] = 0;
        }
        subData.addons[addonId] += quantity;
        const updateData = { paymongoData: JSON.stringify(subData) };
        if (organizationId) {
          await adapter.updateOrganization(organizationId, updateData);
        } else {
          await adapter.updateUser(ctx.context.session.user.id, updateData);
        }
        return subData;
      }),
      checkUsage: createAuthEndpoint("/paymongo/check-usage", {
        method: "GET",
        query: z.object({
          limitKey: z.string(),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { limitKey, organizationId } = ctx.query;
        const adapter = getAdapter(ctx);
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(ctx.context.session.user.id);
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          throw new Error("No subscription found");
        const plan = config.plans[subData.planId];
        if (!plan)
          throw new Error("Plan not found");
        const baseLimit = plan.limits[limitKey] || 0;
        let bonus = 0;
        if (config.addons) {
          for (const [addonId, qty] of Object.entries(subData.addons)) {
            const addon = config.addons[addonId];
            if (addon?.limitBonuses?.[limitKey]) {
              bonus += addon.limitBonuses[limitKey] * qty;
            }
          }
        }
        const totalLimit = baseLimit + bonus;
        const usage = subData.usage[limitKey] || 0;
        const remaining = Math.max(0, totalLimit - usage);
        return {
          usage,
          limit: totalLimit,
          remaining,
          allowed: usage < totalLimit
        };
      }),
      incrementUsage: createAuthEndpoint("/paymongo/increment-usage", {
        method: "POST",
        body: z.object({
          limitKey: z.string(),
          quantity: z.number().default(1),
          organizationId: z.string().optional()
        }),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const { limitKey, quantity, organizationId } = ctx.body;
        const adapter = getAdapter(ctx);
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(ctx.context.session.user.id);
        if (!record)
          throw new Error("Record not found");
        const subData = getPaymongoData(record);
        if (!subData)
          throw new Error("No subscription found");
        const plan = config.plans[subData.planId];
        if (!plan)
          throw new Error("Plan not found");
        const baseLimit = plan.limits[limitKey] || 0;
        let bonus = 0;
        if (config.addons) {
          for (const [addonId, qty] of Object.entries(subData.addons)) {
            const addon = config.addons[addonId];
            if (addon?.limitBonuses?.[limitKey]) {
              bonus += addon.limitBonuses[limitKey] * qty;
            }
          }
        }
        const totalLimit = baseLimit + bonus;
        const currentUsage = subData.usage[limitKey] || 0;
        const newUsage = Math.max(0, currentUsage + quantity);
        if (quantity > 0 && newUsage > totalLimit) {
          throw new Error("Usage limit exceeded");
        }
        subData.usage[limitKey] = newUsage;
        const updateData = { paymongoData: JSON.stringify(subData) };
        if (organizationId) {
          await adapter.updateOrganization(organizationId, updateData);
        } else {
          await adapter.updateUser(ctx.context.session.user.id, updateData);
        }
        return {
          success: true,
          usage: subData.usage[limitKey],
          limit: totalLimit
        };
      }),
      getActiveSubscription: createAuthEndpoint("/paymongo/get-subscription", {
        method: "GET",
        query: z.object({
          organizationId: z.string().optional()
        }).optional(),
        use: [sessionMiddleware]
      }, async (ctx) => {
        const organizationId = ctx.query?.organizationId;
        const adapter = getAdapter(ctx);
        const record = organizationId ? await adapter.findOrganization(organizationId) : await adapter.findUser(ctx.context.session.user.id);
        if (!record)
          return null;
        return getPaymongoData(record);
      })
    }
  };
};
export {
  useUsage,
  useSubscription,
  usePlan,
  useIsSubscribed,
  subscriptionLoadingAtom,
  subscriptionErrorAtom,
  subscriptionAtom,
  paymongoFetch,
  paymongoClient,
  paymongo
};

//# debugId=B0FE70AA4D79225B64756E2164756E21

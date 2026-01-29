// src/client.ts
import { atom } from "nanostores";
var paymongoClient = () => {
  const $subscriptionSignal = atom(false);
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getAtoms: ($fetch) => ({
      $subscriptionSignal
    }),
    getActions: ($fetch) => ({
      attach: async (planId, options) => {
        const result = await $fetch("/paymongo/attach", {
          method: "POST",
          body: { planId, ...options }
        });
        if (result.data) {
          $subscriptionSignal.set(!$subscriptionSignal.get());
        }
        return result;
      },
      check: async (featureId, options) => {
        const params = new URLSearchParams({ feature: featureId });
        if (options?.organizationId)
          params.set("organizationId", options.organizationId);
        return $fetch(`/paymongo/check?${params}`, { method: "GET" });
      },
      track: async (featureId, options) => {
        const result = await $fetch("/paymongo/track", {
          method: "POST",
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
        matcher: (path) => path.startsWith("/paymongo/"),
        signal: "$subscriptionSignal"
      }
    ]
  };
};
export {
  paymongoClient
};

//# debugId=E5A0B61EB21DCDDE64756E2164756E21

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
export {
  subscriptionLoadingAtom,
  subscriptionErrorAtom,
  subscriptionAtom,
  paymongoClient
};

//# debugId=3C215171A4791BF664756E2164756E21

// src/client.ts
var paymongoClient = () => {
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getActions: ($fetch) => ({
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
  paymongoClient
};

//# debugId=B815CC70F4E7B6C564756E2164756E21

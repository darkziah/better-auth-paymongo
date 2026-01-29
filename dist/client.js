// src/client.ts
import { atom } from "nanostores";
var paymongoClient = () => {
  const $subscriptionSignal = atom(false);
  return {
    id: "paymongo",
    $InferServerPlugin: {},
    getAtoms: () => ({
      $subscriptionSignal
    }),
    pathMethods: {
      "/paymongo/check": "GET",
      "/paymongo/attach": "POST",
      "/paymongo/track": "POST",
      "/paymongo/verify": "POST",
      "/paymongo/set-plan": "POST"
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

//# debugId=2CF746EAD9D89C1164756E2164756E21

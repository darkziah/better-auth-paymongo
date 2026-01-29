import type { paymongo } from "./server";
export declare const paymongoClient: () => {
    id: "paymongo";
    $InferServerPlugin: ReturnType<typeof paymongo>;
    getAtoms: () => {
        $subscriptionSignal: import("nanostores").PreinitializedWritableAtom<boolean> & object;
    };
    pathMethods: {
        "/paymongo/check": "GET";
        "/paymongo/attach": "POST";
        "/paymongo/track": "POST";
        "/paymongo/verify": "POST";
        "/paymongo/set-plan": "POST";
    };
    atomListeners: {
        matcher: (path: string) => boolean;
        signal: "$subscriptionSignal";
    }[];
};

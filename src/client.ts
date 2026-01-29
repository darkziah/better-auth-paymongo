import type { BetterAuthClientPlugin } from "better-auth/client";
import { atom } from "nanostores";
import type { paymongo } from "./server";

export const paymongoClient = () => {
	const $subscriptionSignal = atom<boolean>(false);

	return {
		id: "paymongo",
		$InferServerPlugin: {} as ReturnType<typeof paymongo>,

		getAtoms: () => ({
			$subscriptionSignal,
		}),

		pathMethods: {
			"/paymongo/check": "GET",
			"/paymongo/attach": "POST",
			"/paymongo/track": "POST",
			"/paymongo/verify": "POST",
			"/paymongo/set-plan": "POST",
		},

		atomListeners: [
			{
				matcher: (path: string) => path.startsWith("/paymongo/"),
				signal: "$subscriptionSignal"
			}
		]
	} satisfies BetterAuthClientPlugin;
};

import { createAuthClient } from "better-auth/client";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [paymongoClient()],
});

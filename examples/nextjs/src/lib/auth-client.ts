"use client";

import { createAuthClient } from "better-auth/react";
import { paymongoClient } from "better-auth-paymongo/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [paymongoClient()],
});

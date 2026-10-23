// The login system, server side.
// Better Auth handles sign-up, sign-in, sessions and password scrambling.
// It reads two secret settings from .env: BETTER_AUTH_SECRET and BETTER_AUTH_URL.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  // Save users, sessions and passwords in our Neon database.
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Let people sign up with an email and a password.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Lets login work inside Next.js server code. Keep this plugin last.
  plugins: [nextCookies()],
});
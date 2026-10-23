// Helpers that answer one question: who is signed in right now?

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// Returns the signed-in player, or null if nobody is signed in.
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// Returns the signed-in player, or sends visitors to the login page.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
"use server";

// What happens when you click a quest, or click "Sign out".
// If a quest was not done yet, we complete it (and give XP).
// If it was already done, we undo it (and take the XP back).
// If a tick pushes you over a rank line, we show the rank-up screen.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "../lib/auth";
import { requireUser } from "../lib/session";
import { completeQuest, uncompleteQuest } from "../lib/xp";

export async function toggleQuest(formData: FormData) {
  const questId = String(formData.get("questId"));
  const wasDone = formData.get("done") === "true";

  // Only a signed-in player can tick quests.
  const user = await requireUser();

  let rankUpTo: string | null = null;

  if (wasDone) {
    await uncompleteQuest(user.id, questId);
  } else {
    const result = await completeQuest(user.id, questId);
    const highest = result.rankUps[result.rankUps.length - 1];
    if (highest) rankUpTo = highest.rank;
  }

  // Tell Next.js to redraw the page with the new numbers.
  revalidatePath("/");

  // New rank? Go to the quest board with the rank-up screen on top.
  if (rankUpTo) redirect(`/?rankup=${encodeURIComponent(rankUpTo)}`);
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
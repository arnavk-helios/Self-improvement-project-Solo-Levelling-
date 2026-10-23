"use server";

// What happens when you click a quest.
// If it was not done yet, we complete it (and give XP).
// If it was already done, we undo it (and take the XP back).

import { revalidatePath } from "next/cache";
import { completeQuest, uncompleteQuest } from "../lib/xp";
import { getDemoUser } from "../lib/demo-user";

export async function toggleQuest(formData: FormData) {
  const questId = String(formData.get("questId"));
  const wasDone = formData.get("done") === "true";

  const user = await getDemoUser();

  if (wasDone) {
    await uncompleteQuest(user.id, questId);
  } else {
    await completeQuest(user.id, questId);
  }

  // Tell Next.js to redraw the page with the new numbers.
  revalidatePath("/");
}

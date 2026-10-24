// The streak calculator, following the Never Miss Twice rule.
//
// An "active day" is a day with at least one quest ticked.
// One missed day does NOT break your streak. Two missed days in a row do.

import { prisma } from "./prisma";
import { addDays, dayKey, toDateOnly, RECOVERY_BONUS } from "./xp";

export type StreakState =
  | "none" // no streak right now
  | "pending" // you played yesterday, nothing yet today
  | "recovery" // you missed yesterday: do not miss twice
  | "extended"; // you already played today

export async function getStreakInfo(userId: string) {
  const today = toDateOnly(new Date());

  const [days, recovery] = await Promise.all([
    prisma.questLog.groupBy({
      by: ["date"],
      where: { userId, date: { gte: addDays(today, -400) } },
    }),
    prisma.xpEvent.findFirst({
      where: { userId, source: "BONUS", sourceId: `recovery-${dayKey(today)}` },
      select: { id: true },
    }),
  ]);

  const active = new Set(days.map((d) => dayKey(d.date)));
  const isActive = (offset: number) => active.has(dayKey(addDays(today, offset)));

  // Walk backwards from today. Count active days.
  // Stop at the second missed day in a row.
  let streak = 0;
  let missesInARow = 0;
  for (let i = 0; i < 400; i++) {
    if (isActive(-i)) {
      streak++;
      missesInARow = 0;
    } else if (i > 0) {
      // (today does not count as missed, because the day is not over)
      missesInARow++;
      if (missesInARow >= 2) break;
    }
  }

  let state: StreakState;
  if (streak === 0) state = "none";
  else if (isActive(0)) state = "extended";
  else if (isActive(-1)) state = "pending";
  else state = "recovery";

  return {
    streak,
    state,
    recoveredToday: recovery !== null,
    bonus: RECOVERY_BONUS,
  };
}
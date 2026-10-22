// The XP engine.
// These functions are the only place that gives or takes away XP.
// Remember: we never store a "total". Every XP is one row in xp_events,
// and the total is calculated by adding them up.

import { prisma } from "./prisma";
import { getRankProgress } from "./ranks";

// The database stores quest days as plain dates (no time of day).
// This turns "right now" into "today's date".
export function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

// Tick a quest as done for a day. Gives XP once per quest per day.
export async function completeQuest(
  userId: string,
  questId: string,
  when: Date = new Date()
) {
  const date = toDateOnly(when);
  const quest = await prisma.quest.findUniqueOrThrow({ where: { id: questId } });

  // Already ticked today? Then no extra XP.
  const existing = await prisma.questLog.findUnique({
    where: { userId_questId_date: { userId, questId, date } },
  });
  if (existing) return { completed: false, xp: 0 };

  try {
    // Do both steps together: if one fails, neither happens.
    await prisma.$transaction([
      prisma.questLog.create({ data: { userId, questId, date } }),
      prisma.xpEvent.create({
        data: {
          userId,
          source: "QUEST",
          sourceId: questId,
          amount: quest.xp,
          date,
        },
      }),
    ]);
  } catch (error) {
    // Two fast clicks at once: the database blocks the duplicate for us.
    if ((error as { code?: string }).code === "P2002") {
      return { completed: false, xp: 0 };
    }
    throw error;
  }

  return { completed: true, xp: quest.xp };
}

// The undo button: un-tick a quest and take its XP back.
export async function uncompleteQuest(
  userId: string,
  questId: string,
  when: Date = new Date()
) {
  const date = toDateOnly(when);

  const [logs] = await prisma.$transaction([
    prisma.questLog.deleteMany({ where: { userId, questId, date } }),
    prisma.xpEvent.deleteMany({
      where: { userId, source: "QUEST", sourceId: questId, date },
    }),
  ]);

  return { undone: logs.count > 0 };
}

// Add up every XP event this user has ever earned.
export async function getTotalXp(userId: string): Promise<number> {
  const result = await prisma.xpEvent.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

// Everything the screen needs: total XP, rank, next rank, progress bar.
export async function getUserStats(userId: string) {
  const [totalXp, ranks] = await Promise.all([
    getTotalXp(userId),
    prisma.rank.findMany({ orderBy: { minXp: "asc" } }),
  ]);

  return { totalXp, rank: getRankProgress(totalXp, ranks) };
}
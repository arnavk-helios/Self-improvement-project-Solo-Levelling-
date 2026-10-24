// The XP engine.
// These functions are the only place that gives or takes away XP.
// Remember: we never store a "total". Every XP is one row in xp_events,
// and the total is calculated by adding them up.

import { prisma } from "./prisma";
import { getRankProgress } from "./ranks";

const DAY = 24 * 60 * 60 * 1000;

// Never Miss Twice: the bonus for coming back after exactly one missed day.
// (Matches "Recovered From a Missed Day" in the PDF.)
export const RECOVERY_BONUS = 30;

// The database stores quest days as plain dates (no time of day).
// This turns "right now" into "today's date".
export function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY);
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // like "2026-10-24"
}

// Tick a quest as done for a day. Gives XP once per quest per day.
// Also handles the recovery bonus and any rank-ups this tick causes.
export async function completeQuest(
  userId: string,
  questId: string,
  when: Date = new Date()
) {
  const date = toDateOnly(when);
  const quest = await prisma.quest.findUniqueOrThrow({ where: { id: questId } });

  try {
    // Do both steps together: if one fails, neither happens.
    // Already ticked today? The database refuses the duplicate (see below),
    // so we do not need a separate check first. That saves one trip.
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
      return { completed: false, xp: 0, bonus: 0, rankUps: [] as RankUp[] };
    }
    throw error;
  }

  // Never Miss Twice: first quest today, nothing yesterday,
  // but you were active the day before = you came back after one missed day.
  let bonus = 0;
  const recent = await prisma.questLog.groupBy({
    by: ["date"],
    where: { userId, date: { in: [date, addDays(date, -1), addDays(date, -2)] } },
    _count: { _all: true },
  });
  const countOn = (day: Date) =>
    recent.find((r) => dayKey(r.date) === dayKey(day))?._count._all ?? 0;

  if (
    countOn(date) === 1 &&
    countOn(addDays(date, -1)) === 0 &&
    countOn(addDays(date, -2)) > 0
  ) {
    await prisma.xpEvent.create({
      data: {
        userId,
        source: "BONUS",
        sourceId: `recovery-${dayKey(date)}`,
        amount: RECOVERY_BONUS,
        date,
      },
    });
    bonus = RECOVERY_BONUS;
  }

  const rankUps = await awardRankUps(userId, date);
  return { completed: true, xp: quest.xp, bonus, rankUps };
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

  // No quests left today? Then the day was not really "recovered",
  // so the recovery bonus goes too (it can be earned again by ticking again).
  if (logs.count > 0) {
    const remaining = await prisma.questLog.count({ where: { userId, date } });
    if (remaining === 0) {
      await prisma.xpEvent.deleteMany({
        where: { userId, source: "BONUS", sourceId: `recovery-${dayKey(date)}`, date },
      });
    }
  }

  return { undone: logs.count > 0 };
}

export type RankUp = { rank: string; xp: number };

// Did the latest XP push you over a rank line? If so, hand out the rank-up
// bonus from the achievements list ("Rank Up: D" and so on), once per rank.
async function awardRankUps(userId: string, date: Date): Promise<RankUp[]> {
  const [ranks, totalXp, owned] = await Promise.all([
    prisma.rank.findMany({ orderBy: { minXp: "asc" } }),
    getTotalXp(userId),
    prisma.userAchievement.findMany({
      where: { userId, achievement: { slug: { startsWith: "rank-up-" } } },
      select: { achievement: { select: { slug: true } } },
    }),
  ]);

  const have = new Set(owned.map((o) => o.achievement.slug));
  const missing = ranks.filter(
    (r) =>
      r.minXp > 0 &&
      totalXp >= r.minXp &&
      !have.has(`rank-up-${r.name.toLowerCase()}`)
  );
  if (missing.length === 0) return [];

  const awarded: RankUp[] = [];
  for (const rank of missing) {
    const achievement = await prisma.achievement.findUnique({
      where: { slug: `rank-up-${rank.name.toLowerCase()}` },
    });
    if (!achievement) continue;

    // The unique rule means a rank-up can only be earned once per player.
    const created = await prisma.userAchievement.createMany({
      data: [{ userId, achievementId: achievement.id }],
      skipDuplicates: true,
    });
    if (created.count > 0) {
      await prisma.xpEvent.create({
        data: {
          userId,
          source: "ACHIEVEMENT",
          sourceId: achievement.id,
          amount: achievement.xp,
          date,
        },
      });
      awarded.push({ rank: rank.name, xp: achievement.xp });
    }
  }

  // The bonus XP might itself cross the next line, so check once more.
  if (awarded.length > 0) {
    awarded.push(...(await awardRankUps(userId, date)));
  }
  return awarded;
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
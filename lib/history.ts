// The history calculator.
// It reads the XP notebook (xp_events) and the quest ticks (quest_logs)
// and turns them into numbers the History page can draw.

import { prisma } from "./prisma";
import { getTotalXp, toDateOnly } from "./xp";

const DAY = 24 * 60 * 60 * 1000;

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10); // like "2026-10-23"
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }); // like "Oct 23"
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY);
}

// 0 = no XP, 4 = at least 75% of a perfect day
function levelFor(xp: number, perfectDay: number): 0 | 1 | 2 | 3 | 4 {
  if (xp <= 0) return 0;
  const share = xp / perfectDay;
  if (share >= 0.75) return 4;
  if (share >= 0.5) return 3;
  if (share >= 0.25) return 2;
  return 1;
}

export type HeatCell = {
  key: string;
  label: string;
  xp: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
};
export type BarDay = { key: string; label: string; xp: number };
export type RecentDay = { key: string; label: string; xp: number; quests: string[] };

export async function getHistory(userId: string) {
  const today = toDateOnly(new Date());

  const [events, logs, questTotals, totalXp] = await Promise.all([
    prisma.xpEvent.findMany({
      where: { userId, date: { gte: addDays(today, -364) } },
      select: { date: true, amount: true },
    }),
    prisma.questLog.findMany({
      where: { userId, date: { gte: addDays(today, -29) } },
      include: { quest: { select: { name: true, sortOrder: true } } },
    }),
    prisma.quest.aggregate({ where: { active: true }, _sum: { xp: true } }),
    getTotalXp(userId),
  ]);

  const perfectDay = questTotals._sum.xp || 365;

  // XP earned on each day
  const xpByDay = new Map<string, number>();
  for (const event of events) {
    const key = dayKey(event.date);
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + event.amount);
  }
  const xpOn = (date: Date) => xpByDay.get(dayKey(date)) ?? 0;

  // Heatmap: 12 weeks, one column per week, Monday at the top
  const mondayIndex = (today.getUTCDay() + 6) % 7;
  const start = addDays(today, -mondayIndex - 7 * 11);
  const heat: HeatCell[] = [];
  for (let i = 0; i < 84; i++) {
    const date = addDays(start, i);
    const future = date.getTime() > today.getTime();
    const xp = future ? 0 : xpOn(date);
    heat.push({
      key: dayKey(date),
      label: dayLabel(date),
      xp,
      level: levelFor(xp, perfectDay),
      future,
    });
  }

  // Bars: the last 30 days
  const bars: BarDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = addDays(today, -i);
    bars.push({ key: dayKey(date), label: dayLabel(date), xp: xpOn(date) });
  }

  // Streak: days in a row with any XP, counting back from today
  // (if you have not played yet today, yesterday keeps your streak alive)
  let streak = 0;
  let cursor = xpOn(today) > 0 ? today : addDays(today, -1);
  while (xpOn(cursor) > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const dayTotals = [...xpByDay.values()];
  const activeDays = dayTotals.filter((xp) => xp > 0).length;
  const bestDay = Math.max(0, ...dayTotals);

  // Recent days: which quests you finished on each of your last 7 active days
  const questsByDay = new Map<string, { name: string; order: number }[]>();
  for (const log of logs) {
    const key = dayKey(log.date);
    const list = questsByDay.get(key) ?? [];
    list.push({ name: log.quest.name, order: log.quest.sortOrder });
    questsByDay.set(key, list);
  }
  const recent: RecentDay[] = [...questsByDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
    .map(([key, list]) => ({
      key,
      label: dayLabel(new Date(key)),
      xp: xpByDay.get(key) ?? 0,
      quests: list.sort((a, b) => a.order - b.order).map((q) => q.name),
    }));

  return { totalXp, streak, activeDays, bestDay, heat, bars, recent };
}
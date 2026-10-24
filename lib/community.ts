// The community calculator.
// It finds your friends and pending requests, then adds up everyone's XP
// so the Community page can rank your network.
// Friends only ever see each other's name, rank and XP. Never an email.

import { prisma } from "./prisma";
import { getRankProgress } from "./ranks";
import { toDateOnly } from "./xp";

const DAY = 24 * 60 * 60 * 1000;

export type NetworkRow = {
  id: string;
  friendshipId: string | null; // null for you
  name: string;
  rank: string;
  totalXp: number;
  weekXp: number; // XP over the last 7 days, today included
  isYou: boolean;
};

export type RequestRow = { friendshipId: string; name: string };

export async function getCommunity(userId: string) {
  const [links, ranks, me] = await Promise.all([
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: {
        requester: { select: { id: true, name: true } },
        addressee: { select: { id: true, name: true } },
      },
    }),
    prisma.rank.findMany({ orderBy: { minXp: "asc" } }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true },
    }),
  ]);

  const incoming: RequestRow[] = links
    .filter((l) => l.status === "PENDING" && l.addresseeId === userId)
    .map((l) => ({ friendshipId: l.id, name: l.requester.name ?? "A hunter" }));

  const outgoing: RequestRow[] = links
    .filter((l) => l.status === "PENDING" && l.requesterId === userId)
    .map((l) => ({ friendshipId: l.id, name: l.addressee.name ?? "A hunter" }));

  // You, plus everyone whose request was accepted
  const people = [
    { id: me.id, name: me.name ?? "You", friendshipId: null as string | null, isYou: true },
    ...links
      .filter((l) => l.status === "ACCEPTED")
      .map((l) => {
        const other = l.requesterId === userId ? l.addressee : l.requester;
        return {
          id: other.id,
          name: other.name ?? "A hunter",
          friendshipId: l.id as string | null,
          isYou: false,
        };
      }),
  ];

  const ids = people.map((p) => p.id);
  const weekStart = new Date(toDateOnly(new Date()).getTime() - 6 * DAY);

  const [totals, weeks] = await Promise.all([
    prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { amount: true },
    }),
    prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, date: { gte: weekStart } },
      _sum: { amount: true },
    }),
  ]);

  const totalById = new Map(totals.map((t) => [t.userId, t._sum.amount ?? 0]));
  const weekById = new Map(weeks.map((w) => [w.userId, w._sum.amount ?? 0]));

  // Most XP this week first; ties go to whoever has more XP overall
  const network: NetworkRow[] = people
    .map((p) => {
      const totalXp = totalById.get(p.id) ?? 0;
      return {
        ...p,
        totalXp,
        weekXp: weekById.get(p.id) ?? 0,
        rank: getRankProgress(totalXp, ranks).current.name,
      };
    })
    .sort((a, b) => b.weekXp - a.weekXp || b.totalXp - a.totalXp);

  return { network, incoming, outgoing };
}
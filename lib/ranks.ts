// The rank calculator.
// Give it a total XP number and the list of ranks, and it tells you:
// your current rank, your next rank, and how full the progress bar is.
// It does not touch the database, so it is easy to test.

export type RankInfo = {
  name: string;
  minXp: number;
  description?: string;
};

export type RankProgress = {
  current: RankInfo;
  next: RankInfo | null; // null when you are already Monarch
  xpIntoRank: number; // XP earned since reaching the current rank
  xpForNextRank: number; // XP needed to cross from current to next (0 at max rank)
  percent: number; // 0 to 100, for the progress bar
};

export function getRankProgress(totalXp: number, ranks: RankInfo[]): RankProgress {
  const sorted = [...ranks].sort((a, b) => a.minXp - b.minXp);

  // Walk up the ladder and stop at the highest rank we have reached.
  let currentIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (totalXp >= sorted[i].minXp) currentIndex = i;
  }

  const current = sorted[currentIndex];
  const next = sorted[currentIndex + 1] ?? null;
  const xpIntoRank = totalXp - current.minXp;

  // Top of the ladder: nothing left to climb.
  if (!next) {
    return { current, next: null, xpIntoRank, xpForNextRank: 0, percent: 100 };
  }

  const xpForNextRank = next.minXp - current.minXp;
  const percent = Math.min(100, Math.floor((xpIntoRank / xpForNextRank) * 100));

  return { current, next, xpIntoRank, xpForNextRank, percent };
}
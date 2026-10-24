import Link from "next/link";
import { prisma } from "../lib/prisma";
import { getUserStats, toDateOnly } from "../lib/xp";
import { getStreakInfo } from "../lib/streak";
import { requireUser } from "../lib/session";
import { toggleQuest } from "./actions";
import TopBar from "./TopBar";
import "./streak.css";

// Always fetch fresh numbers from the database.
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  routine: "Routine",
  fitness: "Training",
  nutrition: "Fuel",
  mind: "Mind",
  looks: "Presence",
  recovery: "Recovery",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ rankup?: string }>;
}) {
  // Not signed in? This sends the visitor to /login.
  const user = await requireUser();
  const today = toDateOnly(new Date());
  const { rankup } = await searchParams;

  const [quests, logs, stats, streak] = await Promise.all([
    prisma.quest.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.questLog.findMany({ where: { userId: user.id, date: today } }),
    getUserStats(user.id),
    getStreakInfo(user.id),
  ]);

  // Show the rank-up screen only if you really earned that rank in the last 10 minutes.
  let rankUp: { name: string; xp: number } | null = null;
  if (rankup && /^[A-Za-z]{1,7}$/.test(rankup)) {
    const earned = await prisma.userAchievement.findFirst({
      where: {
        userId: user.id,
        earnedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        achievement: { slug: `rank-up-${rankup.toLowerCase()}` },
      },
      include: { achievement: { select: { name: true, xp: true } } },
    });
    if (earned) {
      rankUp = {
        name: earned.achievement.name.replace("Rank Up: ", ""),
        xp: earned.achievement.xp,
      };
    }
  }

  const streakMessages = {
    none: "No streak yet. Finish a quest today to start one.",
    pending: "Finish any quest today to keep your streak going.",
    recovery: `You missed yesterday. Never miss twice: finish a quest today to keep your streak and earn +${streak.bonus} XP.`,
    extended: streak.recoveredToday
      ? `You came back after a missed day. +${streak.bonus} XP recovery bonus earned.`
      : "Streak extended for today. Come back tomorrow.",
  };

  const doneIds = new Set(logs.map((log) => log.questId));
  const dailyMax = quests.reduce((sum, q) => sum + q.xp, 0);
  const dailyXp = quests
    .filter((q) => doneIds.has(q.id))
    .reduce((sum, q) => sum + q.xp, 0);
  const dailyPercent = dailyMax > 0 ? Math.round((dailyXp / dailyMax) * 100) : 0;

  const { totalXp, rank } = stats;

  // Group quests by category, keeping the original order.
  const groups = quests.reduce<Record<string, typeof quests>>((acc, quest) => {
    (acc[quest.category] ??= []).push(quest);
    return acc;
  }, {});

  return (
    <main className="shell">
      <TopBar active="quests" />

      <section className="status" aria-label="Your rank">
        <div className="emblem-wrap">
          <div className="emblem">
            <div className="emblem-inner">
              <span
                className="emblem-letter"
                style={{ fontSize: rank.current.name.length > 2 ? "1.05rem" : "2.6rem" }}
              >
                {rank.current.name}
              </span>
            </div>
          </div>
        </div>

        <div className="status-body">
          <p className="hunter">{user.name}</p>
          <p className="rank-title">Rank {rank.current.name}</p>
          <div
            className="bar"
            role="progressbar"
            aria-label="Progress to next rank"
            aria-valuenow={rank.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="bar-fill" style={{ width: `${rank.percent}%` }} />
          </div>
          <p className="xp-line">
            <strong>{totalXp.toLocaleString()} XP total</strong>
            <span>
              {rank.next
                ? `${(rank.xpForNextRank - rank.xpIntoRank).toLocaleString()} XP to rank ${rank.next.name}`
                : "Top rank reached"}
            </span>
          </p>
        </div>
      </section>

      <section className={`streak ${streak.state}`} aria-label="Your streak">
        <div className="streak-count">
          <strong>{streak.streak}</strong>
          <span>day streak</span>
        </div>
        <p className="streak-text">{streakMessages[streak.state]}</p>
      </section>

      <header className="board-head">
        <h1>Quest board</h1>
        <div
          className="bar small"
          role="progressbar"
          aria-label="XP earned today"
          aria-valuenow={dailyPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bar-fill" style={{ width: `${dailyPercent}%` }} />
        </div>
        <p className="today-line">
          {dailyXp} of {dailyMax} XP earned today
        </p>
      </header>

      {Object.entries(groups).map(([category, items]) => (
        <section className="group" key={category}>
          <h2>{CATEGORY_LABELS[category] ?? category}</h2>
          <ul className="quests">
            {items.map((quest) => {
              const done = doneIds.has(quest.id);
              return (
                <li key={quest.id}>
                  <form action={toggleQuest}>
                    <input type="hidden" name="questId" value={quest.id} />
                    <input type="hidden" name="done" value={String(done)} />
                    <button type="submit" className="quest" aria-pressed={done}>
                      <span className="check" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path
                            d="M3 8.5l3 3 7-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="q-name">{quest.name}</span>
                      <span className="q-xp">+{quest.xp} XP</span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {rankUp && (
        <div className="rankup" role="dialog" aria-modal="true" aria-labelledby="rankup-title">
          <div className="rankup-card">
            <div className="emblem-wrap">
              <div className="emblem">
                <div className="emblem-inner">
                  <span
                    className="emblem-letter"
                    style={{ fontSize: rankUp.name.length > 2 ? "1.05rem" : "2.6rem" }}
                  >
                    {rankUp.name}
                  </span>
                </div>
              </div>
            </div>
            <p className="rankup-kicker">Rank up</p>
            <h2 id="rankup-title">Rank {rankUp.name} reached</h2>
            <p className="rankup-bonus">+{rankUp.xp} XP bonus</p>
            <Link href="/" className="rankup-btn">
              Continue
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
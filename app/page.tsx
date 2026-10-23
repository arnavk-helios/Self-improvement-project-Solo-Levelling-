import { prisma } from "../lib/prisma";
import { getUserStats, toDateOnly } from "../lib/xp";
import { getDemoUser } from "../lib/demo-user";
import { toggleQuest } from "./actions";

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

export default async function Home() {
  const user = await getDemoUser();
  const today = toDateOnly(new Date());

  const [quests, logs, stats] = await Promise.all([
    prisma.quest.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.questLog.findMany({ where: { userId: user.id, date: today } }),
    getUserStats(user.id),
  ]);

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
          <p className="hunter">{user.name ?? "Hunter"}</p>
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

      <p className="note">
        You are playing on a demo account. Sign-in comes in a later step.
      </p>
    </main>
  );
}
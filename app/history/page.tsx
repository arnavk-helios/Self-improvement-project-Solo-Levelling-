import Link from "next/link";
import { requireUser } from "../../lib/session";
import { getHistory } from "../../lib/history";
import TopBar from "../TopBar";
import "./history.css";

// Always fetch fresh numbers from the database.
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requireUser();
  const history = await getHistory(user.id);

  const tallestBar = Math.max(100, ...history.bars.map((bar) => bar.xp));
  const hasHistory = history.activeDays > 0;

  return (
    <main className="shell">
      <TopBar active="history" />

      <header className="board-head">
        <h1>History</h1>
        <p className="today-line">{user.name}, here is how your XP has grown.</p>
      </header>

      <dl className="stats">
        <div className="stat">
          <dt>Total XP</dt>
          <dd>{history.totalXp.toLocaleString()}</dd>
        </div>
        <div className="stat">
          <dt>Current streak</dt>
          <dd>
            {history.streak} {history.streak === 1 ? "day" : "days"}
          </dd>
        </div>
        <div className="stat">
          <dt>Active days</dt>
          <dd>{history.activeDays}</dd>
        </div>
        <div className="stat">
          <dt>Best day</dt>
          <dd>{history.bestDay} XP</dd>
        </div>
      </dl>

      {!hasHistory ? (
        <section className="panel">
          <p className="empty">
            No history yet. Finish a quest on the <Link href="/">quest board</Link> and
            your first day will show up here.
          </p>
        </section>
      ) : (
        <>
          <section className="panel" aria-labelledby="heat-title">
            <h2 id="heat-title" className="panel-title">
              Last 12 weeks
            </h2>
            <div
              className="heatmap"
              role="img"
              aria-label="Calendar showing XP earned each day over the last 12 weeks"
            >
              {history.heat.map((cell) => (
                <div
                  key={cell.key}
                  className={`cell lvl-${cell.level}${cell.future ? " future" : ""}`}
                  title={cell.future ? undefined : `${cell.label}: ${cell.xp} XP`}
                />
              ))}
            </div>
            <div className="legend" aria-hidden="true">
              <span>Less</span>
              <div className="cell lvl-0" />
              <div className="cell lvl-1" />
              <div className="cell lvl-2" />
              <div className="cell lvl-3" />
              <div className="cell lvl-4" />
              <span>More</span>
            </div>
          </section>

          <section className="panel" aria-labelledby="bars-title">
            <h2 id="bars-title" className="panel-title">
              XP per day, last 30 days
            </h2>
            <div
              className="bars"
              role="img"
              aria-label="Bar chart of XP earned each day over the last 30 days"
            >
              {history.bars.map((bar) => (
                <div key={bar.key} className="bar-col" title={`${bar.label}: ${bar.xp} XP`}>
                  <div
                    className={`bar-col-fill${bar.xp === 0 ? " empty" : ""}`}
                    style={{
                      height: bar.xp === 0 ? "2px" : `max(4px, ${Math.round((bar.xp / tallestBar) * 100)}%)`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="bars-axis">
              <span>{history.bars[0].label}</span>
              <span>{history.bars[history.bars.length - 1].label}</span>
            </div>
          </section>

          <section className="panel" aria-labelledby="recent-title">
            <h2 id="recent-title" className="panel-title">
              Recent days
            </h2>
            <ul className="recent">
              {history.recent.map((day) => (
                <li key={day.key}>
                  <span className="recent-date">{day.label}</span>
                  <span className="recent-quests">
                    {day.quests.length} {day.quests.length === 1 ? "quest" : "quests"}:{" "}
                    {day.quests.join(", ")}
                  </span>
                  <span className="recent-xp">+{day.xp} XP</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
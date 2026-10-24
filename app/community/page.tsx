import { requireUser } from "../../lib/session";
import { getCommunity } from "../../lib/community";
import TopBar from "../TopBar";
import { sendFriendRequest, acceptRequest, removeFriendship } from "./actions";
import "./community.css";

// Always fetch fresh numbers from the database.
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  sent: "If that email belongs to a hunter, your request is on its way.",
  accepted: "You are now connected.",
  exists: "You are already connected, or a request is already waiting.",
  self: "That is your own email address.",
  empty: "Type a valid email address first.",
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireUser();
  const { notice } = await searchParams;
  const { network, incoming, outgoing } = await getCommunity(user.id);

  const friendCount = network.length - 1;

  return (
    <main className="shell">
      <TopBar active="community" />

      <header className="board-head">
        <h1>Community</h1>
        <p className="today-line">
          {user.name}, here is how you and your friends rank over the last 7 days.
        </p>
      </header>

      <section className="com-panel" aria-labelledby="add-title">
        <h2 id="add-title" className="com-title">
          Add a friend
        </h2>
        <form action={sendFriendRequest} className="com-form">
          <label htmlFor="friend-email" className="com-label">
            Their email address
          </label>
          <div className="com-form-row">
            <input
              id="friend-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className="com-input"
            />
            <button type="submit" className="com-btn">
              Send request
            </button>
          </div>
        </form>
        {notice && NOTICES[notice] && (
          <p className="com-notice" role="status">
            {NOTICES[notice]}
          </p>
        )}
      </section>

      {incoming.length > 0 && (
        <section className="com-panel" aria-labelledby="in-title">
          <h2 id="in-title" className="com-title">
            Requests for you
          </h2>
          <ul className="com-list">
            {incoming.map((request) => (
              <li key={request.friendshipId} className="com-request">
                <span className="com-name">{request.name}</span>
                <div className="com-actions">
                  <form action={acceptRequest}>
                    <input type="hidden" name="friendshipId" value={request.friendshipId} />
                    <button type="submit" className="com-btn small">
                      Accept
                    </button>
                  </form>
                  <form action={removeFriendship}>
                    <input type="hidden" name="friendshipId" value={request.friendshipId} />
                    <button type="submit" className="com-ghost">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="com-panel" aria-labelledby="net-title">
        <h2 id="net-title" className="com-title">
          Your network
        </h2>
        {friendCount === 0 && (
          <p className="com-empty">
            No friends yet. Send a request above, and they will show up here once they accept.
          </p>
        )}
        <ol className="com-list">
          {network.map((person, index) => (
            <li key={person.id} className={`com-row${person.isYou ? " you" : ""}`}>
              <span className="com-pos">{index + 1}</span>
              <span className="com-chip">{person.rank}</span>
              <span className="com-who">
                <span className="com-name">
                  {person.name}
                  {person.isYou && <span className="com-you">You</span>}
                </span>
                <span className="com-sub">{person.totalXp.toLocaleString()} XP total</span>
              </span>
              <span className="com-week">
                <strong>+{person.weekXp.toLocaleString()} XP</strong>
                <span className="com-sub">last 7 days</span>
              </span>
              {person.friendshipId ? (
                <form action={removeFriendship} className="com-action">
                  <input type="hidden" name="friendshipId" value={person.friendshipId} />
                  <button type="submit" className="com-ghost">
                    Remove
                  </button>
                </form>
              ) : (
                <span className="com-action" />
              )}
            </li>
          ))}
        </ol>
      </section>

      {outgoing.length > 0 && (
        <section className="com-panel" aria-labelledby="out-title">
          <h2 id="out-title" className="com-title">
            Requests you sent
          </h2>
          <ul className="com-list">
            {outgoing.map((request) => (
              <li key={request.friendshipId} className="com-request">
                <span className="com-name">{request.name}</span>
                <form action={removeFriendship}>
                  <input type="hidden" name="friendshipId" value={request.friendshipId} />
                  <button type="submit" className="com-ghost">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
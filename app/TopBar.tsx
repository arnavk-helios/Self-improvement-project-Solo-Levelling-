import Link from "next/link";
import { signOutAction } from "./actions";
import "./topbar.css";

type Props = { active: "quests" | "history" | "community" };

const LINKS = [
  { id: "quests", href: "/", label: "Quests" },
  { id: "history", href: "/history", label: "History" },
  { id: "community", href: "/community", label: "Community" },
] as const;

// The bar at the top of every page.
// Pass in which page you are on, and that link lights up.
export default function TopBar({ active }: Props) {
  return (
    <div className="topbar">
      <span className="brand">Monarch System</span>
      <nav className="nav">
        {LINKS.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            aria-current={active === link.id ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <form action={signOutAction}>
        <button type="submit" className="signout">
          Sign out
        </button>
      </form>
    </div>
  );
}
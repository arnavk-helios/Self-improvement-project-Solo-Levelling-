<div align="center">

<h5>S Y S T E M &nbsp; I N I T I A L I Z E D</h5>

# ⚔️ THE MONARCH SYSTEM

### Daily Discipline Protocol — now as a living, multiplayer app

*Motivation is a mood. Discipline is a mechanism.*
*One day. One quest. One level at a time.*

<br>

![Status](https://img.shields.io/badge/status-in%20development-6c7bff?style=for-the-badge)
![Rank](https://img.shields.io/badge/starting%20rank-E-1a1f3a?style=for-the-badge&labelColor=6c7bff)
![License](https://img.shields.io/badge/license-MIT-6c7bff?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-1a1f3a?style=for-the-badge&labelColor=6c7bff)

<br>

<!-- Replace with a real screenshot or GIF once the UI exists -->
<!-- <img src="docs/assets/hero.png" alt="Monarch System dashboard" width="720"> -->

</div>

---

## 📜 What is this?

**The Monarch System** turns self-improvement into a game you can't hide from.

Every day you complete **quests** (workout, sleep, reading, deep work, skincare, and more), earn **XP**, build **streaks**, and climb from **E-Rank** all the way to **Monarch**. Nothing is stored as a vague "total": every action is logged, so you get a full **history** of how you've grown over weeks and months.

It started as a printable 29-page PDF protocol. This project brings it to life as a web app that **multiple people can use to level up together**.

> Inspired by the *"leveling up"* style of progression games. This is an independent, original project and is not affiliated with or endorsed by any anime, manga, or game franchise.

---

## ✨ Features

| | Feature | Status |
|---|---|---|
| 🔐 | Accounts and a character profile with a baseline stat block | 🛠 Planned |
| 📋 | Daily quest board that awards XP | 🛠 Planned |
| 📈 | XP, rank, and a progress bar to the next rank | 🛠 Planned |
| 🗓 | History: calendar heatmap and XP-over-time charts | 🛠 Planned |
| 🔥 | Streaks and the **Never Miss Twice** recovery rule | 🛠 Planned |
| 🏆 | Achievements, auto-unlocked from your data | 🛠 Planned |
| 👹 | Weekly boss battles | 🛠 Planned |
| 🧭 | Monthly evaluation with a radar chart | 🛠 Planned |
| 📏 | Body and performance trackers | 🛠 Planned |
| 👥 | Friends and weekly leaderboards | 🛠 Planned |
| 🔔 | Reminders via PWA push notifications | 🛠 Planned |

---

## 🎖 Rank Ladder

| Rank | Cumulative XP | What it represents |
|:---:|---:|---|
| **E** | 0 | Day 1. System initialized. |
| **D** | 1,500 | First stretch of consistency |
| **C** | 4,000 | First visible habit stability |
| **B** | 9,000 | Changes become visible to others |
| **A** | 18,000 | Habits run on autopilot |
| **S** | 30,000 | Sustained transformation |
| **SS** | 45,000 | Elite consistency |
| **SSS** | 65,000 | Mastery-level discipline |
| **Monarch** | 90,000 | It's no longer a routine. It's who you are. |

> ⚖️ Thresholds are data, not code, so they can be rebalanced without touching the app logic.

---

## 🗡 Sample Daily Quests

| Quest | XP |
|---|---:|
| Complete scheduled workout | +50 |
| Sleep 7.5+ hours | +50 |
| Deep work block completed | +40 |
| No social media for 3 hrs | +40 |
| Read 20+ pages | +30 |
| Hit protein target | +25 |
| Drink 3L+ water | +20 |
| Journal 3+ lines | +15 |

Quests, achievements, and boss battles all live in the database, seeded from [`prisma/seed.ts`](prisma/seed.ts).

---

## 🧠 How the XP engine works

Instead of storing `total_xp = 4200`, the app keeps an **append-only XP ledger**:

```
xp_events
  user_id | source (quest / boss / achievement) | amount | date
```

Total XP, rank, streaks, and weekly or monthly stats are all **derived** from this ledger. That gives you:

- 📊 Complete history and charts
- 🔁 Safe rebalancing: change quest values later without corrupting anyone's progress
- 🧾 An audit trail for every point earned

---

## 🧰 Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** PostgreSQL (Supabase or Neon)
- **ORM:** Prisma
- **Auth:** Supabase Auth or Auth.js
- **Charts:** Recharts
- **Deploy:** Vercel
- **Delivery:** Installable **PWA**, so it works on desktop and mobile

---

## 🚀 Getting Started

```bash
# 1. Clone
git clone https://github.com/arnavk-helios/monarch-system.git
cd monarch-system

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in DATABASE_URL and auth keys

# 4. Create the database tables
npx prisma migrate dev

# 5. Seed quests, ranks, achievements, and bosses
npx prisma db seed

# 6. Run the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and begin your first quest.

---

## 🗂 Project Structure

```
monarch-system/
├── app/              # Next.js routes and pages
├── components/       # UI components (quest board, XP bar, charts)
├── lib/              # XP engine, rank logic, streak calculations
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.ts       # Game content: quests, ranks, achievements
├── docs/             # Original protocol and design notes
└── public/           # Icons and PWA manifest
```

---

## 🗺 Roadmap

- [ ] **MVP:** auth, daily quest board, XP and rank, history view
- [ ] **v2:** streaks, achievements, boss battles, monthly evaluation, body trackers
- [ ] **v3:** friends, leaderboards, custom quests, push reminders, data export

Follow progress in [Issues](../../issues).

---

## 🤝 Contributing

Contributions are welcome, whether it's a new quest idea, a balance tweak, a bug fix, or a UI improvement.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-idea`
3. Commit your changes with a clear message
4. Open a Pull Request

---

## ⚕️ Disclaimer

The Monarch System is a personal habit-tracking and productivity framework for motivational and organizational purposes only. It is **not** medical, dietary, psychological, or fitness advice. Consult qualified professionals before starting any new exercise, nutrition, or wellness program, especially if you have a pre-existing health condition.

---

## 📄 License

Released under the [MIT License](LICENSE).

---

<div align="center">

**The System only works the moment you close this page and complete the first quest.**

Built by [@arnavk-helios](https://github.com/arnavk-helios) · ⭐ Star the repo if it helps you level up

</div>

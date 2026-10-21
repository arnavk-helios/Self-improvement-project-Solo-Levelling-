// The seed file: it puts the game's starting content into the database.
// Run it with: npx prisma db seed
// It is safe to run many times (it updates instead of duplicating).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The 14 daily quests from Section 13 of the PDF (they add up to 365 XP)
const quests = [
  { slug: "wake-on-time", name: "Wake up on time", xp: 20, category: "routine" },
  { slug: "morning-sunlight-water", name: "Morning sunlight + water", xp: 15, category: "routine" },
  { slug: "scheduled-workout", name: "Complete scheduled workout", xp: 50, category: "fitness" },
  { slug: "mobility-session", name: "Mobility / stretch session", xp: 20, category: "fitness" },
  { slug: "water-3l", name: "Drink 3L+ water", xp: 20, category: "nutrition" },
  { slug: "protein-target", name: "Hit protein target", xp: 25, category: "nutrition" },
  { slug: "read-20-pages", name: "Read 20+ pages", xp: 30, category: "mind" },
  { slug: "deep-work-block", name: "Deep work block completed", xp: 40, category: "mind" },
  { slug: "skincare-am-pm", name: "Skincare AM + PM", xp: 15, category: "looks" },
  { slug: "no-social-3h", name: "No social media for 3 hrs", xp: 40, category: "mind" },
  { slug: "journal-3-lines", name: "Journal 3+ lines", xp: 15, category: "mind" },
  { slug: "sleep-7-5h", name: "Sleep 7.5+ hours", xp: 50, category: "recovery" },
  { slug: "cold-shower-breathwork", name: "Cold shower or breathwork", xp: 15, category: "recovery" },
  { slug: "grooming-check", name: "Grooming check (hair/beard/nails)", xp: 10, category: "looks" },
];

// Section 14 of the PDF.
// NOTE: these numbers make D-Rank reachable in ~4 perfect days, not "2 weeks".
// We will rebalance later. That is why they live in the database!
const ranks = [
  { name: "E", minXp: 0, sortOrder: 1, description: "Day 1. System initialized. Just show up." },
  { name: "D", minXp: 1500, sortOrder: 2, description: "First stretch of consistent quest completion." },
  { name: "C", minXp: 4000, sortOrder: 3, description: "First visible habit stability." },
  { name: "B", minXp: 9000, sortOrder: 4, description: "Physical and routine changes become visible to others." },
  { name: "A", minXp: 18000, sortOrder: 5, description: "Habits run largely on autopilot." },
  { name: "S", minXp: 30000, sortOrder: 6, description: "Sustained transformation across all stats." },
  { name: "SS", minXp: 45000, sortOrder: 7, description: "Elite consistency. Near-zero missed days." },
  { name: "SSS", minXp: 65000, sortOrder: 8, description: "Mastery-level discipline." },
  { name: "Monarch", minXp: 90000, sortOrder: 9, description: "The System is simply who you are." },
];

// Section 17 of the PDF.
// The PDF gives no XP for boss battles, so 100 is a placeholder we can change.
const bosses = [
  { slug: "zero-sugar-48h", name: "48-Hour Zero Sugar Challenge", focus: "Nutrition discipline" },
  { slug: "no-social-weekend", name: "No Social Media Weekend", focus: "Dopamine reset" },
  { slug: "5am-three-days", name: "5 AM Wake-Up, 3 Days Straight", focus: "Sleep discipline / routine" },
  { slug: "100-pushups", name: "100 Push-Ups Spread Across the Day", focus: "Physical endurance" },
  { slug: "cold-shower-week", name: "Cold Shower Every Day This Week", focus: "Mental toughness" },
  { slug: "read-100-pages", name: "Read 100 Pages in One Week", focus: "Focus / consumption habits" },
  { slug: "talk-to-3-people", name: "Speak to 3 New People This Week", focus: "Social presence" },
  { slug: "meal-prep-week", name: "Meal Prep Every Meal. Zero Takeout", focus: "Nutrition consistency" },
  { slug: "10k-steps-week", name: "10,000 Steps Every Day This Week", focus: "Baseline activity" },
  { slug: "digital-sabbath", name: "Full Digital Sabbath (One Day Offline)", focus: "Reset & reflection" },
];

// Section 15 of the PDF. This is a STARTER set (about 40 of the 97).
// We will add the rest later.
const achievements = [
  { slug: "first-workout", name: "First Workout", xp: 25 },
  { slug: "streak-7", name: "7-Day Streak", xp: 100 },
  { slug: "streak-30", name: "30-Day Streak", xp: 400 },
  { slug: "streak-90", name: "90-Day Streak", xp: 1000 },
  { slug: "pushups-100", name: "100 Pushups (total in a day)", xp: 30 },
  { slug: "perfect-week", name: "Perfect Week (all quests)", xp: 150 },
  { slug: "no-sugar-week", name: "No Sugar Week", xp: 80 },
  { slug: "first-book", name: "Finished First Book", xp: 100 },
  { slug: "new-pr", name: "Hit a New PR", xp: 50 },
  { slug: "stretch-master-7", name: "Daily Stretch Master (7 days)", xp: 60 },
  { slug: "skincare-champion-30", name: "Skin Care Champion (30 days)", xp: 120 },
  { slug: "5am-warrior-7", name: "5 AM Warrior (7 days)", xp: 80 },
  { slug: "first-deload", name: "First Deload Completed", xp: 40 },
  { slug: "steps-10k", name: "10,000 Steps Day", xp: 20 },
  { slug: "meal-prep-sunday", name: "Meal Prep Sunday", xp: 30 },
  { slug: "cold-shower-5", name: "Cold Shower Streak (5 days)", xp: 50 },
  { slug: "digital-detox-weekend", name: "Digital Detox Weekend", xp: 60 },
  { slug: "first-monthly-eval", name: "First Monthly Evaluation Done", xp: 50 },
  { slug: "rank-up-d", name: "Rank Up: D", xp: 100 },
  { slug: "rank-up-c", name: "Rank Up: C", xp: 150 },
  { slug: "rank-up-b", name: "Rank Up: B", xp: 200 },
  { slug: "rank-up-a", name: "Rank Up: A", xp: 300 },
  { slug: "rank-up-s", name: "Rank Up: S", xp: 400 },
  { slug: "rank-up-ss", name: "Rank Up: SS", xp: 500 },
  { slug: "rank-up-sss", name: "Rank Up: SSS", xp: 600 },
  { slug: "rank-up-monarch", name: "Rank Up: Monarch", xp: 1000 },
  { slug: "first-5k", name: "First 5K Walk/Run", xp: 50 },
  { slug: "first-pullup", name: "First Full Bodyweight Pull-Up", xp: 80 },
  { slug: "first-boss", name: "First Boss Battle Cleared", xp: 80 },
  { slug: "ten-bosses", name: "10 Boss Battles Cleared", xp: 300 },
  { slug: "journal-30", name: "Journaled 30 Days Straight", xp: 120 },
  { slug: "read-5-books", name: "Read 5 Books", xp: 250 },
  { slug: "read-10-books", name: "Read 10 Books", xp: 500 },
  { slug: "meditate-30", name: "Meditated 30 Days Straight", xp: 150 },
  { slug: "zero-missed-workouts-month", name: "Zero Missed Workouts (Month)", xp: 250 },
  { slug: "first-progress-photos", name: "First Progress Photo Set", xp: 30 },
  { slug: "recovered-missed-day", name: "Recovered From a Missed Day (Rule 1)", xp: 30 },
  { slug: "6-month-anniversary", name: "6-Month System Anniversary", xp: 500 },
  { slug: "1-year-anniversary", name: "1-Year System Anniversary", xp: 1000 },
  { slug: "perfect-month", name: "Perfect Month (Zero Misses)", xp: 800 },
];

async function main() {
  for (const [i, q] of quests.entries()) {
    await prisma.quest.upsert({
      where: { slug: q.slug },
      update: { ...q, sortOrder: i },
      create: { ...q, sortOrder: i },
    });
  }

  for (const r of ranks) {
    await prisma.rank.upsert({
      where: { name: r.name },
      update: r,
      create: r,
    });
  }

  for (const b of bosses) {
    await prisma.bossBattle.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  console.log(
    `Seeded ${quests.length} quests, ${ranks.length} ranks, ${bosses.length} bosses, ${achievements.length} achievements.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// A practice run of the XP engine, with no screens needed.
// It makes a pretend user, completes three quests, tries one twice,
// then undoes one, and prints the XP and rank each time.
//
// Run it with:
//   npx tsx --env-file=.env scripts/try-engine.ts

import { prisma } from "../lib/prisma";
import { completeQuest, uncompleteQuest, getUserStats } from "../lib/xp";

async function showStats(userId: string, label: string) {
  const { totalXp, rank } = await getUserStats(userId);
  console.log(`\n${label}`);
  console.log(`  Total XP: ${totalXp}`);
  console.log(`  Rank: ${rank.current.name}`);
  if (rank.next) {
    console.log(`  Next rank: ${rank.next.name} at ${rank.next.minXp} XP`);
  }
  console.log(`  Progress bar: ${rank.percent}%`);
}

async function main() {
  // 1. A pretend user, wiped clean so we can run this again and again
  const user = await prisma.user.upsert({
    where: { email: "demo@monarch.local" },
    update: {},
    create: { email: "demo@monarch.local", name: "Demo Hunter" },
  });
  await prisma.xpEvent.deleteMany({ where: { userId: user.id } });
  await prisma.questLog.deleteMany({ where: { userId: user.id } });

  await showStats(user.id, "Start");

  // 2. Complete the first three quests
  const quests = await prisma.quest.findMany({
    orderBy: { sortOrder: "asc" },
    take: 3,
  });
  for (const quest of quests) {
    const result = await completeQuest(user.id, quest.id);
    console.log(`\nCompleted: ${quest.name} (+${result.xp} XP)`);
  }
  await showStats(user.id, "After 3 quests");

  // 3. Try the first quest again: no extra XP allowed
  const again = await completeQuest(user.id, quests[0].id);
  console.log(
    `\nTried "${quests[0].name}" a second time: ${
      again.completed ? "gave XP (bug!)" : "blocked, no extra XP"
    }`
  );

  // 4. Undo the workout quest
  const undone = await uncompleteQuest(user.id, quests[2].id);
  console.log(`Undid "${quests[2].name}": ${undone.undone ? "yes" : "no"}`);
  await showStats(user.id, "After undo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
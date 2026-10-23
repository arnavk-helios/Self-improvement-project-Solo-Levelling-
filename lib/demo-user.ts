// Until we build real login, everyone plays as one pretend player.
// This finds that player, or creates them the first time.

import { prisma } from "./prisma";

export async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: "demo@monarch.local" },
    update: {},
    create: { email: "demo@monarch.local", name: "Demo Hunter" },
  });
}
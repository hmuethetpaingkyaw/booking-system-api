import "dotenv/config";
import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "../src/lib/prisma";

const seedUsers = [
  { name: "admin1", role: UserRole.admin, password: "admin123" },
  { name: "owner1", role: UserRole.owner, password: "owner123" },
  { name: "user1", role: UserRole.user, password: "user123" },
  { name: "user2", role: UserRole.user, password: "user123" },
];

const buildSeedBookings = (usersByName: Record<string, { id: number }>) => {
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);

  return [
    {
      userId: usersByName.user1.id,
      startTime: new Date(base.getTime()),
      endTime: new Date(base.getTime() + oneHour),
    },
    {
      userId: usersByName.owner1.id,
      startTime: new Date(base.getTime() + oneHour),
      endTime: new Date(base.getTime() + oneHour * 2),
    },
    {
      userId: usersByName.user2.id,
      startTime: new Date(base.getTime() + oneHour * 2),
      endTime: new Date(base.getTime() + oneHour * 3),
    },
  ];
};

async function main() {
  const usersByName: Record<string, { id: number }> = {};

  for (const seedUser of seedUsers) {
    const passwordHash = await hash(seedUser.password, 10);
    const user = await prisma.user.upsert({
      where: { name: seedUser.name },
      update: {
        role: seedUser.role,
        passwordHash,
      },
      create: {
        name: seedUser.name,
        role: seedUser.role,
        passwordHash,
      },
      select: { id: true, name: true },
    });

    usersByName[user.name] = { id: user.id };
  }

  await prisma.booking.deleteMany();
  await prisma.booking.createMany({
    data: buildSeedBookings(usersByName),
  });

  console.log("Seed complete.");
  console.log("Users:");
  for (const seedUser of seedUsers) {
    console.log(`- ${seedUser.name} / ${seedUser.password} (${seedUser.role})`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("----- REGISTERED USERS -----");
  users.forEach(u => console.log(`${u.email} -> ${u.role}`));
  console.log("----------------------------");
}

main().finally(() => prisma.$disconnect());

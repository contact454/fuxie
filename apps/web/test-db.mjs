import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();
async function main() {
    const item = await prisma.vocabularyItem.findFirst();
    console.log(JSON.stringify(item));
}
main().finally(() => prisma.$disconnect());

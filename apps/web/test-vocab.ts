import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const items = await prisma.vocabularyItem.findMany({ take: 3 })
    console.log(JSON.stringify(items, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())

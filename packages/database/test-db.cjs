const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const item = await prisma.vocabularyItem.findFirst()
    console.log(item)
}

main().finally(() => prisma.$disconnect())

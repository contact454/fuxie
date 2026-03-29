import { PrismaClient } from '../../../apps/web/generated/prisma'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

async function createNeonAdapter() {
    const { PrismaNeon } = await import('@prisma/adapter-neon')
    return new PrismaNeon({
        connectionString: process.env.DATABASE_URL!,
    })
}

function createPrismaClient(): PrismaClient {
    const databaseUrl = process.env.DATABASE_URL
    const isNeonUrl = databaseUrl?.includes('.neon.tech')

    const logConfig = process.env.NODE_ENV === 'development'
        ? ['query' as const, 'warn' as const, 'error' as const]
        : ['error' as const]

    // For Neon: use the serverless HTTP adapter (no TCP, no cold starts)
    // For local dev: use standard Prisma TCP connection
    if (isNeonUrl && databaseUrl) {
        // Synchronous init with lazy adapter — Prisma 7.x supports { connectionString } directly
        const { PrismaNeon } = require('@prisma/adapter-neon')
        const adapter = new PrismaNeon({ connectionString: databaseUrl })
        return new PrismaClient({ adapter, log: logConfig })
    }

    return new PrismaClient({ log: logConfig })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export { PrismaClient }
export * from '../../../apps/web/generated/prisma'

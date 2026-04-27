import { cache } from 'react'
import { prisma } from '@fuxie/database'
import { cacheWrap } from '@/lib/cache/redis'

const DB_USER_CACHE_TTL_SECONDS = 15

export const getDbUserByFirebaseUid = cache(async (firebaseUid: string) => {
    return cacheWrap(
        `auth:db-user:${encodeURIComponent(firebaseUid)}`,
        DB_USER_CACHE_TTL_SECONDS,
        () => prisma.user.findUnique({
            where: { firebaseUid },
            select: { id: true },
        }),
    )
})

import { cache } from 'react'
import { prisma } from '@fuxie/database'

export const getDbUserByFirebaseUid = cache(async (firebaseUid: string) => {
    return prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
    })
})

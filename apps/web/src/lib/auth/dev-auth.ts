import { cookies } from 'next/headers'
import type { UserRole } from '@fuxie/database'

export const DEV_AUTH_COOKIE = 'fuxie-dev-user'

export type DevAuthRole = 'learner' | 'teacher' | 'admin'

export type DevAuthUser = {
    firebaseUid: string
    email: string
    role: UserRole
}

const DEV_USERS: Record<DevAuthRole, DevAuthUser> = {
    learner: {
        firebaseUid: 'dev-learner',
        email: 'learner@fuxie.local',
        role: 'LEARNER',
    },
    teacher: {
        firebaseUid: 'dev-teacher',
        email: 'teacher@fuxie.local',
        role: 'TEACHER',
    },
    admin: {
        firebaseUid: 'dev-admin',
        email: 'admin@fuxie.local',
        role: 'ADMIN',
    },
}

export function isDevAuthEnabled() {
    return process.env.NODE_ENV !== 'production' && process.env.FUXIE_DEV_AUTH_ENABLED === 'true'
}

export function getDevAuthUser(value?: string | null): DevAuthUser | null {
    if (!isDevAuthEnabled()) {
        return null
    }

    const role = normalizeDevRole(value)
    return role ? DEV_USERS[role] : null
}

export async function getDevAuthUserFromCookies() {
    if (!isDevAuthEnabled()) {
        return null
    }

    const cookieStore = await cookies()
    return getDevAuthUser(cookieStore.get(DEV_AUTH_COOKIE)?.value)
}

export function getDevAuthUsers() {
    return DEV_USERS
}

export function normalizeDevRole(value?: string | null): DevAuthRole | null {
    if (value === 'learner' || value === 'teacher' || value === 'admin') {
        return value
    }

    return null
}

import { redirect } from 'next/navigation'

import { SituationRoleplayClient } from '@/components/gameplay/SituationRoleplayClient'
import { getServerUser } from '@/lib/auth/server-auth'
import { getRoleplayScenarioById } from '@/lib/gamification/lesson-gameplay-expansion'

export const metadata = {
    title: 'Fuxie - German Situation Roleplay',
    description: 'Bounded AI roleplay scenarios for German speaking practice.',
}

export default async function SpeakingRoleplayPage({
    searchParams,
}: {
    searchParams?: Promise<{ scenario?: string; level?: string }>
}) {
    const user = await getServerUser()
    if (!user) redirect('/login')

    const params = await searchParams
    const scenario = getRoleplayScenarioById(params?.scenario)
    const level = params?.level && /^[ABC][12]$/.test(params.level) ? params.level : scenario.cefrLevel

    return <SituationRoleplayClient scenario={scenario} level={level} />
}

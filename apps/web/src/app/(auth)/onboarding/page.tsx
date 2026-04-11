import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export const metadata = {
    title: 'Fuxie 🦊 — Willkommen!',
    description: 'Kiểm tra trình độ tiếng Đức và bắt đầu hành trình học tập',
}

export default async function OnboardingPage() {
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    // Check if onboarding already completed
    const profile = await prisma.userProfile.findUnique({
        where: { userId: serverUser.userId },
        select: { onboardingCompleted: true },
    })

    if (profile?.onboardingCompleted) {
        redirect('/dashboard')
    }

    return <OnboardingWizard />
}

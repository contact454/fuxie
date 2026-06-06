import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/auth/server-auth'
import { prisma } from '@fuxie/database'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { OnboardingWizardDynamic } from '@/components/onboarding/OnboardingWizardDynamic'

export const metadata = {
    title: 'Fuxie 🦊 — Willkommen!',
    description: 'Kiểm tra trình độ tiếng Đức và bắt đầu hành trình học tập',
}

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ state?: string; fixture?: string }> }) {
    const visualParams = await searchParams
    const isVisualQa = visualParams.fixture === 'visual-qa'

    if (!isVisualQa) {
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
    }

    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <OnboardingWizardDynamic fixture={visualParams.fixture} state={visualParams.state} />
        </NextIntlClientProvider>
    )
}

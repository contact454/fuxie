'use client'

import dynamic from 'next/dynamic'

const OnboardingWizard = dynamic(() => import('./OnboardingWizard').then(mod => mod.OnboardingWizard), {
    ssr: false,
    loading: () => (
        <div className="min-h-[100dvh] bg-gradient-to-br from-[#F3FBFF] via-white to-blue-50 flex flex-col">
            <div className="h-1.5 bg-gray-100">
                <div className="h-full w-1/4 bg-gradient-to-r from-[#60A8E4] to-[#3C78A8]" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md w-full">
                    <div className="mx-auto mb-6 h-[140px] w-[140px] rounded-full bg-white shadow-sm animate-pulse" />
                    <div className="mx-auto h-9 w-72 rounded-xl bg-white shadow-sm animate-pulse" />
                    <div className="mx-auto mt-4 h-5 w-80 max-w-full rounded bg-white shadow-sm animate-pulse" />
                    <div className="mx-auto mt-8 h-12 w-64 rounded-xl bg-[#CCE4F0] animate-pulse" />
                </div>
            </div>
        </div>
    ),
})

export function OnboardingWizardDynamic({ fixture, state }: { fixture?: string; state?: string }) {
    return <OnboardingWizard fixture={fixture} state={state} />
}

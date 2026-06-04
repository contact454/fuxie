import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
    const t = await getTranslations('NotFound')
    return (
        <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center animate-fade-in-up">
                {/* Mascot */}
                <div className="mb-6">
                    <Image
                        src="/mascot-3d/states/global/fuxie-global-fuxie-error-repair-helper.webp" // asset-registry-allow
                        alt={t('altMascot')}
                        width={120}
                        height={120}
                        className="mx-auto object-contain"
                    />
                </div>

                {/* Error Code */}
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuxie-primary to-fuxie-accent mb-3">
                    404
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {t('title')}
                </h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    {t('message')}
                </p>

                <div className="flex gap-3">
                    <Link
                        href="/dashboard"
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-fuxie-primary to-[#3C78A8] text-white font-semibold text-sm hover:shadow-lg hover:shadow-sky-200 transition-all text-center"
                    >
                        {t('ctaDashboard')}
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all text-center"
                    >
                        {t('ctaHome')}
                    </Link>
                </div>
            </div>
        </div>
    )
}

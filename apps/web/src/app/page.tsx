import Image from 'next/image'

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-fuxie-primary/10 to-fuxie-secondary/10">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Image src="/mascot/core/fuxie-core-happy-wave.png" alt="Fuxie" width={72} height={72} className="object-contain" />
                    <h1 className="text-6xl font-bold">Fuxie</h1>
                </div>
                <p className="text-xl text-gray-600 mb-8">
                    Học tiếng Đức thông minh — Dein schlauer Deutschlehrer
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((level) => (
                        <span
                            key={level}
                            className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-white bg-cefr-${level.toLowerCase()}`}
                        >
                            {level}
                        </span>
                    ))}
                </div>
                <p className="mt-8 text-sm text-gray-400">
                    Goethe · Telc · ÖSD
                </p>
            </div>
        </main>
    )
}

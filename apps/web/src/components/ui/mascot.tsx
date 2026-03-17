'use client'



interface MascotProps {
    variant:
    | 'wortschatz' | 'grammatik' | 'hoeren' | 'lesen' | 'schreiben' | 'sprechen'
    | 'correct' | 'wrong' | 'encouragement' | 'studying' | 'lightbulb' | 'graduation'
    | 'celebrate' | 'happy-wave' | 'sad-tears' | 'surprised' | 'thinking'
    | 'empty' | 'error' | 'loading' | 'welcome'
    | 'streak-fire' | 'streak-sick' | 'achievement' | 'daily-goal' | 'levelup' | 'perfect-score' | 'rankup' | 'xp-earned'
    | 'angry' | 'cool' | 'love' | 'sleepy'
    | 'landing' | 'onboarding'
    size?: number
    className?: string
    speechBubble?: string
}

const MASCOT_PATHS: Record<string, string> = {
    // Skills
    'wortschatz': '/mascot/skill/fuxie-skill-wortschatz.png',
    'grammatik': '/mascot/skill/fuxie-skill-grammatik.png',
    'hoeren': '/mascot/skill/fuxie-skill-hoeren.png',
    'lesen': '/mascot/skill/fuxie-skill-lesen.png',
    'schreiben': '/mascot/skill/fuxie-skill-schreiben.png',
    'sprechen': '/mascot/skill/fuxie-skill-sprechen.png',
    // Learn
    'correct': '/mascot/learn/fuxie-learn-correct.png',
    'wrong': '/mascot/learn/fuxie-learn-wrong.png',
    'encouragement': '/mascot/learn/fuxie-learn-encouragement.png',
    'studying': '/mascot/learn/fuxie-learn-studying.png',
    'lightbulb': '/mascot/learn/fuxie-learn-lightbulb.png',
    'graduation': '/mascot/learn/fuxie-learn-graduation.png',
    // Core
    'celebrate': '/mascot/core/fuxie-core-celebrate.png',
    'happy-wave': '/mascot/core/fuxie-core-happy-wave.png',
    'sad-tears': '/mascot/core/fuxie-core-sad-tears.png',
    'surprised': '/mascot/core/fuxie-core-surprised.png',
    'thinking': '/mascot/core/fuxie-core-thinking.png',
    // State
    'empty': '/mascot/state/fuxie-state-empty.png',
    'error': '/mascot/state/fuxie-state-error.png',
    'loading': '/mascot/state/fuxie-state-loading.png',
    'welcome': '/mascot/state/fuxie-state-welcome.png',
    // Game
    'streak-fire': '/mascot/game/fuxie-game-streak-fire.png',
    'streak-sick': '/mascot/game/fuxie-game-streak-sick.png',
    'achievement': '/mascot/game/fuxie-game-achievement.png',
    'daily-goal': '/mascot/game/fuxie-game-daily-goal.png',
    'levelup': '/mascot/game/fuxie-game-levelup.png',
    'perfect-score': '/mascot/game/fuxie-game-perfect-score.png',
    'rankup': '/mascot/game/fuxie-game-rankup.png',
    'xp-earned': '/mascot/game/fuxie-game-xp-earned.png',
    // Sticker
    'angry': '/mascot/sticker/fuxie-sticker-angry.png',
    'cool': '/mascot/sticker/fuxie-sticker-cool.png',
    'love': '/mascot/sticker/fuxie-sticker-love.png',
    'sleepy': '/mascot/sticker/fuxie-sticker-sleepy.png',
    // Hero
    'landing': '/mascot/hero/fuxie-hero-landing.png',
    'onboarding': '/mascot/hero/fuxie-hero-onboarding.png',
}

/**
 * Fuxie mascot component — displays the blue fox mascot with optional speech bubble.
 * All 35 mascot variants are supported.
 */
export function Mascot({ variant, size = 80, className = '', speechBubble }: MascotProps) {
    const src = MASCOT_PATHS[variant]

    if (!src) return null

    return (
        <div className={`relative inline-flex items-end gap-2 ${className}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={`Fuxie ${variant}`}
                width={size}
                height={size}
                className="object-contain select-none"
                draggable={false}
            />
            {speechBubble && (
                <div
                    className="relative bg-white rounded-xl px-3 py-2 shadow-md border border-gray-100 text-sm text-gray-700 max-w-[200px]"
                    style={{ marginBottom: size * 0.3 }}
                >
                    <div className="absolute -left-2 bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent" />
                    {speechBubble}
                </div>
            )}
        </div>
    )
}

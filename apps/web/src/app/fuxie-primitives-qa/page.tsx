'use client'

import * as React from 'react'
import {
    PrimaryCta,
    IsoPlate,
    ScenePanel,
    WorldNode,
    OptionTile,
    RewardBurst,
    ProgressRing,
    AudioButton,
    StreakPill,
    TopBar,
    BottomNav
} from '@fuxie/ui/components'

export default function FuxiePrimitivesQaPage() {
    const [activeTab, setActiveTab] = React.useState<'world' | 'review' | 'profile'>('world')
    const [audioState, setAudioState] = React.useState<'idle' | 'playing' | 'recording'>('idle')

    // Chặn truy cập trên production
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            window.location.href = '/404'
        }
    }, [])

    return (
        <main
            data-route="fuxie-primitives-qa"
            data-slice="primitives"
            className="min-h-screen bg-slate-50 flex flex-col"
        >
            <TopBar
                username={"Fuxie Tester" /* // locale-allow */}
                streakCount={7}
                coinCount={150}
                gemCount={45}
                xpCount={300}
                avatarUrl=""
                onAvatarClick={() => alert('Profile Clicked' /* // locale-allow */)}
            />

            <div className="flex-1 p-[var(--fuxie-space-4)] max-w-lg mx-auto w-full flex flex-col gap-[var(--fuxie-space-5)]">
                
                {/* 1. PrimaryCta Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"1. PrimaryCta" /* // locale-allow */}</h2>
                    <div className="flex flex-wrap gap-[var(--fuxie-space-2)]">
                        <PrimaryCta variant="primary">{"Primary Action" /* // locale-allow */}</PrimaryCta>
                        <PrimaryCta variant="secondary">{"Secondary Action" /* // locale-allow */}</PrimaryCta>
                        <PrimaryCta variant="primary" disabled>{"Disabled Action" /* // locale-allow */}</PrimaryCta>
                    </div>
                </section>

                {/* 2. IsoPlate Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"2. IsoPlate" /* // locale-allow */}</h2>
                    <div className="flex gap-[var(--fuxie-space-2)]">
                        <IsoPlate
                            src="/reward-assets/optimized/fuxie-item-cefr-badge-a1-512.webp" // asset-registry-allow
                            alt={"A1 CEFR Badge" /* // locale-allow */}
                            width={80}
                            height={80}
                        />
                    </div>
                </section>

                {/* 3. ScenePanel Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"3. ScenePanel" /* // locale-allow */}</h2>
                    <ScenePanel>
                        <p className="text-[var(--fuxie-text-body)] text-[var(--fuxie-blue-900)] font-semibold">
                            {"Chào mừng đến với Fuxie UI Primitives QA Page! Panel này nổi bật trên bản đồ và hiển thị thông tin bài học của bạn." /* // locale-allow */}
                        </p>
                    </ScenePanel>
                </section>

                {/* 4. WorldNode Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"4. WorldNode" /* // locale-allow */}</h2>
                    <div className="flex gap-[var(--fuxie-space-3)] items-center">
                        <WorldNode state="locked" title={"Bài 1" /* // locale-allow */} nodeNumber={1} />
                        <WorldNode state="open" title={"Bài 2" /* // locale-allow */} nodeNumber={2} isPrimaryCta />
                        <WorldNode state="mastered" title={"Bài 3" /* // locale-allow */} nodeNumber={3} />
                    </div>
                </section>

                {/* 5. OptionTile Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"5. OptionTile" /* // locale-allow */}</h2>
                    <div className="flex flex-col gap-[var(--fuxie-space-2)]">
                        <OptionTile text={"Lựa chọn bình thường (Idle)" /* // locale-allow */} status="idle" />
                        <OptionTile text={"Đáp án hoàn toàn chính xác (Correct)" /* // locale-allow */} status="correct" />
                        <OptionTile text={"Đáp án không chính xác (Incorrect / Shaking)" /* // locale-allow */} status="incorrect" />
                    </div>
                </section>

                {/* 6. RewardBurst Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"6. RewardBurst" /* // locale-allow */}</h2>
                    <div className="flex justify-center p-[var(--fuxie-space-3)]">
                        <RewardBurst active>
                            <div className="w-12 h-12 bg-[var(--fuxie-action)] rounded-[var(--fuxie-radius-md)] flex items-center justify-center text-white font-bold shadow-md">
                                {"🎁" /* // locale-allow */}
                            </div>
                        </RewardBurst>
                    </div>
                </section>

                {/* 7. ProgressRing Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"7. ProgressRing" /* // locale-allow */}</h2>
                    <div className="flex gap-[var(--fuxie-space-4)]">
                        <ProgressRing value={35} size={44} />
                        <ProgressRing value={75} size={44} />
                        <ProgressRing value={100} size={44} />
                    </div>
                </section>

                {/* 8. AudioButton Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"8. AudioButton" /* // locale-allow */}</h2>
                    <div className="flex gap-[var(--fuxie-space-3)]">
                        <AudioButton
                            state={audioState}
                            ariaLabel={"Control audio" /* // locale-allow */}
                            onClick={() => {
                                if (audioState === 'idle') setAudioState('playing')
                                else if (audioState === 'playing') setAudioState('recording')
                                else setAudioState('idle')
                            }}
                        />
                        <span className="text-[var(--fuxie-text-caption)] text-slate-500 flex items-center">
                            {"Nhấp để đổi trạng thái: " /* // locale-allow */} {audioState}
                        </span>
                    </div>
                </section>

                {/* 9. StreakPill Section */}
                <section className="flex flex-col gap-[var(--fuxie-space-2)]">
                    <h2 className="text-[var(--fuxie-text-h2)] font-black text-[var(--fuxie-blue-900)]">{"9. StreakPill" /* // locale-allow */}</h2>
                    <div className="flex gap-[var(--fuxie-space-2)]">
                        <StreakPill count={0} />
                        <StreakPill count={12} />
                    </div>
                </section>

            </div>

            <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        </main>
    )
}

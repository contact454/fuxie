'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { playSound } from '@/hooks/use-audio-player'
import { ExerciseProgress } from './exercise-progress'
import { ExerciseResults } from './exercise-results'
import { BottomFeedback } from './bottom-feedback'
import { IntroSlide } from './intro-slide'
import { useExerciseTimer } from '@/hooks/use-exercise-timer'
import { useSubmitExercise } from '@/hooks/use-submit-exercise'
import type { ExerciseAnswer } from '@/hooks/use-submit-exercise'
import {
    FuxieCoach,
    GameplayFeedbackMoment,
    QuestCheckpointRail,
    RewardPreview,
} from '@/components/gamification/quest-visuals'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
    buildVocabularyQuestEpisode,
    getVocabularyQuestCheckpoint,
} from '@/lib/gamification/vocabulary-quest-episode'
import { getFirstSessionNextStep } from '@/lib/gamification/lesson-gameplay-expansion'
import { Mascot } from '@/components/ui/mascot'
import { FuxieBadge, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import {
    exerciseAudioButtonClass,
    exerciseCenterStageClass,
    exerciseInlineAudioClass,
    exerciseOptionClass,
    exercisePrimaryActionClass,
    exercisePromptImageClass,
    exerciseScreenClass,
    exerciseSecondaryActionClass,
    exerciseStageInnerClass,
} from './exercise-ui'

interface MixedQuestion {
    id: string
    exerciseComponent: 'intro' | 'mc'
    type: string
    wordId: string
    word: string
    meaningNative: string
    prompt?: string
    promptImage?: string | null
    promptAudio?: string | null
    options?: string[]
    imageUrl?: string | null
    audioUrl?: string | null
    exampleSentence1?: string | null
    exampleTranslation1?: string | null
}

interface MixedExerciseProps {
    questions: MixedQuestion[]
    cefrLevel: string
    themeName: string
    themeSlug: string
    nextEpisodeHref?: string
    onExit: () => void
    onComplete: (results: unknown) => void
}

export function MixedExercise({ questions, cefrLevel, themeName: _themeName, themeSlug, nextEpisodeHref, onExit, onComplete: _onComplete }: MixedExerciseProps) {
    const [activeQuestions, setActiveQuestions] = useState([...questions])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [isRevealed, setIsRevealed] = useState(false)
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
    const [answers, setAnswers] = useState<ExerciseAnswer[]>([])
    const [hasStarted, setHasStarted] = useState(false)
    const trackedCheckpoints = useRef<Set<string>>(new Set())
    const completionTracked = useRef(false)
    
    // Heart System (Gamification)
    const MAX_HEARTS = 5
    const [hearts, setHearts] = useState(MAX_HEARTS)
    const [gameOver, setGameOver] = useState(false)

    const { timer, stopTimer, resetTimer } = useExerciseTimer()
    const questEpisode = useMemo(() => buildVocabularyQuestEpisode({
        themeSlug,
        themeName: _themeName || themeSlug,
        cefrLevel,
        questionCount: questions.length,
        nextEpisodeHref,
    }), [themeSlug, _themeName, cefrLevel, questions.length, nextEpisodeHref])
    const activeCheckpoint = getVocabularyQuestCheckpoint({
        episode: questEpisode,
        currentIndex,
    })
    const activeCheckpointIndex = questEpisode.checkpoints.findIndex((checkpoint) => checkpoint.id === activeCheckpoint.id)
    const completedCheckpointIds = questEpisode.checkpoints
        .slice(0, Math.max(0, activeCheckpointIndex))
        .map((checkpoint) => checkpoint.id)
    const { submitResult, phase, submitAnswers, resetSubmit } = useSubmitExercise({
        exerciseType: 'mixed',
        themeSlug,
        cefrLevel,
        xpPerCorrect: 10,
        questEpisode,
    })

    const question = activeQuestions[currentIndex]

    // Audio auto play for MC audio variant
    useEffect(() => {
        if (question?.exerciseComponent === 'mc' && question.type === 'audio_to_word' && question.promptAudio) {
            playSound(question.promptAudio)
        }
    }, [currentIndex, question])

    useEffect(() => {
        if (!hasStarted) return
        if (trackedCheckpoints.current.has(activeCheckpoint.id)) return
        trackedCheckpoints.current.add(activeCheckpoint.id)
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_checkpoint_reached',
            source: 'vocabulary.quest_episode.checkpoint',
            actionId: questEpisode.episodeId,
            actionType: 'vocabulary_practice',
            level: cefrLevel,
            skill: 'WORTSCHATZ',
            metadata: {
                episodeId: questEpisode.episodeId,
                themeSlug,
                cefrLevel,
                checkpointId: activeCheckpoint.id,
                questionCount: questions.length,
            },
        })
    }, [activeCheckpoint.id, cefrLevel, hasStarted, questEpisode.episodeId, questions.length, themeSlug])

    useEffect(() => {
        if (phase !== 'results' || !submitResult?.questEpisodeReceipt || completionTracked.current) return
        completionTracked.current = true
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_completed',
            source: 'vocabulary.quest_episode.completed',
            actionId: questEpisode.episodeId,
            actionType: 'vocabulary_practice',
            level: cefrLevel,
            skill: 'WORTSCHATZ',
            metadata: {
                episodeId: questEpisode.episodeId,
                themeSlug,
                cefrLevel,
                checkpointId: 'lock_in',
                questionCount: submitResult.totalQuestions,
                accuracyBand: submitResult.questEpisodeReceipt.accuracyBand,
            },
        })
    }, [cefrLevel, phase, questEpisode.episodeId, submitResult, themeSlug])

    const startEpisode = useCallback(() => {
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
        setHasStarted(true)
        resetTimer()
        trackClientAnalyticsEvent({
            eventName: 'quest_episode_started',
            source: 'vocabulary.quest_episode.started',
            actionId: questEpisode.episodeId,
            actionType: 'vocabulary_practice',
            level: cefrLevel,
            skill: 'WORTSCHATZ',
            metadata: {
                episodeId: questEpisode.episodeId,
                themeSlug,
                cefrLevel,
                checkpointId: 'discover',
                questionCount: questions.length,
            },
        })
    }, [cefrLevel, questEpisode.episodeId, questions.length, resetTimer, themeSlug])

    const handleSelect = useCallback((option: string) => {
        if (isRevealed || !question) return
        setSelectedAnswer(option)
        setIsRevealed(true)

        const correctAnswer = question.type === 'de_to_native'
            ? question.meaningNative
            : question.word  // native_to_de, image_to_word, audio_to_word

        const correct = option === correctAnswer
        setIsCorrect(correct)

        const newAnswers: ExerciseAnswer[] = [...answers, {
            questionId: question.id,
            answer: option,
            correctAnswer,
            wordId: question.wordId,
            questionType: question.type,
        }]
        setAnswers(newAnswers)

        // Phạt nếu Sai
        if (!correct) {
            const nextHearts = hearts - 1
            setHearts(nextHearts)
            if (nextHearts <= 0) {
                // Hết máu -> Game Over sau vài giây
            } else {
                // Đẩy xuống cuối bài
                setActiveQuestions(prev => [...prev, { ...question, id: question.id + '_retry' }])
            }
        }
    }, [isRevealed, answers, question, hearts])

    const handleContinue = useCallback(() => {
        if (hearts <= 0) {
            setGameOver(true)
            stopTimer()
            return
        }

        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(i => i + 1)
            setSelectedAnswer(null)
            setIsRevealed(false)
            setIsCorrect(null)
        } else {
            // Hoàn thành
            stopTimer()
            submitAnswers(answers, timer)
        }
    }, [currentIndex, activeQuestions.length, stopTimer, submitAnswers, answers, timer, hearts])

    // Lặp lại nếu Retry
    const handleRetry = () => {
        setActiveQuestions([...questions])
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setIsRevealed(false)
        setIsCorrect(null)
        setAnswers([])
        setHearts(MAX_HEARTS)
        setGameOver(false)
        setHasStarted(false)
        trackedCheckpoints.current = new Set()
        completionTracked.current = false
        resetSubmit()
        resetTimer()
    }

    if (!hasStarted) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-[#F3FBFF] px-4 py-8">
                <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(60,120,168,0.16)] ring-1 ring-[#CCE4F0]/80">
                    <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="min-w-0 p-5 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <FuxieBadge tone="brand" className="normal-case tracking-normal">
                                    Vocabulary Episode
                                </FuxieBadge>
                                <FuxieBadge tone="neutral" className="normal-case tracking-normal">
                                    {cefrLevel} · mixed
                                </FuxieBadge>
                            </div>
                            <p className="text-sm font-black uppercase text-text-brand">Quest briefing</p>
                            <h1 className="mt-2 text-3xl font-black leading-tight text-text-primary sm:text-4xl">
                                {_themeName || themeSlug}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-text-brand sm:text-base">
                                {questEpisode.objective} Vượt qua từng trạm gác để biến đợt tập luyện thành một hành trình thú vị.
                            </p>

                            <div className="mt-5 rounded-2xl bg-[#F3FBFF] p-4 ring-1 ring-[#CCE4F0]/70">
                                <RewardPreview rewards={questEpisode.rewardPreview} />
                            </div>

                            <QuestCheckpointRail
                                checkpoints={questEpisode.checkpoints}
                                activeId={questEpisode.checkpoints[0]?.id ?? activeCheckpoint.id}
                                label="Mini path"
                                className="mt-5 bg-[#F8FCFF]"
                            />

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button type="button" onClick={startEpisode} className={fuxieButtonClass('primary', 'lg', 'w-full sm:w-auto')}>
                                    Bat dau episode
                                </button>
                                <button type="button" onClick={onExit} className={fuxieButtonClass('ghost', 'lg', 'w-full sm:w-auto')}>
                                    Ve tong quan
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-[#CCE4F0]/70 bg-[#F3FBFF] p-5 lg:border-l lg:border-t-0">
                            <FuxieCoach
                                role="coach"
                                eyebrow="Episode v1"
                                title="Hoc theo tung checkpoint"
                                message="Phần thưởng chỉ được trao khi em thực sự hoàn thành thử thách."
                                className="bg-white"
                            />
                            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-white">
                                <GameplayFeedbackMoment
                                    tone="focus"
                                    title={`${questions.length} màn hình, ${questEpisode.checkpoints.length} checkpoint`}
                                    message="Mỗi checkpoint cho em một việc nhỏ: nhận diện, gọi lại, rồi khóa từ bằng kết quả submit."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (gameOver) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7FBFD] p-6 text-center animate-fade-in">
                <Mascot variant="encourage" size={120} className="mb-6 grayscale mix-blend-multiply" />
                <h1 className="mb-2 text-4xl font-black text-slate-950">Hết Mạng (Game Over)</h1>
                <p className="mb-10 text-lg font-semibold text-slate-500">Đừng bỏ cuộc, hãy làm lại thật cẩn thận nhé!</p>
                <div className="flex gap-4 w-full max-w-sm flex-col">
                    <button onClick={handleRetry} className={exercisePrimaryActionClass(false, 'text-base uppercase')}>
                        Thử lại ngay
                    </button>
                    <button onClick={onExit} className={exerciseSecondaryActionClass(false, 'text-base uppercase')}>
                        Về trang chủ
                    </button>
                </div>
            </div>
        )
    }

    if (phase === 'results' && submitResult) {
        const nextStep = themeSlug === 'a1-person'
            ? getFirstSessionNextStep('boss-review')
            : null

        return (
            <ExerciseResults
                totalQuestions={submitResult.totalQuestions}
                correctCount={submitResult.correctCount}
                accuracy={submitResult.accuracy}
                xpEarned={submitResult.xpEarned}
                fucoinEarned={submitResult.fucoinEarned}
                walletBalance={submitResult.walletBalance}
                fucoinDuplicate={submitResult.fucoinDuplicate}
                fucoinIntended={submitResult.fucoinIntended}
                fucoinDailyCap={submitResult.fucoinDailyCap}
                fucoinDailyEarned={submitResult.fucoinDailyEarned}
                fucoinDailyRemaining={submitResult.fucoinDailyRemaining}
                fucoinCapReached={submitResult.fucoinCapReached}
                streak={submitResult.streak}
                timeTaken={timer}
                results={submitResult.results}
                onRetry={handleRetry}
                onNewTheme={onExit}
                questEpisodeReceipt={submitResult.questEpisodeReceipt}
                nextEpisodeHref={submitResult.nextEpisodeHref}
                gameplayNextStep={nextStep
                    ? {
                        label: `Tiep theo: ${nextStep.title}`,
                        href: nextStep.href.replace('level=A1', `level=${cefrLevel}`),
                        reason: 'Boss Review da gom lai chu de; buoc tiep theo la dung tu trong mot tinh huong speaking ngan.',
                        stepId: nextStep.id,
                    }
                    : undefined}
            />
        )
    }

    if (!question) return null

    // Helper render Header (Hiển thị Progress + Mạng)
    const renderHeader = () => (
        <div className="flex flex-col">
            <div className="flex justify-center bg-white/90 py-2 shadow-sm shadow-sky-900/5">
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                        <svg key={i} className={`h-8 w-8 transition-colors ${i < hearts ? 'text-fuxie-accent' : 'text-fuxie-sky-200'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    ))}
                </div>
            </div>
            <ExerciseProgress current={currentIndex + 1} total={activeQuestions.length} onClose={onExit} timer={timer} cefrLevel={cefrLevel} />
            <div className="bg-[#F3FBFF] px-4 py-2 ring-1 ring-[#CCE4F0]/70">
                <div className="mx-auto max-w-3xl">
                    <QuestCheckpointRail
                        checkpoints={questEpisode.checkpoints}
                        activeId={activeCheckpoint.id}
                        completedIds={completedCheckpointIds}
                        label={`${Math.max(0, activeQuestions.length - currentIndex - 1)} con lai`}
                        compact
                    />
                </div>
            </div>
        </div>
    )

    // Render INTRO SLIDE
    if (question.exerciseComponent === 'intro') {
        return (
            <div className={exerciseScreenClass}>
                {renderHeader()}
                <div className="flex-1 flex overflow-y-auto">
                    <IntroSlide
                        word={question.word}
                        meaningNative={question.meaningNative}
                        imageUrl={question.imageUrl ?? null}
                        audioUrl={question.audioUrl ?? null}
                        onContinue={handleContinue}
                    />
                </div>
            </div>
        )
    }

    // Render MC SLIDE (Multiple Choice)
    const getQuestionLabel = () => {
        switch (question.type) {
            case 'de_to_native': return `Was bedeutet "${question.prompt}"?`
            case 'native_to_de': return `"${question.prompt}" auf Deutsch?`
            case 'image_to_word': return 'Welches Wort passt zum Bild?'
            case 'audio_to_word': return 'Welches Wort hörst du?'
            default: return question.prompt
        }
    }

    return (
        <div className={exerciseScreenClass}>
            {renderHeader()}
            <div className={exerciseCenterStageClass}>
                <div className={exerciseStageInnerClass}>
                    {/* Y hệt như MC-Exercise */}
                    <div className="text-center mb-8">
                        {question.type === 'image_to_word' && question.promptImage && (
                            <div className="mb-4 flex justify-center">
                                <Image src={question.promptImage} alt="Prompt" width={160} height={160} className={exercisePromptImageClass()} />
                            </div>
                        )}
                        {question.type === 'audio_to_word' && (
                            <button onClick={() => playSound(question.promptAudio)} className={exerciseAudioButtonClass()}>
                                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                </svg>
                            </button>
                        )}
                        {(question.type === 'de_to_native' || question.type === 'native_to_de') && (
                            <div className="mb-4">
                                <p className="text-4xl font-black leading-tight text-slate-950">{question.prompt}</p>
                                {question.type === 'de_to_native' && question.promptAudio && (
                                    <button onClick={() => playSound(question.promptAudio)} className={exerciseInlineAudioClass()}>🔊 Anhören</button>
                                )}
                            </div>
                        )}
                        <p className="text-xs font-bold uppercase text-slate-500">{getQuestionLabel()}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options?.map((option, i) => {
                            const isSelected = selectedAnswer === option

                            return (
                                <button key={i} onClick={() => handleSelect(option)} disabled={isRevealed} className={exerciseOptionClass({ selected: isSelected, revealed: isRevealed, className: 'py-5 text-lg' })}>
                                    {option}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {isRevealed && isCorrect !== null && (
                <>
                    <div className="mx-auto mb-24 w-full max-w-3xl px-4">
                        <GameplayFeedbackMoment
                            tone={isCorrect ? 'success' : 'retry'}
                            title={isCorrect ? 'Checkpoint signal: dung nhip' : 'Checkpoint signal: can khoa lai'}
                            message={isCorrect
                                ? 'Thành tích đã được lưu. Tiếp bước để giữ vững nhịp độ.'
                                : 'Cau nay se quay lai cuoi episode de em sua ngay khi tri nho con nong.'}
                            meta={activeCheckpoint.title}
                        />
                    </div>
                    <BottomFeedback
                        isCorrect={isCorrect}
                        correctAnswer={question.type === 'de_to_native' ? question.meaningNative : question.word}
                        onContinue={handleContinue}
                    />
                </>
            )}
        </div>
    )
}

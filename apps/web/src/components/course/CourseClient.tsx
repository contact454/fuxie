import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { MeasuredLink } from '@/components/performance/measured-link'
import { FuxieCoach, RewardPreview } from '@/components/gamification/quest-visuals'
import { getCefrBadgeAssetSrc } from '@/components/gamification/reward-assets'
import { FuxieBadge, FuxiePanel, fuxieButtonClass } from '@/components/ui/fuxie-ui'
import { FUXIE_UI_FRAMES, FUXIE_WORLD_PROPS } from '@/lib/mascot/fuxie-assets'
import {
    CoursePathNodes,
    type CourseNodeInput,
} from '@/components/course/course-path-nodes'
import type { CourseNodeState } from '@/components/course/course-node'
import { CourseModuleClusterHeader } from '@/components/course/course-module-cluster'
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock,
    GraduationCap,
    LockKeyhole,
    Trophy,
} from 'lucide-react'

interface SkillLink {
    skill: 'listening' | 'reading' | 'writing' | 'speaking'
    label: string
    labelNative: string
    href: string
    emoji: string
    count?: number
}

interface CourseData {
    courseTitle: string
    courseTitleDe: string
    courseDescription: string | null
    cefrLevel?: string
    modules: Array<{
        id: string
        slug: string
        title: string
        titleDe: string | null
        description: string | null
        sortOrder: number
        estimatedMinutes: number
        vocabThemes: Array<{
            slug: string
            name: string
            nameNative: string | null
            itemCount: number
            learnedCount: number
        }>
        grammarTopics: Array<{
            slug: string
            titleDe: string
            titleNative: string
            lessonCount: number
            completedCount: number
            totalStars: number
        }>
        skillLinks: SkillLink[]
        isUnlocked: boolean
    }>
}

const MODULE_GRADIENTS = [
    'from-[#60A8E4] to-[#3C78A8]',
    'from-[#54A8E4] to-[#2EC4B6]',
    'from-[#6CB4D8] to-[#3078B4]',
    'from-[#60A8D8] to-[#54A8E4]',
    'from-[#2EC4B6] to-[#3C78A8]',
    'from-[#9CCCE4] to-[#60A8E4]',
    'from-[#3C78A8] to-[#60A8E4]',
    'from-[#CCE4F0] to-[#54A8E4]',
]

const MODULE_EMOJIS = ['👋', '👨‍👩‍👧‍👦', '🏠', '🍽️', '⏰', '🚌', '💼', '🎯']

type CourseModule = CourseData['modules'][number]
type CourseModuleSummary = {
    mod: CourseModule
    idx: number
} & ReturnType<typeof getModuleProgress>

function getModuleProgress(mod: CourseModule) {
    const totalItems = mod.vocabThemes.reduce((s, t) => s + t.itemCount, 0) +
        mod.grammarTopics.reduce((s, t) => s + t.lessonCount, 0)
    const completedItems = mod.vocabThemes.reduce((s, t) => s + t.learnedCount, 0) +
        mod.grammarTopics.reduce((s, t) => s + t.completedCount, 0)
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    const isDone = progressPercent >= 100
    const primaryHref = mod.vocabThemes[0]
        ? '/vocabulary'
        : mod.grammarTopics[0]
            ? `/grammar/${mod.grammarTopics[0].slug}`
            : mod.skillLinks?.[0]?.href ?? '/course'

    return {
        totalItems,
        completedItems,
        progressPercent,
        isDone,
        primaryHref,
        primaryLabel: isDone ? 'Ôn lại module' : 'Bắt đầu bài tiếp theo',
    }
}

/**
 * Map a {@link CourseModuleSummary} to one of the 5 Course Path states from
 * design §I.2 / Req 4.1. Pure function so the unit test can pin the
 * derivation rule without rendering.
 *
 * Rules:
 *  - `mod.isUnlocked === false`              ⇒ `locked`
 *  - `progressPercent === 0` (unlocked)      ⇒ `available`
 *  - `0 < progressPercent < 100`             ⇒ `in-progress`
 *  - `progressPercent >= 100` && mastery     ⇒ `mastered`
 *  - `progressPercent >= 100` (no mastery)   ⇒ `completed`
 *
 * Mastery signal: avg grammar stars per lesson ≥ 2.5 across the module's
 * grammar lessons. When the module has no grammar lessons we fall back to
 * `completed` (the data model does not yet expose vocab mastery threshold).
 *
 * Validates: Requirements 4.1, 4.6, 4.7
 */
export function deriveCourseNodeState(summary: CourseModuleSummary): CourseNodeState {
    if (!summary.mod.isUnlocked) return 'locked'
    if (summary.progressPercent <= 0) return 'available'
    if (summary.progressPercent < 100) return 'in-progress'

    const totalLessons = summary.mod.grammarTopics.reduce(
        (sum, topic) => sum + topic.lessonCount,
        0,
    )
    const totalStars = summary.mod.grammarTopics.reduce(
        (sum, topic) => sum + topic.totalStars,
        0,
    )
    const avgStars = totalLessons > 0 ? totalStars / totalLessons : 0
    return avgStars >= 2.5 ? 'mastered' : 'completed'
}

/**
 * Build the `CourseNodeInput[]` payload for `<CoursePathNodes>`. Pure so the
 * snapshot test can drive it with hand-rolled summaries.
 *
 * Validates: Requirements 4.1, 4.5, 4.6, 4.7, 4.8, 4.9
 */
export function buildCourseNodeInputs(
    summaries: CourseModuleSummary[],
    cefrLevel: string,
): CourseNodeInput[] {
    return summaries.map((summary) => {
        const state = deriveCourseNodeState(summary)
        return {
            nodeId: summary.mod.slug,
            nodeNumber: summary.mod.sortOrder,
            title: summary.mod.titleDe ?? summary.mod.title,
            subtitle: summary.mod.description ?? undefined,
            state,
            href: summary.primaryHref,
            progress: state === 'in-progress' ? summary.progressPercent : undefined,
            lockedReason:
                state === 'locked'
                    ? `Hoàn thành module trước để mở "${summary.mod.titleDe ?? summary.mod.title}".`
                    : undefined,
            cefrLevel,
            clusterId: summary.mod.slug,
            analyticsFlow: 'course.path.node',
            analyticsSource: summary.mod.slug,
        }
    })
}

function CourseQuestPath({
    level,
    summaries,
    activeIndex,
    activeTitle,
    activeHref,
    activeMinutes,
}: {
    level: string
    summaries: CourseModuleSummary[]
    activeIndex: number
    activeTitle: string
    activeHref: string
    activeMinutes: number
}) {
    const t = useTranslations('Gamification')
    const pathPercent = summaries.length > 1
        ? Math.min(100, Math.round((activeIndex / (summaries.length - 1)) * 100))
        : 0
    const totalMinutes = summaries.reduce((sum, summary) => sum + summary.mod.estimatedMinutes, 0)
    const levelBadgeSrc = getCefrBadgeAssetSrc(level)

    return (
        <FuxiePanel variant="hero" className="mb-8 overflow-hidden">
            <div className="relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,168,228,0.38),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.86),transparent_30%)]" />
                <Image
                    src={FUXIE_UI_FRAMES.courseCheckpointNode}
                    alt=""
                    width={164}
                    height={164}
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 top-20 hidden h-36 w-36 object-contain opacity-[0.14] lg:block"
                />
                <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="min-w-0">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <FuxieBadge tone="brand" className="bg-white/75 shadow-sm ring-white/90">
                                <Image src={levelBadgeSrc} alt="" width={18} height={18} className="h-4 w-4 object-contain" />
                                <GraduationCap className="h-3.5 w-3.5 text-fuxie-reward" />
                                Lộ trình {level}
                            </FuxieBadge>
                            <FuxieBadge tone="brand" className="bg-white/75 shadow-sm ring-white/90">
                                <BookOpen className="h-3.5 w-3.5 text-text-brand" />
                                {summaries.length} module
                            </FuxieBadge>
                            <FuxieBadge tone="reward" className="bg-white/75 shadow-sm ring-white/90">
                                <Clock className="h-3.5 w-3.5 text-fuxie-energy" />
                                ~{Math.max(1, Math.round(totalMinutes / 60))}h
                            </FuxieBadge>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold uppercase text-text-brand">Learning path</p>
                                <h2 className="mt-2 text-3xl font-black leading-tight text-text-primary">
                                    {activeTitle}
                                </h2>
                                <p className="mt-2 max-w-2xl text-sm font-semibold text-text-brand">
                                    {t('coursePathDesc')}
                                </p>
                            </div>
                            <MeasuredLink
                                href={activeHref}
                                flow="course.path.primary"
                                source={`module-${activeIndex + 1}`}
                                className={fuxieButtonClass('primary', 'lg', 'shrink-0 rounded-2xl')}
                            >
                                Học tiếp
                                <ArrowRight className="h-4 w-4" />
                            </MeasuredLink>
                        </div>

                        <div className="mt-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="relative flex min-w-[620px] items-center justify-between px-2 py-10">
                                <div className="absolute left-9 right-20 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/70" />
                                <div
                                    className="absolute left-9 top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#54A8E4] via-[#60A8E4] to-[#2EC4B6]"
                                    style={{ width: `calc((100% - 7.25rem) * ${pathPercent / 100})` }}
                                />
                                {summaries.map((summary) => {
                                    const isActive = summary.idx === activeIndex
                                    const isLocked = !summary.mod.isUnlocked
                                    const node = (
                                        <span
                                            className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-base font-black shadow-lg ring-4 transition ${
                                                summary.isDone
                                                    ? 'bg-gradient-to-br from-[#56B947] to-[#2EC4B6] text-white ring-white/20'
                                                    : isActive
                                                        ? 'bg-[#54A8E4] text-white ring-[#CCE4F0]'
                                                        : isLocked
                                                            ? 'bg-white text-slate-400 ring-slate-200'
                                                            : 'bg-white text-text-brand ring-white/80'
                                            }`}
                                        >
                                            <Image
                                                src={FUXIE_UI_FRAMES.courseCheckpointNode}
                                                alt=""
                                                width={56}
                                                height={56}
                                                aria-hidden="true"
                                                className="absolute inset-0 h-full w-full object-contain opacity-[0.18]"
                                            />
                                            <span className="relative z-10">
                                            {summary.isDone ? (
                                                <CheckCircle2 className="h-6 w-6" />
                                            ) : isLocked ? (
                                                <LockKeyhole className="h-5 w-5" />
                                            ) : (
                                                summary.mod.sortOrder
                                            )}
                                            </span>
                                            {!isLocked ? (
                                                <Image
                                                    src={levelBadgeSrc}
                                                    alt=""
                                                    width={28}
                                                    height={28}
                                                    className={`absolute -right-2 -top-2 h-7 w-7 object-contain drop-shadow-md ${
                                                        isActive ? 'scale-110' : summary.isDone ? '' : 'opacity-90'
                                                    }`}
                                                />
                                            ) : null}
                                        </span>
                                    )

                                    return (
                                        <div key={summary.mod.id} className={`relative flex flex-col items-center ${summary.idx % 2 === 0 ? 'translate-y-4' : '-translate-y-4'}`}>
                                            {isLocked ? (
                                                node
                                            ) : (
                                                <MeasuredLink
                                                    href={summary.primaryHref}
                                                    flow="course.path.node"
                                                    source={summary.mod.slug}
                                                    aria-label={`Module ${summary.mod.sortOrder}: ${summary.mod.titleDe ?? summary.mod.title}`}
                                                >
                                                    {node}
                                                </MeasuredLink>
                                            )}
                                            <span className={`mt-3 max-w-20 truncate text-xs font-bold ${isActive ? 'text-text-primary' : 'text-text-brand/70'}`}>
                                                {summary.mod.titleDe ?? summary.mod.title}
                                            </span>
                                        </div>
                                    )
                                })}

                                <div className="-translate-y-6">
                                    <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3C78A8] to-[#60A8E4] text-white shadow-xl ring-4 ring-white/70">
                                        <Trophy className="h-7 w-7" />
                                    </span>
                                    <span className="mt-3 block text-center text-xs font-black text-text-brand">Boss exam</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col gap-4">
                        <div className="flex justify-center rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-white/90 backdrop-blur">
                            <Image
                                src={FUXIE_WORLD_PROPS.courseSignpostPath}
                                alt=""
                                width={124}
                                height={124}
                                className="h-24 w-full object-contain drop-shadow-sm"
                            />
                        </div>
                        <FuxieCoach
                            role="locked"
                            eyebrow="Unlock logic"
                            title={t('nodeUnlockTitle')}
                            message={t('coursePathTip')}
                            className="bg-white"
                        />
                        <FuxiePanel variant="soft" className="bg-white/70 p-3 ring-1 ring-white/90 backdrop-blur">
                            <RewardPreview
                                layout="stack"
                                rewards={[
                                    { type: 'xp', label: `+${Math.max(30, Math.round(activeMinutes / 4))} XP`, detail: 'Module reward' },
                                    { type: 'unlock', label: 'Next node', detail: 'Mở khóa bước tiếp' },
                                    { type: 'exam', label: 'Boss gate', detail: `${level} readiness` },
                                ]}
                            />
                        </FuxiePanel>
                    </div>
                </div>
            </div>
        </FuxiePanel>
    )
}

export function CourseClient({ data }: { data: CourseData }) {
    const t = useTranslations('UI')
    const totalVocabItems = data.modules.reduce((s, m) => s + m.vocabThemes.reduce((ss, t) => ss + t.itemCount, 0), 0)
    const totalVocabLearned = data.modules.reduce((s, m) => s + m.vocabThemes.reduce((ss, t) => ss + t.learnedCount, 0), 0)
    const totalGrammarLessons = data.modules.reduce((s, m) => s + m.grammarTopics.reduce((ss, t) => ss + t.lessonCount, 0), 0)
    const totalGrammarCompleted = data.modules.reduce((s, m) => s + m.grammarTopics.reduce((ss, t) => ss + t.completedCount, 0), 0)
    const moduleSummaries = data.modules.map((mod, idx) => ({
        mod,
        idx,
        ...getModuleProgress(mod),
    }))
    const activeModule = moduleSummaries.find((summary) => summary.mod.isUnlocked && !summary.isDone)
        ?? moduleSummaries.find((summary) => summary.mod.isUnlocked)
        ?? moduleSummaries[0]

    const level = data.cefrLevel ?? 'A1'
    const levelBadgeSrc = getCefrBadgeAssetSrc(level)
    const levelColors: Record<string, string> = {
        A1: 'bg-green-500', A2: 'bg-teal-500', B1: 'bg-blue-500',
        B2: 'bg-indigo-500', C1: 'bg-purple-500', C2: 'bg-rose-500',
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Course Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 ${levelColors[level] ?? 'bg-green-500'} text-sm font-bold text-white`}>
                        <Image src={levelBadgeSrc} alt="" width={26} height={26} className="h-6 w-6 object-contain" />
                        {level}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        📚 {data.courseTitleDe}
                    </h1>
                </div>
                {data.courseDescription && (
                    <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                        {data.courseDescription}
                    </p>
                )}
                {/* Course summary stats */}
                <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📖</span>
                        <span className="font-medium text-gray-700">{data.modules.length}</span> Module
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📝</span>
                        <span className="font-medium text-gray-700">{totalVocabLearned}/{totalVocabItems}</span> từ
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <span className="text-base">📐</span>
                        <span className="font-medium text-gray-700">{totalGrammarCompleted}/{totalGrammarLessons}</span> bài ngữ pháp
                    </div>
                </div>
            </div>

            {activeModule && (
                <CourseQuestPath
                    level={level}
                    summaries={moduleSummaries}
                    activeIndex={activeModule.idx}
                    activeTitle={activeModule.mod.titleDe ?? activeModule.mod.title}
                    activeHref={activeModule.primaryHref}
                    activeMinutes={activeModule.mod.estimatedMinutes}
                />
            )}

            {/*
              Course Path nodes (task 9.1): single source of truth for the
              5 node states + Primary_CTA discipline. Kept above the legacy
              module timeline so the "what to do next" call is unambiguous.
              Validates: Req 4.1–4.7.
            */}
            <CoursePathNodes
                className="mb-8 rounded-2xl border border-[#CCE4F0] bg-white/70 p-4 shadow-sm"
                nodes={buildCourseNodeInputs(moduleSummaries, level)}
            />

            {/* Module Timeline */}
            <div className="relative">
                {/* Vertical timeline line */}
                <div
                    className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2EC4B6] via-[#60A8E4] to-[#3C78A8]"
                    aria-hidden
                />

                <div className="space-y-6">
                    {data.modules.map((mod, idx) => {
                        const gradient = MODULE_GRADIENTS[idx % MODULE_GRADIENTS.length]
                        const emoji = MODULE_EMOJIS[idx] ?? '📘'
                        const totalItems = mod.vocabThemes.reduce((s, t) => s + t.itemCount, 0) +
                            mod.grammarTopics.reduce((s, t) => s + t.lessonCount, 0)
                        const completedItems = mod.vocabThemes.reduce((s, t) => s + t.learnedCount, 0) +
                            mod.grammarTopics.reduce((s, t) => s + t.completedCount, 0)
                        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                        const isDone = progressPercent >= 100
                        const primaryHref = mod.vocabThemes[0]
                            ? '/vocabulary'
                            : mod.grammarTopics[0]
                                ? `/grammar/${mod.grammarTopics[0].slug}`
                                : mod.skillLinks?.[0]?.href ?? '/course'
                        const primaryLabel = isDone ? 'Ôn lại module' : 'Bắt đầu bài tiếp theo'

                        return (
                            <div key={mod.id} className="relative pl-14">
                                {/* Timeline dot */}
                                <div className={`absolute left-3 top-5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md
                                    bg-gradient-to-br ${gradient} ${isDone ? 'ring-2 ring-offset-2 ring-green-400' : ''}`}>
                                    {isDone ? '✓' : mod.sortOrder}
                                </div>

                                {/* Module Card */}
                                <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden
                                    transition-all hover:shadow-md ${!mod.isUnlocked ? 'opacity-60' : ''}`}>
                                    {/* Card Header */}
                                    <div className={`bg-gradient-to-r ${gradient} p-4 sm:p-5`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-white/60 text-xs font-medium mb-1">
                                                    Modul {mod.sortOrder}
                                                </div>
                                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                                    <span>{emoji}</span> {mod.titleDe ?? mod.title}
                                                </h2>
                                            </div>
                                            {/* Progress ring */}
                                            <div className="relative flex items-center justify-center w-12 h-12">
                                                <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                                                    <circle
                                                        cx="18" cy="18" r="14"
                                                        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"
                                                    />
                                                    <circle
                                                        cx="18" cy="18" r="14"
                                                        fill="none" stroke="white" strokeWidth="3"
                                                        strokeDasharray={`${progressPercent * 0.88} 88`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute text-xs font-bold text-white">
                                                    {progressPercent}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 sm:p-5">
                                        {/*
                                          Module cluster header (task 9.2):
                                          renders exactly one mascot per
                                          cluster (Property 23) plus the
                                          CEFR receipt badge for done
                                          modules. The 3s/onError fallback
                                          inside CourseModuleClusterHeader
                                          guarantees a missed asset never
                                          blocks the rest of the card.
                                          Validates: Req 4.6, 4.7, 4.9, 4.10.
                                        */}
                                        <CourseModuleClusterHeader
                                            clusterId={mod.slug}
                                            label={mod.titleDe ?? mod.title}
                                            subtitle={`Modul ${mod.sortOrder}`}
                                            mascotKey="course"
                                            showCefrBadge={isDone}
                                            cefrLevel={level}
                                            className="mb-4"
                                        />

                                        {mod.description && (
                                            <p className="text-sm text-gray-500 mb-4">{mod.description}</p>
                                        )}

                                        <FuxiePanel variant="soft" className="mb-4 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase text-text-brand">
                                                    Việc nên làm ngay
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                                    {primaryLabel}
                                                </p>
                                            </div>
                                            <MeasuredLink
                                                href={primaryHref}
                                                flow="course.module.primary"
                                                source={mod.slug}
                                                className={fuxieButtonClass('primary', 'md', 'shrink-0 rounded-xl shadow-sm')}
                                            >
                                                Học tiếp
                                            </MeasuredLink>
                                        </FuxiePanel>

                                        <details className="group rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                                            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-700">
                                                Chi tiết nội dung module
                                                <span className="ml-2 text-xs font-normal text-gray-400 group-open:hidden">
                                                    {mod.vocabThemes.length} từ vựng · {mod.grammarTopics.length} ngữ pháp · {mod.skillLinks?.length ?? 0} kỹ năng
                                                </span>
                                            </summary>
                                            <div className="mt-4">
                                        {/* Vocab Themes */}
                                        {mod.vocabThemes.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                                                    📚 Từ vựng
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {mod.vocabThemes.map(theme => {
                                                        const pct = theme.itemCount > 0
                                                            ? Math.round((theme.learnedCount / theme.itemCount) * 100)
                                                            : 0
                                                        return (
                                                            <MeasuredLink
                                                                key={theme.slug}
                                                                href="/vocabulary"
                                                                flow="course.module.vocabulary"
                                                                source={`${mod.slug}:${theme.slug}`}
                                                                className="group flex items-center gap-2 rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-2 transition-colors"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {theme.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {theme.nameNative} · {theme.learnedCount}/{theme.itemCount}
                                                                    </p>
                                                                </div>
                                                                {/* Mini progress */}
                                                                <div className="w-8 h-8 relative shrink-0">
                                                                    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#3b82f6" strokeWidth="3"
                                                                            strokeDasharray={`${pct * 0.88} 88`}
                                                                            strokeLinecap="round" />
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </MeasuredLink>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grammar Topics */}
                                        {mod.grammarTopics.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                                                    📐 Ngữ pháp
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {mod.grammarTopics.map(topic => {
                                                        const pct = topic.lessonCount > 0
                                                            ? Math.round((topic.completedCount / topic.lessonCount) * 100)
                                                            : 0
                                                        return (
                                                            <MeasuredLink
                                                                key={topic.slug}
                                                                href={`/grammar/${topic.slug}`}
                                                                flow="course.module.grammar"
                                                                source={`${mod.slug}:${topic.slug}`}
                                                                className="group flex items-center gap-2 rounded-xl bg-amber-50 hover:bg-amber-100 px-3 py-2 transition-colors"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {topic.titleDe}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {topic.titleNative} · {topic.completedCount}/{topic.lessonCount} · {topic.totalStars}⭐
                                                                    </p>
                                                                </div>
                                                                {/* Mini progress */}
                                                                <div className="w-8 h-8 relative shrink-0">
                                                                    <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                                                        <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="3"
                                                                            strokeDasharray={`${pct * 0.88} 88`}
                                                                            strokeLinecap="round" />
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-600">
                                                                        {pct}%
                                                                    </span>
                                                                </div>
                                                            </MeasuredLink>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skill Links (Listening, Reading, Writing, Speaking) */}
                                        {mod.skillLinks && mod.skillLinks.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">
                                                    🎯 Kỹ năng
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    {mod.skillLinks.map(skill => (
                                                        <MeasuredLink
                                                            key={skill.skill}
                                                            href={skill.href}
                                                            flow="course.module.skill"
                                                            source={`${mod.slug}:${skill.skill}`}
                                                            className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 hover:bg-gray-100 px-3 py-3 transition-colors text-center"
                                                        >
                                                            <span className="text-xl">{skill.emoji}</span>
                                                            <span className="text-xs font-medium text-gray-700">{skill.label}</span>
                                                            <span className="text-xs text-gray-400">{skill.labelNative}</span>
                                                        </MeasuredLink>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                            </div>
                                        </details>

                                        {/* Empty state */}
                                        {mod.vocabThemes.length === 0 && mod.grammarTopics.length === 0 && (!mod.skillLinks || mod.skillLinks.length === 0) && (
                                            <p className="text-sm text-gray-400 italic">
                                                Tổng ôn — không có nội dung mới
                                            </p>
                                        )}

                                        {/* Footer with estimated time */}
                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                            <span>⏱️ ~{Math.round(mod.estimatedMinutes / 60)} giờ</span>
                                            {isDone && <span className="text-green-600 font-medium">✅ {t('completed')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

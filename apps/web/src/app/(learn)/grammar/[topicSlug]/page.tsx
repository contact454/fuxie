import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@fuxie/database'
import { getServerUser } from '@/lib/auth/server-auth'

export const dynamic = 'force-dynamic'

const TYPE_INFO: Record<string, { label: string; emoji: string; description: string }> = {
    E: { label: 'Einführung', emoji: '📖', description: 'Giới thiệu lý thuyết + bài tập cơ bản' },
    V: { label: 'Vertiefung', emoji: '🔬', description: 'Luyện sâu & mở rộng' },
    A: { label: 'Anwendung', emoji: '🎯', description: 'Ứng dụng thực tế — không lý thuyết' },
}

export async function generateMetadata({ params }: { params: Promise<{ topicSlug: string }> }) {
    const { topicSlug } = await params
    const topic = await prisma.grammarTopic.findUnique({
        where: { slug: topicSlug },
    })
    return {
        title: topic ? `Fuxie 🦊 — ${topic.titleDe ?? topic.title}` : 'Fuxie — Grammatik',
        description: topic?.titleVi ?? 'Deutsche Grammatik',
    }
}

export default async function TopicDetailPage({ params }: { params: Promise<{ topicSlug: string }> }) {
    const { topicSlug } = await params
    const serverUser = await getServerUser()
    if (!serverUser) redirect('/login')

    const topic = await prisma.grammarTopic.findUnique({
        where: { slug: topicSlug },
    })

    if (!topic) notFound()

    // Query lessons separately
    const lessons = await prisma.grammarLesson.findMany({
        where: { topicId: topic.id },
        orderBy: { sortOrder: 'asc' },
    })

    // Get progress
    const progressRows = await prisma.grammarProgress.findMany({
        where: {
            userId: serverUser.userId,
            lessonId: { in: lessons.map((l) => l.id) },
        },
    })
    const progressMap: Record<string, { score: number; stars: number; completed: boolean }> = {}
    for (const p of progressRows) {
        progressMap[p.lessonId] = {
            score: p.score ?? 0,
            stars: p.stars ?? 0,
            completed: p.completed,
        }
    }

    // Lock/unlock logic
    const lessonStates = lessons.map((l: any, i: number) => {
        const progress = progressMap[l.id]
        const exerciseCount = Array.isArray(l.exercisesJson) ? (l.exercisesJson as any[]).length : 0
        let locked = false
        if (i > 0) {
            const prevLesson = lessons[i - 1]
            if (prevLesson && !progressMap[prevLesson.id]?.completed) {
                locked = true
            }
        }
        return { ...l, exerciseCount, progress: progress ?? null, locked }
    })

    const totalStars = lessonStates.reduce((s: number, l: any) => s + (l.progress?.stars ?? 0), 0)

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link href="/grammar" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                ← Quay lại Grammatik
            </Link>

            <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold text-white"
                        style={{
                            background: topic.cefrLevel.startsWith('A') ? '#16A34A'
                                : topic.cefrLevel.startsWith('B') ? '#2563EB' : '#7C3AED'
                        }}
                    >
                        {topic.cefrLevel}
                    </span>
                    <span className="text-sm text-gray-400">
                        {totalStars}/{lessons.length * 3} ⭐
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{topic.titleDe ?? topic.title}</h1>
                <p className="text-gray-500">{topic.titleVi}</p>
            </div>

            <div className="space-y-4">
                {lessonStates.map((lesson: any, idx: number) => {
                    const typeInfo = TYPE_INFO[lesson.lessonType] || { label: lesson.lessonType, emoji: '📄', description: '' }
                    const done = lesson.progress?.completed
                    const stars = lesson.progress?.stars ?? 0

                    return (
                        <a
                            key={lesson.id}
                            href={lesson.locked ? undefined : `/grammar/${topicSlug}/${lesson.id}`}
                            className={`block rounded-2xl border-2 transition-all ${
                                lesson.locked
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    : done
                                    ? 'border-green-200 bg-green-50/30 hover:shadow-md cursor-pointer'
                                    : 'border-blue-200 bg-white hover:shadow-md cursor-pointer'
                            }`}
                        >
                            <div className="p-5 flex items-start gap-4">
                                <div className="text-3xl">{typeInfo.emoji}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-gray-400 uppercase">
                                            Bài {idx + 1} — {typeInfo.label}
                                        </span>
                                        {lesson.locked && <span className="text-xs">🔒</span>}
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{lesson.titleVi}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{typeInfo.description}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>⏱️ ~{lesson.estimatedMin} phút</span>
                                        <span>📝 {lesson.exerciseCount} bài tập</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    {done ? (
                                        <div>
                                            <div className="text-lg">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                                            <div className="text-xs text-green-600 font-medium">Đã hoàn thành</div>
                                        </div>
                                    ) : lesson.locked ? (
                                        <div className="text-sm text-gray-400">Khóa</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-xl bg-blue-500 text-white text-sm font-medium">
                                            Học →
                                        </div>
                                    )}
                                </div>
                            </div>
                        </a>
                    )
                })}
            </div>
        </div>
    )
}

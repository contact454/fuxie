'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'

// ─── Types ──────────────────────────────────────────
interface FormField {
    label: string
    type: string
    placeholder?: string
}

interface RubricCriterion {
    id: string
    name: string
    nameVi?: string
    maxScore: number
}

interface AiFeedback {
    totalScore: number
    maxScore: number
    percentScore: number
    estimatedLevel: string
    criteria: Array<{
        id: string
        name: string
        nameVi?: string
        score: number
        maxScore: number
        reasoning: string
        reasoningVi?: string
        suggestions: string[]
        suggestionsVi?: string[]
    }>
    overallFeedback: string
    overallFeedbackVi?: string
    corrections: Array<{
        original: string
        corrected: string
        type: string
        typeVi?: string
        explanation: string
        explanationVi?: string
    }>
}

interface WritingPlayerProps {
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    textType: string
    register: string
    topic: string
    instruction: string
    instructionVi: string | null
    situation: string
    contentPoints: string[]
    formFields: FormField[] | null
    sourceText: string | null
    sourceTextType: string | null
    grafikDesc: string | null
    minWords: number
    maxWords: number | null
    timeMinutes: number
    maxScore: number
    rubricJson: { criteria: RubricCriterion[]; maxScore: number }
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { bg: string; text: string; css: string; shadow: string }> = {
    A1: { bg: '#DCFCE7', text: '#166534', css: 'linear-gradient(135deg, #22C55E, #059669)', shadow: 'rgba(34,197,94,0.3)' },
    A2: { bg: '#D9F99D', text: '#3F6212', css: 'linear-gradient(135deg, #84CC16, #16A34A)', shadow: 'rgba(132,204,22,0.3)' },
    B1: { bg: '#FED7AA', text: '#9A3412', css: 'linear-gradient(135deg, #F97316, #D97706)', shadow: 'rgba(249,115,22,0.3)' },
    B2: { bg: '#FECACA', text: '#991B1B', css: 'linear-gradient(135deg, #EF4444, #EA580C)', shadow: 'rgba(239,68,68,0.3)' },
    C1: { bg: '#E9D5FF', text: '#6B21A8', css: 'linear-gradient(135deg, #A855F7, #7C3AED)', shadow: 'rgba(168,85,247,0.3)' },
    C2: { bg: '#DDD6FE', text: '#4C1D95', css: 'linear-gradient(135deg, #7C3AED, #6B21A8)', shadow: 'rgba(124,58,237,0.3)' },
}

const REGISTER_LABELS: Record<string, { de: string; emoji: string }> = {
    formell: { de: 'Formell', emoji: '👔' },
    informell: { de: 'Informell', emoji: '👋' },
    halbformell: { de: 'Halbformell', emoji: '🤝' },
    neutral: { de: 'Neutral', emoji: '📝' },
    sachlich: { de: 'Sachlich', emoji: '📊' },
    akademisch: { de: 'Akademisch', emoji: '🎓' },
    variiert: { de: 'Variiert', emoji: '🔄' },
}

// ─── Word Count ─────────────────────────────────────
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

// ─── Timer Format ───────────────────────────────────
function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Progress Ring ──────────────────────────────────
function ScoreRing({ score, maxScore, size = 120 }: { score: number; maxScore: number; size?: number }) {
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percent / 100) * circumference
    const color = percent >= 80 ? '#10B981' : percent >= 60 ? '#F59E0B' : '#EF4444'

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="none"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score}<span className="text-lg text-gray-400">/{maxScore}</span></span>
                <span className="text-sm text-gray-500">{percent}%</span>
            </div>
        </div>
    )
}

// ─── Stimulus Box ───────────────────────────────────
function StimulusBox({ sourceText, sourceTextType, cefrLevel, colors }: {
    sourceText: string
    sourceTextType: string | null
    cefrLevel: string
    colors: { bg: string; text: string; css: string; shadow: string }
}) {
    const type = (sourceTextType || '').toLowerCase()

    // Determine styling based on text type
    const isEmail = type.includes('email') || type.includes('e-mail')
    const isForum = type.includes('forum')
    const isArticle = type.includes('article') || type.includes('artikel') || type.includes('zeitung')
    const isVortrag = type.includes('vortrag') || type.includes('rede') || type.includes('lecture')

    if (isEmail) {
        return (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-100/60 border-b border-blue-200">
                    <span className="text-sm">📧</span>
                    <span className="text-xs font-bold text-blue-800">E-Mail</span>
                    {sourceTextType && !isEmail && (
                        <span className="text-xs text-blue-600 ml-auto">{sourceTextType}</span>
                    )}
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isForum) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-100/60 border-b border-amber-200">
                    <span className="text-sm">💬</span>
                    <span className="text-xs font-bold text-amber-800">Online-Forum</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isArticle) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
                    <span className="text-sm">📰</span>
                    <span className="text-xs font-bold text-gray-800">Zeitungsartikel</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
                </div>
            </div>
        )
    }

    if (isVortrag) {
        return (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/60 border-b border-purple-200">
                    <span className="text-sm">🎤</span>
                    <span className="text-xs font-bold text-purple-800">Mündlicher Vortrag</span>
                </div>
                <div className="px-3 py-2.5">
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap italic">{sourceText}</p>
                </div>
            </div>
        )
    }

    // Default: generic stimulus box
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: colors.bg }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ backgroundColor: colors.bg, borderColor: colors.bg }}>
                <span className="text-sm">📄</span>
                <span className="text-xs font-bold" style={{ color: colors.text }}>
                    {sourceTextType || 'Ausgangstext'}
                </span>
            </div>
            <div className="px-3 py-2.5 bg-white">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sourceText}</p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export function WritingPlayer(props: WritingPlayerProps) {
    const router = useRouter()
    const colors = CEFR_COLORS[props.cefrLevel] ?? CEFR_COLORS.A1!
    const registerInfo = REGISTER_LABELS[props.register] ?? REGISTER_LABELS.neutral!
    const isFormular = props.textType === 'Formular' && props.formFields

    // ─── State ──────────────────────────────────────
    const [phase, setPhase] = useState<'writing' | 'submitting' | 'feedback'>('writing')
    const [text, setText] = useState('')
    const [formValues, setFormValues] = useState<Record<string, string>>({})
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [feedback, setFeedback] = useState<AiFeedback | null>(null)
    const [error, setError] = useState<string | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const wordCount = countWords(text)
    const isFormComplete = isFormular
        ? Object.keys(formValues).length >= (props.formFields?.length ?? 0) && Object.values(formValues).every(v => v.trim().length > 0)
        : wordCount >= props.minWords

    // ─── Timer ──────────────────────────────────────
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeElapsed(prev => prev + 1)
        }, 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    // ─── Submit ─────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (phase !== 'writing') return
        setPhase('submitting')
        setError(null)

        const submittedText = isFormular
            ? Object.entries(formValues).map(([k, v]) => `${k}: ${v}`).join('\n')
            : text

        try {
            const res = await fetch('/api/v1/writing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exerciseId: props.exerciseId,
                    submittedText,
                    wordCount: countWords(submittedText),
                    timeSpentSeconds: timeElapsed,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setFeedback(data.data)
                setPhase('feedback')
                if (timerRef.current) clearInterval(timerRef.current)
            } else {
                setError(data.error || 'Fehler beim Einreichen')
                setPhase('writing')
            }
        } catch {
            setError('Verbindungsfehler. Bitte versuche es erneut.')
            setPhase('writing')
        }
    }, [phase, isFormular, formValues, text, props.exerciseId, timeElapsed])

    // ─── Word Count Color ───────────────────────────
    const getWordCountColor = () => {
        if (wordCount === 0) return 'text-gray-400'
        if (wordCount < props.minWords) return 'text-amber-500'
        if (props.maxWords && wordCount > props.maxWords) return 'text-red-500'
        return 'text-green-600'
    }

    // ═══ FEEDBACK PHASE ═══
    if (phase === 'feedback' && feedback) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* ─── Score Header ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <Mascot variant="celebrate" size={80} />
                    </div>
                    <div className="flex justify-center mb-3">
                        <ScoreRing score={feedback.totalScore} maxScore={feedback.maxScore} />
                    </div>
                    {feedback.estimatedLevel && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-sm text-gray-500">Geschätztes Niveau:</span>
                            <span className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                style={{ color: (CEFR_COLORS[feedback.estimatedLevel] ?? colors).text, backgroundColor: (CEFR_COLORS[feedback.estimatedLevel] ?? colors).bg }}>
                                {feedback.estimatedLevel}
                            </span>
                        </div>
                    )}
                    <p className="text-gray-600 mt-3 text-sm">{feedback.overallFeedback}</p>
                    {feedback.overallFeedbackVi && (
                        <p className="text-gray-400 mt-1 text-xs italic">🇻🇳 {feedback.overallFeedbackVi}</p>
                    )}
                </div>

                {/* ─── Criteria Scores ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Bewertung</h3>
                    <div className="space-y-4">
                        {feedback.criteria.map((c) => {
                            const percent = c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0
                            const barColor = percent >= 80 ? '#10B981' : percent >= 60 ? '#F59E0B' : '#EF4444'
                            return (
                                <div key={c.id}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                            {c.nameVi && <span className="text-xs text-gray-400 ml-2">{c.nameVi}</span>}
                                        </div>
                                        <span className="text-sm font-bold" style={{ color: barColor }}>{c.score}/{c.maxScore}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${percent}%`, backgroundColor: barColor }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 italic">{c.reasoning}</p>
                                    {c.reasoningVi && <p className="text-xs text-gray-400 italic">🇻🇳 {c.reasoningVi}</p>}
                                    {c.suggestionsVi && c.suggestionsVi.length > 0 && (
                                        <div className="mt-1.5 pl-2 border-l-2 border-blue-200">
                                            <p className="text-xs font-medium text-blue-600 mb-0.5">💡 Gợi ý cải thiện:</p>
                                            {c.suggestionsVi.map((s: string, si: number) => (
                                                <p key={si} className="text-xs text-blue-500">• {s}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ─── Corrections ─── */}
                {feedback.corrections.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Fehlerkorrektur</h3>
                        <div className="space-y-3">
                            {feedback.corrections.map((c, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="flex items-start gap-2">
                                        <div className="shrink-0 flex flex-col gap-0.5">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">{c.type}</span>
                                            {c.typeVi && <span className="text-[10px] text-gray-400 text-center">{c.typeVi}</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="line-through text-red-500">{c.original}</span>
                                                <span className="mx-1">→</span>
                                                <span className="text-green-600 font-medium">{c.corrected}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{c.explanation}</p>
                                            {c.explanationVi && <p className="text-xs text-gray-400">🇻🇳 {c.explanationVi}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Actions ─── */}
                <div className="flex gap-3 justify-center pt-2">
                    <button
                        onClick={() => { setText(''); setFormValues({}); setTimeElapsed(0); setFeedback(null); setPhase('writing') }}
                        className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
                    >
                        🔄 Nochmal versuchen
                    </button>
                    <button
                        onClick={() => router.push('/writing')}
                        className="px-6 py-3 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg"
                        style={{ background: colors.css, boxShadow: `0 4px 16px ${colors.shadow}` }}
                    >
                        Nächste Aufgabe →
                    </button>
                </div>
            </div>
        )
    }

    // ═══ WRITING PHASE ═══
    return (
        <div>
            {/* ─── Top Bar ─── */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => router.push('/writing')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                    ✕
                </button>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: '100%', background: colors.css }} />
                </div>
                <span className="text-sm text-gray-500 font-medium">1/1</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colors.text, backgroundColor: colors.bg }}>
                    {props.cefrLevel}
                </span>
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                    ⏱️ {formatTime(timeElapsed)}
                </span>
            </div>

            {/* ─── Main Layout ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* LEFT: Instructions */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">✏️</span>
                            <h2 className="text-lg font-bold text-gray-900">Aufgabe</h2>
                        </div>

                        {/* Text Type + Register badges */}
                        <div className="flex gap-2 mb-3">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: colors.text, backgroundColor: colors.bg }}>
                                {props.textType}
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                                {registerInfo.emoji} {registerInfo.de}
                            </span>
                        </div>

                        {/* Situation */}
                        <p className="text-sm text-gray-800 leading-relaxed mb-2">{props.situation}</p>
                        {props.instructionVi && (
                            <p className="text-xs text-gray-400 mb-4 italic">{props.instructionVi}</p>
                        )}

                        {/* ─── Stimulus Material ─── */}
                        {props.sourceText && (
                            <div className="mt-3 mb-3">
                                <StimulusBox
                                    sourceText={props.sourceText}
                                    sourceTextType={props.sourceTextType}
                                    cefrLevel={props.cefrLevel}
                                    colors={colors}
                                />
                            </div>
                        )}

                        {/* Grafik Description */}
                        {props.grafikDesc && !props.sourceText?.includes(props.grafikDesc) && (
                            <div className="mt-3 mb-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">📊</span>
                                    <span className="text-xs font-bold text-indigo-700">Grafik</span>
                                </div>
                                <p className="text-xs text-indigo-600 leading-relaxed">{props.grafikDesc}</p>
                            </div>
                        )}

                        {/* Content Points */}
                        <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">📋 Inhaltspunkte:</h4>
                            <ul className="space-y-1.5">
                                {props.contentPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 text-xs"
                                            style={{ backgroundColor: colors.bg, color: colors.text }}>
                                            {i + 1}
                                        </span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Word count + time requirements */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                                📏 {props.minWords}{props.maxWords ? `-${props.maxWords}` : '+'} Wörter
                            </span>
                            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700">
                                ⏱️ {props.timeMinutes} min
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Editor */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
                        {isFormular && props.formFields ? (
                            /* ─── FORM MODE ─── */
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900 mb-4">📋 {props.topic}</h3>
                                <div className="space-y-4">
                                    {props.formFields.map((field, i) => (
                                        <div key={i}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                            <input
                                                type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                                                placeholder={field.placeholder || field.label}
                                                value={formValues[field.label] || ''}
                                                onChange={e => setFormValues(prev => ({ ...prev, [field.label]: e.target.value }))}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all"
                                                style={{ '--tw-ring-color': colors.text } as any}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ─── TEXT EDITOR MODE ─── */
                            <div className="flex-1 flex flex-col">
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="Schreiben Sie hier Ihren Text..."
                                    className="flex-1 w-full min-h-[320px] p-4 rounded-xl border border-gray-200 text-sm text-gray-800 leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all placeholder:text-gray-300"
                                    style={{ '--tw-ring-color': colors.text } as any}
                                    disabled={phase === 'submitting'}
                                />
                                {/* Word counter */}
                                <div className="flex justify-end mt-2">
                                    <span className={`text-sm font-medium ${getWordCountColor()}`}>
                                        {wordCount} / {props.minWords}{props.maxWords ? `-${props.maxWords}` : '+'} Wörter
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormComplete || phase === 'submitting'}
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isFormComplete
                                    ? 'text-white hover:opacity-90 shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                style={isFormComplete ? { background: colors.css, boxShadow: `0 4px 16px ${colors.shadow}` } : undefined}
                            >
                                {phase === 'submitting' ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        KI bewertet...
                                    </>
                                ) : (
                                    <>Abgeben →</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

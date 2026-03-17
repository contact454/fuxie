'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mascot } from '@/components/ui/mascot'
import styles from './reading.module.css'

// ─── Types ──────────────────────────────────────────
interface Question {
    id: string
    questionNumber: number
    questionType: string
    linkedText: string | null
    statement: string
    options: string[] | null
    sortOrder: number
}

interface ExplanationData {
    key_evidence?: string
    reasoning?: string
    vocabulary_help?: Record<string, string>
    [key: string]: unknown
}

interface QuestionResult {
    questionId: string
    questionNumber: number
    questionType: string
    statement: string
    linkedText: string | null
    options: string[]
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: ExplanationData | string | null
}

interface ReadingPlayerProps {
    exerciseId: string
    cefrLevel: string
    teil: number
    teilName: string
    topic: string
    textsJson: any
    imagesJson: any
    questions: Question[]
}

// ─── Constants ──────────────────────────────────────
const CEFR_COLORS: Record<string, { gradient: string; bg: string; text: string; css: string; shadow: string }> = {
    A1: { gradient: 'from-green-500 to-emerald-600', bg: '#DCFCE7', text: '#166534', css: 'linear-gradient(135deg, #22C55E, #059669)', shadow: 'rgba(34,197,94,0.3)' },
    A2: { gradient: 'from-lime-500 to-green-600', bg: '#D9F99D', text: '#3F6212', css: 'linear-gradient(135deg, #84CC16, #16A34A)', shadow: 'rgba(132,204,22,0.3)' },
    B1: { gradient: 'from-orange-400 to-amber-600', bg: '#FED7AA', text: '#9A3412', css: 'linear-gradient(135deg, #F97316, #D97706)', shadow: 'rgba(249,115,22,0.3)' },
    B2: { gradient: 'from-red-500 to-orange-600', bg: '#FECACA', text: '#991B1B', css: 'linear-gradient(135deg, #EF4444, #EA580C)', shadow: 'rgba(239,68,68,0.3)' },
    C1: { gradient: 'from-purple-500 to-violet-600', bg: '#E9D5FF', text: '#6B21A8', css: 'linear-gradient(135deg, #A855F7, #7C3AED)', shadow: 'rgba(168,85,247,0.3)' },
    C2: { gradient: 'from-violet-600 to-purple-800', bg: '#DDD6FE', text: '#4C1D95', css: 'linear-gradient(135deg, #7C3AED, #6B21A8)', shadow: 'rgba(124,58,237,0.3)' },
}

const TEIL_DESCRIPTIONS: Record<string, Record<number, { icon: string; strategy: string; genre: string }>> = {
    beginner: {
        1: { icon: '📧', strategy: 'Lies den Text einmal schnell durch. Achte auf die Schlüsselwörter.', genre: 'Kurze Texte' },
        2: { icon: '📋', strategy: 'Vergleiche die zwei Anzeigen. Achte auf die Details (Preis, Ort, Zeit).', genre: 'Anzeigen' },
        3: { icon: '🪧', strategy: 'Lies jedes Schild aufmerksam. Achte auf Zahlen und Verbote.', genre: 'Schilder' },
        4: { icon: '🗓️', strategy: 'Suche die wichtigen Informationen: Datum, Uhrzeit, Ort.', genre: 'Informationstexte' },
    },
    advanced: {
        1: { icon: '📰', strategy: 'Überfliegen Sie zuerst den gesamten Text, dann lesen Sie die Fragen.', genre: 'Sachtext' },
        2: { icon: '📝', strategy: 'Achten Sie auf Signalwörter: jedoch, dennoch, außerdem, folglich...', genre: 'Lückentext' },
        3: { icon: '🔬', strategy: 'Unterstreichen Sie die Hauptaussage jedes Absatzes.', genre: 'Wissenschaftl. Text' },
        4: { icon: '💬', strategy: 'Die Meinungen können ähnlich klingen — achten Sie auf Nuancen.', genre: 'Meinungen' },
        5: { icon: '📖', strategy: 'Lesen Sie den Ratgeber abschnittsweise und beantworten Sie stückweise.', genre: 'Ratgeber' },
    },
}

const DIFFICULTY: Record<string, { label: string; dots: number; color: string }> = {
    A1: { label: 'Einfach', dots: 1, color: '#22C55E' },
    A2: { label: 'Einfach', dots: 2, color: '#84CC16' },
    B1: { label: 'Mittel', dots: 3, color: '#F97316' },
    B2: { label: 'Anspruchsvoll', dots: 4, color: '#EF4444' },
    C1: { label: 'Fortgeschritten', dots: 5, color: '#A855F7' },
    C2: { label: 'Experte', dots: 5, color: '#7C3AED' },
}

type Phase = 'intro' | 'warmup' | 'exercise' | 'results'

// ─── Warm-up activation questions per level ─────────
const WARMUP_QUESTIONS: Record<string, string[]> = {
    A1: [
        'Was siehst du auf dem Bild?',
        'Welche Wörter kennst du schon zum Thema?',
        'Was erwartest du im Text?',
    ],
    A2: [
        'Was weißt du schon über dieses Thema?',
        'Welche Wörter fallen dir zum Thema ein?',
        'Was möchtest du aus dem Text erfahren?',
    ],
    B1: [
        'Was ist Ihre Meinung zu diesem Thema?',
        'Welche Schlüsselbegriffe erwarten Sie?',
        'Was wissen Sie bereits darüber?',
    ],
    B2: [
        'Formulieren Sie eine Hypothese zum Textinhalt.',
        'Welche Argumente erwarten Sie?',
        'Was ist der Kontext dieses Themas?',
    ],
    C1: [
        'Welche Position könnte der Autor vertreten?',
        'Welche Fachbegriffe erwarten Sie?',
        'Was macht dieses Thema aktuell relevant?',
    ],
    C2: [
        'Analysieren Sie den Titel: Welche These steckt dahinter?',
        'Welche akademische Perspektive erwarten Sie?',
        'Wie würden Sie das Thema einordnen?',
    ],
}

// ─── Post-reading tips per level ──────────────────
const POST_READING_TIPS: Record<string, string[]> = {
    A1: [
        'Lies den Text noch einmal laut vor — das hilft beim Wortschatz!',
        'Schreibe 3 neue Wörter auf und bilde einfache Sätze.',
        'Versuche morgen den Text ohne Hilfe zu lesen.',
    ],
    A2: [
        'Markiere die wichtigsten Informationen im Text.',
        'Erzähle den Textinhalt in eigenen Worten (2-3 Sätze).',
        'Übe die neuen Wörter mit Karteikarten.',
    ],
    B1: [
        'Fasse den Text in 3-4 Sätzen zusammen.',
        'Notiere die Schlüsselargumente des Autors.',
        'Suche einen ähnlichen Text und vergleiche die Informationen.',
    ],
    B2: [
        'Analysieren Sie die Textstruktur: Einleitung, Hauptteil, Schluss.',
        'Identifizieren Sie die stilistischen Mittel des Autors.',
        'Schreiben Sie eine kurze Stellungnahme zum Textthema.',
    ],
    C1: [
        'Bewerten Sie die Argumentation: Sind die Belege überzeugend?',
        'Vergleichen Sie verschiedene Perspektiven zum Thema.',
        'Formulieren Sie eigene Gegenargumente.',
    ],
    C2: [
        'Analysieren Sie die diskursive Einbettung des Textes.',
        'Identifizieren Sie implizite Annahmen und Prämissen.',
        'Verfassen Sie eine kritische Rezension (200 Wörter).',
    ],
}

// ─── Helper: extract key words from texts for vocabulary preview ──
function extractKeyWords(textsJson: any, cefrLevel: string): string[] {
    if (!textsJson) return []
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    const allText = texts.map((t: any) => t.text || t.content || t.body || '').join(' ')
    // Extract longer words (likely meaningful vocabulary)
    const minLength = ['A1', 'A2'].includes(cefrLevel) ? 5 : 7
    const words = allText.split(/\s+/)
        .filter((w: string) => w.length >= minLength && /^[A-ZÄÖÜa-zäöüß]/.test(w))
        .map((w: string) => w.replace(/[.,!?;:()"]/g, ''))
        .filter((w: string, i: number, arr: string[]) => arr.indexOf(w) === i) // unique
    // Return up to 8 words, shuffled
    return words.sort(() => Math.random() - 0.5).slice(0, 8)
}

// Types for click-to-translate
type LookedUpWord = {
    word: string
    translation: string
    context?: string
    timestamp: number
}

type TooltipState = {
    word: string
    translation: string | null
    loading: boolean
    x: number
    y: number
}

type TextHighlight = { textIndex: number; text: string; color: string }

// ─── Helper: resolve image URL ─────────────────────
function getImageUrl(filename: string, cefrLevel: string) {
    return `/images/reading/${cefrLevel.toLowerCase()}/${filename}`
}

// ─── Helper: get hero image from exercise ────────────
function getHeroImage(imagesJson: any, cefrLevel: string): string | null {
    if (!imagesJson || !Array.isArray(imagesJson)) return null
    const hero = imagesJson.find((img: any) => img.placement === 'header' || img.placement === 'anzeige_a' || img.placement === 'schild_1')
    return hero ? getImageUrl(hero.filename, cefrLevel) : null
}

// ─── Helper: render images by placement ─────────────
function renderImages(imagesJson: any, cefrLevel: string, placement?: string) {
    if (!imagesJson || !Array.isArray(imagesJson)) return null
    const images = placement
        ? imagesJson.filter((img: any) => img.placement === placement || img.placement?.startsWith(placement))
        : imagesJson
    if (images.length === 0) return null

    return (
        <div className={images.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
            {images.map((img: any, i: number) => (
                <div key={img.id || i} className={styles.exerciseImage}>
                    <img
                        src={getImageUrl(img.filename, cefrLevel)}
                        alt={img.alt_text || 'Illustration'}
                        className="w-full h-auto object-contain"
                        loading="lazy"
                    />
                    {img.alt_text && (
                        <p className={styles.caption}>{img.alt_text}</p>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Helper: render schilder as paired image+text cards ───
function renderSchilderCards(textsJson: any, imagesJson: any, cefrLevel: string) {
    if (!textsJson) return null
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    // Detect schilder: items with type + text + icon
    const schilder = texts.filter((t: any) => t.type && t.text && t.icon)
    if (schilder.length === 0) return null

    // Build image map: schild_1 -> url, schild_2 -> url, ...
    const imageMap: Record<number, { url: string; alt: string }> = {}
    if (imagesJson && Array.isArray(imagesJson)) {
        for (const img of imagesJson) {
            const match = img.placement?.match(/schild_(\d+)/)
            if (match) {
                imageMap[parseInt(match[1]!)] = {
                    url: getImageUrl(img.filename, cefrLevel),
                    alt: img.alt_text || 'Schild'
                }
            }
        }
    }

    const typeIcons: Record<string, string> = {
        'Öffnungszeiten': '🕖', 'Angebot': '🎁', 'Regel': '⛔',
        'Information': 'ℹ️', 'Warnung': '⚠️', 'Hinweis': '📌',
        'Verbot': '🚫', 'Wegweiser': '➡️', 'Preis': '💰',
    }

    return (
        <div className="space-y-4">
            {schilder.map((sign: any, i: number) => {
                const img = imageMap[i + 1]
                const typeIcon = typeIcons[sign.type] || sign.icon || '🪧'
                return (
                    <div key={i} className={`${styles.textCard} ${styles.fadeInUp}`}
                        style={{ animationDelay: `${i * 0.08}s`, overflow: 'hidden' }}>
                        {/* Sign image */}
                        {img && (
                            <div style={{ margin: '-16px -16px 0 -16px' }}>
                                <img
                                    src={img.url}
                                    alt={img.alt}
                                    className="w-full h-auto object-cover"
                                    style={{ maxHeight: '260px', objectFit: 'cover' }}
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {/* Sign text content */}
                        <div style={{ padding: img ? '12px 0 0 0' : '0' }}>
                            <div className={styles.textHeader} style={{ marginBottom: '6px' }}>
                                <span className={styles.label}>
                                    {typeIcon} Schild {i + 1}
                                </span>
                                <span className={styles.badge}>{sign.type}</span>
                            </div>
                            <div className={`${styles.textBody} ${styles.readingText}`}
                                style={{ fontSize: '14px', lineHeight: 1.7 }}>
                                {sign.text}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Helper: render anzeigen as paired image+details cards ───
function renderAnzeigenCards(textsJson: any, imagesJson: any, cefrLevel: string) {
    if (!textsJson) return null
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    // Detect anzeigen: items with title + details (no text field)
    const anzeigen = texts.filter((t: any) => t.title && t.details && !t.text)
    if (anzeigen.length === 0) return null

    // Build image map: anzeige_a -> url, anzeige_b -> url
    const imageMap: Record<string, { url: string; alt: string }> = {}
    if (imagesJson && Array.isArray(imagesJson)) {
        for (const img of imagesJson) {
            if (img.placement?.startsWith('anzeige_')) {
                imageMap[img.placement] = {
                    url: getImageUrl(img.filename, cefrLevel),
                    alt: img.alt_text || 'Anzeige'
                }
            }
        }
    }

    const detailLabels: Record<string, string> = {
        name: '🏪', address: '📍', hours: '🕐',
        price: '💰', contact: '📞', target_audience: '👥',
        extra_info: 'ℹ️',
    }

    const placementKeys = ['anzeige_a', 'anzeige_b', 'anzeige_c', 'anzeige_d']

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {anzeigen.map((ad: any, i: number) => {
                const img = imageMap[placementKeys[i] || `anzeige_${String.fromCharCode(97+i)}`]
                const label = String.fromCharCode(65 + i) // A, B, C...
                const details = ad.details || {}
                return (
                    <div key={i} className={`${styles.textCard} ${styles.fadeInUp}`}
                        style={{ animationDelay: `${i * 0.1}s`, overflow: 'hidden' }}>
                        {/* Ad image */}
                        {img && (
                            <div style={{ margin: '-16px -16px 0 -16px' }}>
                                <img
                                    src={img.url}
                                    alt={img.alt}
                                    className="w-full h-auto object-cover"
                                    style={{ maxHeight: '280px', objectFit: 'cover' }}
                                    loading="lazy"
                                />
                            </div>
                        )}
                        {/* Ad details */}
                        <div style={{ padding: img ? '12px 0 0 0' : '0' }}>
                            <div className={styles.textHeader} style={{ marginBottom: '8px' }}>
                                <span className={styles.label}>
                                    📋 Anzeige {label}
                                </span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#1F2937', marginBottom: '8px' }}>
                                {ad.title}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {Object.entries(details).map(([key, value]: [string, any]) => (
                                    <div key={key} style={{ display: 'flex', gap: '6px', fontSize: '13px', lineHeight: 1.5 }}>
                                        <span style={{ flexShrink: 0 }}>{detailLabels[key] || '•'}</span>
                                        <span style={{ color: '#374151' }}>{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Helper: render reading texts with premium styling ──
function renderTexts(textsJson: any, cefrLevel?: string) {
    if (!textsJson) return null

    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    if (texts.length === 0) return null
    const isAdvancedLevel = ['B1', 'B2', 'C1', 'C2'].includes(cefrLevel || '')

    return (
        <div className="space-y-5">
            {texts.map((txt: any, i: number) => {
                // ── Detect structured data format ──
                // Schedule / Infotafel → render as table
                if (txt.columns && txt.rows) {
                    return renderSchedule(txt, i)
                }
                if (txt.rows && txt.location) {
                    return renderInfotafel(txt, i)
                }
                // Debate → render reader letters
                if (txt.letters && txt.context) {
                    return renderDebate(txt, i)
                }
                // Forum → render comments
                if (txt.comments && txt.question) {
                    return renderForum(txt, i)
                }
                // Opinion texts → render multi-opinion
                if (txt.texts && txt.question && !txt.text) {
                    return renderOpinionTexts(txt, i)
                }
                // Sectioned content (infotext, ratgeber)
                if (txt.sections && !txt.text) {
                    return renderSections(txt, i)
                }
                // Schilder (signs) with icon/type → skip, rendered by renderSchilderCards
                if (txt.type && txt.text && txt.icon) {
                    return null
                }
                // Anzeigen with title+details → skip, rendered by renderAnzeigenCards
                if (txt.title && txt.details && !txt.text) {
                    return null
                }

                // ── Standard text format ──
                const label = txt.label || txt.title || `Text ${String.fromCharCode(65 + i)}`
                const type = txt.type || txt.text_type || ''
                const textContent = txt.text || txt.content || txt.body || ''
                const paragraphs = isAdvancedLevel
                    ? textContent.split(/\n\n+/).filter((p: string) => p.trim())
                    : [textContent]

                return (
                    <div key={i} className={`${styles.textCard} ${styles.fadeInUp}`} style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className={styles.textHeader}>
                            <span className={styles.label}>{label}</span>
                            {type && <span className={styles.badge}>{type}</span>}
                        </div>

                        {(txt.von || txt.from || txt.sender) && (
                            <div className={styles.emailMeta}>
                                {(txt.von || txt.from || txt.sender) && (
                                    <p><span className={styles.metaLabel}>Von:</span> {txt.von || txt.from || txt.sender}</p>
                                )}
                                {(txt.an || txt.to || txt.recipient || txt.receiver) && (
                                    <p><span className={styles.metaLabel}>An:</span> {txt.an || txt.to || txt.recipient || txt.receiver}</p>
                                )}
                                {(txt.betreff || txt.subject) && (
                                    <p><span className={styles.metaLabel}>Betreff:</span> {txt.betreff || txt.subject}</p>
                                )}
                                {(txt.date || txt.datum) && (
                                    <p><span className={styles.metaLabel}>Datum:</span> {txt.date || txt.datum}</p>
                                )}
                                {(txt.author || txt.autor) && (
                                    <p><span className={styles.metaLabel}>Autor:</span> {txt.author || txt.autor}</p>
                                )}
                            </div>
                        )}

                        <div className={`${styles.textBody} ${styles.readingText}`}>
                            {isAdvancedLevel && paragraphs.length > 1 ? (
                                paragraphs.map((para: string, pIdx: number) => (
                                    <div key={pIdx} className={styles.numberedParagraph}>
                                        <span className={styles.paragraphNumber}>{pIdx + 1}</span>
                                        <p>{para}</p>
                                    </div>
                                ))
                            ) : (
                                textContent
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Structured Content Sub-Renderers ── */

function renderSchedule(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.title || 'Fahrplan'}</span>
                <span className={styles.badge}>📅 {data.type === 'delivery_schedule' ? 'Lieferplan' : 'Fahrplan'}</span>
            </div>
            <div className={styles.textBody}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr>
                                {data.columns.map((col: string, ci: number) => (
                                    <th key={ci} style={{
                                        padding: '8px 10px', textAlign: 'left',
                                        borderBottom: '2px solid #E5E7EB', background: '#F9FAFB',
                                        fontWeight: 700, fontSize: '12px', color: '#374151'
                                    }}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.rows.map((row: string[], ri: number) => (
                                <tr key={ri} style={{ background: ri % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                    {row.map((cell: string, ci: number) => (
                                        <td key={ci} style={{
                                            padding: '7px 10px', borderBottom: '1px solid #F3F4F6',
                                            color: cell === 'kostenlos' ? '#059669' : '#4B5563'
                                        }}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.footnote && (
                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5 }}>
                        ℹ️ {data.footnote}
                    </p>
                )}
            </div>
        </div>
    )
}

function renderInfotafel(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.title || 'Informationstafel'}</span>
                {data.location && <span className={styles.badge}>📍 {data.location}</span>}
            </div>
            <div className={styles.textBody}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                            {data.rows.map((row: any, ri: number) => (
                                <tr key={ri} style={{ background: ri % 2 === 0 ? 'white' : '#FAFAFA' }}>
                                    {Object.entries(row).map(([k, v]: [string, any], ci: number) => (
                                        <td key={ci} style={{
                                            padding: '7px 10px', borderBottom: '1px solid #F3F4F6',
                                            fontWeight: ci === 0 ? 600 : 400,
                                            color: ci === 0 ? '#1F2937' : '#4B5563'
                                        }}>
                                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.extra_info && (
                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
                        ℹ️ {typeof data.extra_info === 'string' ? data.extra_info : JSON.stringify(data.extra_info)}
                    </p>
                )}
            </div>
        </div>
    )
}

function renderDebate(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.topic || 'Leserbriefe'}</span>
                <span className={styles.badge}>💬 Debatte</span>
            </div>
            <div className={styles.textBody}>
                {data.context && (
                    <p style={{ marginBottom: '16px', color: '#4B5563', fontStyle: 'italic', fontSize: '13px', lineHeight: 1.6 }}>
                        {data.context}
                    </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.letters?.map((letter: any, li: number) => (
                        <div key={li} style={{
                            padding: '12px 14px', borderRadius: '10px',
                            background: '#FAFAFA', borderLeft: '3px solid #D1D5DB',
                        }}>
                            <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>
                                    {letter.author || letter.name || `Leser ${li + 1}`}
                                </span>
                                {letter.stance && (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                                        background: letter.stance === 'dafür' || letter.stance === 'pro' ? '#D1FAE5' : '#FEE2E2',
                                        color: letter.stance === 'dafür' || letter.stance === 'pro' ? '#065F46' : '#991B1B'
                                    }}>
                                        {letter.stance}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                                {letter.text || letter.content || letter.body || ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function renderForum(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.question || 'Forum'}</span>
                <span className={styles.badge}>🗣️ Forum</span>
            </div>
            <div className={styles.textBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.comments?.map((comment: any, ci: number) => (
                        <div key={ci} style={{
                            padding: '12px 14px', borderRadius: '10px',
                            background: ci % 2 === 0 ? '#F0FDF4' : '#FFF7ED',
                            borderLeft: `3px solid ${ci % 2 === 0 ? '#86EFAC' : '#FED7AA'}`
                        }}>
                            <div style={{ marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1F2937' }}>
                                    {comment.author || comment.name || comment.username || `User ${ci + 1}`}
                                </span>
                                {comment.stance && (
                                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px',
                                        background: comment.stance === 'dafür' || comment.stance === 'pro' ? '#D1FAE5' : '#FEE2E2',
                                        color: comment.stance === 'dafür' || comment.stance === 'pro' ? '#065F46' : '#991B1B'
                                    }}>
                                        {comment.stance}
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                                {comment.text || comment.content || comment.body || ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function renderOpinionTexts(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.question || 'Meinungen'}</span>
                <span className={styles.badge}>🎯 Zuordnung</span>
            </div>
            <div className={styles.textBody}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.texts?.map((item: any, ti: number) => (
                        <div key={ti} style={{
                            padding: '12px 14px', borderRadius: '10px',
                            background: '#FAFAFA', borderLeft: '3px solid #93C5FD',
                        }}>
                            <div style={{ marginBottom: '6px', fontWeight: 700, fontSize: '13px', color: '#1E40AF' }}>
                                {item.author || item.name || `Person ${String.fromCharCode(65 + ti)}`}
                            </div>
                            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
                                {item.text || item.opinion || item.content || ''}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function renderSections(data: any, key: number) {
    return (
        <div key={key} className={`${styles.textCard} ${styles.fadeInUp}`}>
            <div className={styles.textHeader}>
                <span className={styles.label}>{data.title || data.source || 'Information'}</span>
                {data.format && <span className={styles.badge}>{data.format}</span>}
            </div>
            <div className={`${styles.textBody} ${styles.readingText}`}>
                {data.sections?.map((section: any, si: number) => (
                    <div key={si} style={{ marginBottom: si < data.sections.length - 1 ? '14px' : 0 }}>
                        {section.heading && (
                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', marginBottom: '6px' }}>
                                {section.heading}
                            </h4>
                        )}
                        <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65 }}>
                            {section.text || section.content || section.body || ''}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Main Component ─────────────────────────────────
export function ReadingPlayer({
    exerciseId, cefrLevel, teil, teilName, topic,
    textsJson, imagesJson, questions,
}: ReadingPlayerProps) {
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('intro')
    const [warmupStep, setWarmupStep] = useState(0)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [clozeAnswers, setClozeAnswers] = useState<Record<string, string>>({})
    const [clozeResults, setClozeResults] = useState<{
        score: number; total: number; percentage: number; timeTaken: number;
        gaps: { pos: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]
    } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [results, setResults] = useState<{
        score: number; totalQuestions: number; percentage: number;
        timeTaken: number; questionResults: QuestionResult[]
    } | null>(null)
    const [expandedResult, setExpandedResult] = useState<string | null>(null)
    const [startTime] = useState(Date.now())
    const cefrColor = CEFR_COLORS[cefrLevel] ?? CEFR_COLORS.A1!
    const isBeginner = ['A1', 'A2'].includes(cefrLevel)
    const diff = DIFFICULTY[cefrLevel] ?? DIFFICULTY.A1!
    const teilInfo = isBeginner
        ? TEIL_DESCRIPTIONS.beginner?.[teil]
        : TEIL_DESCRIPTIONS.advanced?.[teil]
    const heroImage = useMemo(() => getHeroImage(imagesJson, cefrLevel), [imagesJson, cefrLevel])

    // ─── Cloze exercise detection ─────────
    const clozeData = useMemo(() => {
        if (questions.length > 0) return null
        const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
        const txt = texts[0]
        if (!txt) return null
        if (txt.text && txt.gaps && Array.isArray(txt.gaps)) return { type: 'word' as const, data: txt }
        if (txt.text && txt.sentences && txt.answers) return { type: 'sentence' as const, data: txt }
        if (txt.text && txt.sections && txt.answers) return { type: 'section' as const, data: txt }
        return null
    }, [textsJson, questions.length])

    const isClozeExercise = clozeData !== null
    const clozeGapCount = useMemo(() => {
        if (!clozeData) return 0
        if (clozeData.type === 'word') return clozeData.data.gaps.length
        return Object.keys(clozeData.data.answers || {}).length
    }, [clozeData])

    const estimatedMinutes = useMemo(() => {
        if (isClozeExercise) return Math.max(5, Math.ceil(clozeGapCount * 1.2))
        return Math.max(3, Math.ceil(questions.length * 1.5))
    }, [questions.length, isClozeExercise, clozeGapCount])
    const keyWords = useMemo(() => extractKeyWords(textsJson, cefrLevel), [textsJson, cefrLevel])
    const warmupQuestions = WARMUP_QUESTIONS[cefrLevel] ?? WARMUP_QUESTIONS.A1!

    // ─── Click-to-translate state ─────────
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)
    const [vocabList, setVocabList] = useState<LookedUpWord[]>([])
    const [showVocabPanel, setShowVocabPanel] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)

    // Close tooltip on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
                setTooltip(null)
            }
        }
        if (tooltip) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [tooltip])

    // Look up word translation
    const lookupWord = useCallback(async (word: string, x: number, y: number) => {
        const cleanWord = word.replace(/[.,!?;:()"'\u00AB\u00BB\u201E\u201C\[\]]/g, '').trim()
        if (!cleanWord || cleanWord.length < 2) return

        // Check if already in vocab list
        const existing = vocabList.find(v => v.word.toLowerCase() === cleanWord.toLowerCase())
        if (existing) {
            setTooltip({ word: cleanWord, translation: existing.translation, loading: false, x, y })
            return
        }

        setTooltip({ word: cleanWord, translation: null, loading: true, x, y })

        try {
            const res = await fetch(`/api/v1/translate?word=${encodeURIComponent(cleanWord)}`)
            const data = await res.json()
            const translation = data.translation || 'Keine \u00dcbersetzung gefunden'
            setTooltip({ word: cleanWord, translation, loading: false, x, y })
            setVocabList(prev => {
                if (prev.some(v => v.word.toLowerCase() === cleanWord.toLowerCase())) return prev
                return [...prev, { word: cleanWord, translation, timestamp: Date.now() }]
            })
        } catch {
            setTooltip({ word: cleanWord, translation: '\u00dcbersetzung nicht verf\u00fcgbar', loading: false, x, y })
        }
    }, [vocabList])

    // Handle text click — detect word at click position
    const handleTextClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        // Only handle clicks on text content areas
        if (!target.closest(`.${styles.textBody}`) && !target.closest(`.${styles.readingText}`)) return

        // Get word at click position
        let range: Range | null = null
        if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(e.clientX, e.clientY)
        }
        if (!range) return

        const textNode = range.startContainer
        if (textNode.nodeType !== Node.TEXT_NODE) return

        const text = textNode.textContent || ''
        const offset = range.startOffset

        // Find word boundaries
        let start = offset
        let end = offset
        while (start > 0 && /[\wÄÖÜäöüß]/.test(text[start - 1] || '')) start--
        while (end < text.length && /[\wÄÖÜäöüß]/.test(text[end] || '')) end++

        const word = text.slice(start, end)
        if (word.length >= 2) {
            lookupWord(word, e.clientX, e.clientY)
        }
    }, [lookupWord])

    const selectAnswer = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }))
    }

    const submitAnswers = useCallback(async () => {
        setIsSubmitting(true)
        try {
            const timeTaken = Math.round((Date.now() - startTime) / 1000)
            const res = await fetch(`/api/v1/reading/${exerciseId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, timeTaken }),
            })
            const data = await res.json()
            if (data.success) {
                setResults({ ...data.data, timeTaken })
                setPhase('results')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }, [answers, exerciseId, startTime])

    // Cloze answer handler
    const selectClozeAnswer = useCallback((gapId: string, answer: string) => {
        setClozeAnswers(prev => ({ ...prev, [gapId]: answer }))
    }, [])

    // Cloze submit — evaluate locally from JSON data
    const submitCloze = useCallback(() => {
        if (!clozeData) return
        setIsSubmitting(true)
        const timeTaken = Math.round((Date.now() - startTime) / 1000)

        let correctAnswers: Record<string, string> = {}
        if (clozeData.type === 'word') {
            for (const gap of clozeData.data.gaps) {
                correctAnswers[String(gap.pos)] = gap.answer
            }
        } else {
            correctAnswers = { ...clozeData.data.answers }
        }

        const gaps = Object.keys(correctAnswers).map(pos => ({
            pos,
            userAnswer: clozeAnswers[pos] || '',
            correctAnswer: correctAnswers[pos] || '',
            isCorrect: (clozeAnswers[pos] || '').toLowerCase() === (correctAnswers[pos] || '').toLowerCase(),
        }))

        const score = gaps.filter(g => g.isCorrect).length
        const total = gaps.length
        setClozeResults({ score, total, percentage: Math.round((score / total) * 100), timeTaken, gaps })
        setPhase('results')
        setIsSubmitting(false)
    }, [clozeData, clozeAnswers, startTime])

    const allAnswered = isClozeExercise
        ? Object.keys(clozeAnswers).length >= clozeGapCount
        : questions.every(q => answers[q.id])
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

    // ═══════════════════════════════════════════
    // INTRO PHASE — Level-Adaptive Premium Design
    // ═══════════════════════════════════════════
    if (phase === 'intro') {
        return (
            <div className={`max-w-lg mx-auto ${styles.fadeInUp}`}>
                <button onClick={() => router.push('/reading')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Zurück
                </button>

                <div
                    className={styles.introCard}
                    style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}
                >
                    {/* Mascot */}
                    <Mascot variant="lesen" size={72} className="mx-auto" />

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">{topic}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {teilInfo?.icon || '📖'} Teil {teil} — {teilName}
                    </p>

                    {/* Hero Image — only for A1/A2 or when available */}
                    {heroImage && isBeginner && (
                        <div className={styles.introImage}>
                            <img src={heroImage} alt={topic} loading="eager" />
                        </div>
                    )}

                    {/* Exercise Info Pills */}
                    <div className={styles.exerciseInfo}>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white`}
                            style={{ background: cefrColor.css }}>
                            {cefrLevel}
                        </span>
                        <span className={styles.infoPill}>
                            ❓ {isClozeExercise ? `${clozeGapCount} Lücken` : `${questions.length} Fragen`}
                        </span>
                        <span className={styles.infoPill}>
                            ⏱️ ~{estimatedMinutes} Min.
                        </span>
                        <span className={styles.infoPill}>
                            {Array.from({ length: 5 }, (_, i) => (
                                <span key={i} style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: i < diff.dots ? diff.color : '#e5e7eb',
                                    display: 'inline-block', marginRight: 2
                                }} />
                            ))}
                            <span style={{ marginLeft: 4 }}>{diff.label}</span>
                        </span>
                    </div>

                    {/* Genre badge for B1+ */}
                    {!isBeginner && teilInfo?.genre && (
                        <div className={styles.topicBadge} style={{ background: cefrColor.bg, color: cefrColor.text }}>
                            {teilInfo.icon} {teilInfo.genre}
                        </div>
                    )}

                    {/* Reading Strategy Tip */}
                    {teilInfo?.strategy && (
                        <div className={styles.strategyTip}>
                            <p className={styles.tipIcon}>💡 Lese-Strategie</p>
                            <p className={styles.tipText}>{teilInfo.strategy}</p>
                        </div>
                    )}

                    {/* Start Button — goes to warm-up */}
                    <button
                        onClick={() => setPhase('warmup')}
                        className={styles.startButton}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}
                    >
                        📖 Aufgabe starten
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // WARM-UP PHASE — Pre-reading activation
    // ═══════════════════════════════════════════
    if (phase === 'warmup') {
        const totalSteps = 3 // vocab → activation → focus
        const warmupProgress = ((warmupStep + 1) / totalSteps) * 100

        return (
            <div className={`max-w-lg mx-auto ${styles.fadeInUp}`}>
                {/* Top bar */}
                <div className="flex items-center gap-4 mb-5">
                    <button onClick={() => setPhase('intro')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${warmupProgress}%`, background: cefrColor.css }} />
                        </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">Vorbereitung {warmupStep + 1}/{totalSteps}</span>
                </div>

                {/* Step 0: Vocabulary Preview */}
                {warmupStep === 0 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">📚</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Wörter zum Thema' : 'Schlüsselvokabeln'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {isBeginner
                                ? 'Kennst du diese Wörter? Sie kommen im Text vor.'
                                : 'Diese Begriffe sind wichtig für den Text.'}
                        </p>

                        {keyWords.length > 0 ? (
                            <div className={styles.vocabPreview}>
                                {keyWords.map((word, i) => (
                                    <span key={i} className={styles.vocabChip}
                                        style={{ animationDelay: `${i * 0.05}s` }}>
                                        {word}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.strategyTip}>
                                <p className={styles.tipIcon}>💡 Tipp</p>
                                <p className={styles.tipText}>Lies den Titel noch einmal und überlege, welche Wörter du zum Thema kennst.</p>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setPhase('exercise')}
                                className={`${styles.navButton} text-xs`}>Überspringen</button>
                            <button onClick={() => setWarmupStep(1)}
                                className={`${styles.navButton} ${styles.primary}`}>Weiter →</button>
                        </div>
                    </div>
                )}

                {/* Step 1: Activation Question */}
                {warmupStep === 1 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">🤔</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Denk nach!' : 'Vor dem Lesen'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {isBeginner
                                ? `Das Thema ist: "${topic}". Beantworte diese Frage für dich.`
                                : `Zum Thema "${topic}" — reflektieren Sie kurz:`}
                        </p>

                        <div className="space-y-3">
                            {warmupQuestions.map((q, i) => (
                                <div key={i} className={styles.warmupQuestion}>
                                    <span className="text-sm">💬</span>
                                    <span className="text-sm text-gray-700">{q}</span>
                                </div>
                            ))}
                        </div>

                        {/* Hero image for A1/A2 */}
                        {heroImage && isBeginner && (
                            <div className={styles.introImage}>
                                <img src={heroImage} alt={topic} loading="eager" />
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setWarmupStep(0)}
                                className={styles.navButton}>← Zurück</button>
                            <button onClick={() => setWarmupStep(2)}
                                className={`${styles.navButton} ${styles.primary}`}>Weiter →</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Reading Focus */}
                {warmupStep === 2 && (
                    <div className={`${styles.introCard} ${styles.slideInRight}`}
                        style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                        <div className="text-3xl mb-3">🎯</div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            {isBeginner ? 'Darauf musst du achten' : 'Lesefokus'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {isBeginner
                                ? 'So gehst du beim Lesen vor:'
                                : 'Beachten Sie beim Lesen besonders:'}
                        </p>

                        {/* Strategy tip */}
                        {teilInfo?.strategy && (
                            <div className={styles.strategyTip}>
                                <p className={styles.tipIcon}>💡 Lese-Strategie</p>
                                <p className={styles.tipText}>{teilInfo.strategy}</p>
                            </div>
                        )}

                        {/* Reading checklist */}
                        <div className="mt-4 space-y-2">
                            {isBeginner ? (
                                <>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Lies den Text langsam und aufmerksam.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Unbekannte Wörter? Lies den Satz noch einmal.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Du hast {questions.length} Fragen — nimm dir Zeit!</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Überfliegen Sie den Text zuerst (Scanning).</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Markieren Sie Signalwörter und Schlüsselsätze.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>Lesen Sie die Fragen, bevor Sie den Text detailliert lesen.</span>
                                    </div>
                                    <div className={styles.warmupChecklist}>
                                        <span>✅</span><span>{questions.length} Fragen — ca. {estimatedMinutes} Minuten empfohlen.</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Exercise info */}
                        <div className={styles.exerciseInfo} style={{ marginTop: 20 }}>
                            <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                                style={{ background: cefrColor.css }}>
                                {cefrLevel}
                            </span>
                            <span className={styles.infoPill}>❓ {isClozeExercise ? `${clozeGapCount} Lücken` : `${questions.length} Fragen`}</span>
                            <span className={styles.infoPill}>⏱️ ~{estimatedMinutes} Min.</span>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setWarmupStep(1)}
                                className={styles.navButton}>← Zurück</button>
                            <button onClick={() => setPhase('exercise')}
                                className={styles.startButton}
                                style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                                📖 Jetzt lesen!
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // EXERCISE PHASE — Adaptive layout per level
    // ═══════════════════════════════════════════
    if (phase === 'exercise') {
        const isAdvanced = ['C1', 'C2'].includes(cefrLevel)

        // ═══════════════════════════════════════════
        // CLOZE EXERCISE MODE — all gaps on one page
        // ═══════════════════════════════════════════
        if (isClozeExercise && clozeData) {
            const clozeProgress = clozeGapCount > 0 ? (Object.keys(clozeAnswers).length / clozeGapCount) * 100 : 0
            const clozeTypeLabel = clozeData.type === 'word' ? '📝 Lückentext (Wörter)'
                : clozeData.type === 'sentence' ? '📝 Lückentext (Sätze)' : '📝 Lückentext (Abschnitte)'

            // Render word cloze: text with inline dropdown selectors
            const renderWordClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                return (
                    <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                        <div className={styles.textHeader}>
                            <span className={styles.label}>{d.title || 'Lückentext'}</span>
                            <span className={styles.badge}>{clozeTypeLabel}</span>
                        </div>
                        <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 2.2 }}>
                            {parts.map((part: string, i: number) => {
                                const match = part.match(/^\{(\d+)\}$/)
                                if (!match) return <span key={i}>{part}</span>
                                const gapNum = match[1]!
                                const gap = d.gaps.find((g: any) => String(g.pos) === gapNum)
                                if (!gap) return <span key={i} style={{ color: 'red' }}>[?]</span>
                                const selected = clozeAnswers[gapNum]
                                return (
                                    <span key={i} className={styles.clozeGapInline}>
                                        <span className={styles.clozeGapNumber}>{gapNum}</span>
                                        <span className={styles.clozeGapOptions}>
                                            {Object.entries(gap.options).map(([key, val]: [string, any]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => selectClozeAnswer(gapNum!, key)}
                                                    className={`${styles.clozeOptionBtn} ${selected === key ? styles.clozeOptionSelected : ''}`}
                                                >
                                                    <span className={styles.clozeOptionKey}>{key}</span> {val}
                                                </button>
                                            ))}
                                        </span>
                                    </span>
                                )
                            })}
                        </div>
                    </div>
                )
            }

            // Render sentence cloze: text with numbered slots + sentence bank
            const renderSentenceClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                const usedSentences = new Set(Object.values(clozeAnswers))
                return (
                    <div className="space-y-5">
                        <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>{d.title || 'Lückentext'}</span>
                                <span className={styles.badge}>{clozeTypeLabel}</span>
                            </div>
                            <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 2 }}>
                                {parts.map((part: string, i: number) => {
                                    const match = part.match(/^\{(\d+)\}$/)
                                    if (!match) return <span key={i}>{part}</span>
                                    const gapNum = match[1]!
                                    const selectedId = clozeAnswers[gapNum]
                                    const selectedSentence = selectedId
                                        ? d.sentences.find((s: any) => s.id === selectedId)
                                        : null
                                    return (
                                        <span key={i} className={styles.clozeSlot}>
                                            <span className={styles.clozeSlotNumber}>{gapNum}</span>
                                            {selectedSentence ? (
                                                <span className={styles.clozeSlotFilled}>
                                                    <span className={styles.clozeSlotId}>{selectedId}</span>
                                                    {selectedSentence.text.slice(0, 60)}…
                                                    <button onClick={() => selectClozeAnswer(gapNum, '')} className={styles.clozeSlotClear}>×</button>
                                                </span>
                                            ) : (
                                                <span className={styles.clozeSlotEmpty}>Satz wählen ▼</span>
                                            )}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Sentence bank */}
                        <div className={`${styles.textCard} ${styles.fadeInUp}`} style={{ animationDelay: '0.1s' }}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>Satzbank</span>
                                <span className={styles.badge}>📋 {d.sentences.length} Sätze</span>
                            </div>
                            <div className={styles.textBody}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {d.sentences.map((s: any) => {
                                        const isUsed = usedSentences.has(s.id)
                                        // Find which gap this sentence is assigned to
                                        const assignedGap = Object.entries(clozeAnswers).find(([, v]) => v === s.id)?.[0]
                                        return (
                                            <div key={s.id}
                                                className={`${styles.clozeBankItem} ${isUsed ? styles.clozeBankUsed : ''}`}
                                                style={{ opacity: isUsed ? 0.5 : 1 }}
                                            >
                                                <span className={styles.clozeBankId}>{s.id}</span>
                                                <span className={styles.clozeBankText}>{s.text}</span>
                                                {isUsed && assignedGap && (
                                                    <span className={styles.clozeBankAssigned}>→ Lücke {assignedGap}</span>
                                                )}
                                                {!isUsed && (
                                                    <div className={styles.clozeBankActions}>
                                                        {Array.from({ length: Object.keys(clozeData.data.answers).length }, (_, i) => String(i + 1))
                                                            .filter(g => !clozeAnswers[g])
                                                            .map(g => (
                                                                <button key={g} onClick={() => selectClozeAnswer(g, s.id)}
                                                                    className={styles.clozeBankAssignBtn}
                                                                >→ {g}</button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            // Render section cloze: text with paragraph slots + section bank
            const renderSectionClozeInteractive = () => {
                const d = clozeData.data
                const parts = d.text.split(/(\{\d+\})/)
                const usedSections = new Set(Object.values(clozeAnswers))
                return (
                    <div className="space-y-5">
                        <div className={`${styles.textCard} ${styles.fadeInUp}`}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>{d.title || 'Lückentext'}</span>
                                <span className={styles.badge}>{clozeTypeLabel}</span>
                            </div>
                            <div className={`${styles.textBody} ${styles.readingText}`} style={{ lineHeight: 1.9 }}>
                                {parts.map((part: string, i: number) => {
                                    const match = part.match(/^\{(\d+)\}$/)
                                    if (!match) return <span key={i}>{part}</span>
                                    const gapNum = match[1]!
                                    const selectedId = clozeAnswers[gapNum]
                                    const selectedSection = selectedId
                                        ? d.sections.find((s: any) => s.id === selectedId)
                                        : null
                                    return (
                                        <div key={i} className={styles.clozeSectionSlot}>
                                            <span className={styles.clozeSlotNumber} style={{ fontSize: '14px' }}>{gapNum}</span>
                                            {selectedSection ? (
                                                <div className={styles.clozeSectionFilled}>
                                                    <span className={styles.clozeSlotId}>{selectedId}</span>
                                                    <span>{selectedSection.text.slice(0, 120)}…</span>
                                                    <button onClick={() => selectClozeAnswer(gapNum, '')} className={styles.clozeSlotClear}>×</button>
                                                </div>
                                            ) : (
                                                <div className={styles.clozeSectionEmpty}>Abschnitt wählen ▼</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {/* Section bank */}
                        <div className={`${styles.textCard} ${styles.fadeInUp}`} style={{ animationDelay: '0.1s' }}>
                            <div className={styles.textHeader}>
                                <span className={styles.label}>Abschnittbank</span>
                                <span className={styles.badge}>📄 {d.sections.length} Abschnitte</span>
                            </div>
                            <div className={styles.textBody}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {d.sections.map((s: any) => {
                                        const isUsed = usedSections.has(s.id)
                                        const assignedGap = Object.entries(clozeAnswers).find(([, v]) => v === s.id)?.[0]
                                        return (
                                            <div key={s.id}
                                                className={`${styles.clozeBankItem} ${isUsed ? styles.clozeBankUsed : ''}`}
                                                style={{ opacity: isUsed ? 0.45 : 1 }}
                                            >
                                                <span className={styles.clozeBankId}>{s.id}</span>
                                                <span className={styles.clozeBankText} style={{ fontSize: '12px' }}>{s.text}</span>
                                                {isUsed && assignedGap && (
                                                    <span className={styles.clozeBankAssigned}>→ Lücke {assignedGap}</span>
                                                )}
                                                {!isUsed && (
                                                    <div className={styles.clozeBankActions}>
                                                        {Array.from({ length: Object.keys(clozeData.data.answers).length }, (_, i) => String(i + 1))
                                                            .filter(g => !clozeAnswers[g])
                                                            .map(g => (
                                                                <button key={g} onClick={() => selectClozeAnswer(g, s.id)}
                                                                    className={styles.clozeBankAssignBtn}
                                                                >→ {g}</button>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            return (
                <div className="relative">
                    {/* Top bar */}
                    <div className="flex items-center gap-4 mb-5">
                        <button onClick={() => router.push('/reading')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${clozeProgress}%`, background: cefrColor.css }} />
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 shrink-0">
                            {Object.keys(clozeAnswers).length}/{clozeGapCount} Lücken
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                            style={{ background: cefrColor.css }}>
                            {cefrLevel}
                        </span>
                    </div>

                    {/* Timer + info */}
                    <div className="flex items-center justify-between mb-3">
                        <div className={styles.translateHint}>
                            📝 Füllen Sie alle {clozeGapCount} Lücken aus
                        </div>
                        <div className={styles.readingTimer}>
                            ⏱️ {formatTime(Math.round((Date.now() - startTime) / 1000))}
                        </div>
                    </div>

                    {/* Cloze content */}
                    <div className="space-y-5" onClick={handleTextClick} style={{ cursor: 'text' }}>
                        {renderImages(imagesJson, cefrLevel, 'header')}
                        {clozeData.type === 'word' && renderWordClozeInteractive()}
                        {clozeData.type === 'sentence' && renderSentenceClozeInteractive()}
                        {clozeData.type === 'section' && renderSectionClozeInteractive()}
                    </div>

                    {/* Submit button */}
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={submitCloze}
                            disabled={!allAnswered || isSubmitting}
                            className={`${styles.navButton} ${styles.submit}`}
                            style={{ minWidth: 250, padding: '14px 32px', fontSize: '15px' }}
                        >
                            {isSubmitting ? 'Wird geprüft...' : `✅ Abgeben (${Object.keys(clozeAnswers).length}/${clozeGapCount})`}
                        </button>
                    </div>
                </div>
            )
        }

        // ═══════════════════════════════════════════
        // NORMAL EXERCISE MODE — per-question navigation
        // ═══════════════════════════════════════════
        const q = questions[currentQuestion]
        const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0
        const elapsed = Math.round((Date.now() - startTime) / 1000)


        // Shared question panel JSX
        const questionPanel = q && (
            <div className={styles.questionPanel}>
                {/* Progress dots */}
                <div className={styles.progressDots}>
                    <span className="text-xs text-gray-500 font-semibold mr-2">
                        Frage {currentQuestion + 1}
                    </span>
                    {questions.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i === currentQuestion ? styles.active : answers[questions[i]?.id ?? ''] ? styles.answered : ''}`}
                        />
                    ))}
                </div>

                {/* Linked text label */}
                {q.linkedText && (
                    <div className={styles.linkedBadge}>
                        → {q.linkedText}
                    </div>
                )}

                {/* Question statement */}
                <p className="text-base font-bold text-gray-900 mb-5 leading-relaxed">{q.statement}</p>

                {/* Answer buttons */}
                {q.questionType === 'true_false' || q.questionType === 'richtig_falsch' ? (
                    /* ── Richtig/Falsch ── */
                    <div className="flex gap-3">
                        <button
                            onClick={() => selectAnswer(q.id, 'richtig')}
                            className={`${styles.rfButton} ${styles.richtig} ${answers[q.id] === 'richtig' ? styles.selected : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Richtig
                        </button>
                        <button
                            onClick={() => selectAnswer(q.id, 'falsch')}
                            className={`${styles.rfButton} ${styles.falsch} ${answers[q.id] === 'falsch' ? styles.selected : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Falsch
                        </button>
                    </div>

                ) : q.questionType === 'matching_ab' || q.questionType === 'matching' ? (
                    /* ── Matching: assign to Text A / B / C... ── */
                    (() => {
                        const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
                        const labels = texts.map((t: any, i: number) =>
                            t.label || t.title || `Text ${String.fromCharCode(65 + i)}`
                        )
                        return (
                            <div className="flex gap-2 flex-wrap">
                                {labels.map((label: string, i: number) => {
                                    const key = String.fromCharCode(65 + i) // A, B, C...
                                    const isSelected = answers[q.id]?.toUpperCase() === key
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => selectAnswer(q.id, key)}
                                            className={`${styles.matchingButton} ${isSelected ? styles.selected : ''}`}
                                        >
                                            <span className={styles.matchingLetter}>{key}</span>
                                            <span className="text-xs truncate max-w-[140px]">{label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    })()

                ) : q.questionType === 'ja_nein' ? (
                    /* ── Ja / Nein / Nicht im Text ── */
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: 'ja', label: 'Ja', icon: '✅' },
                            { value: 'nein', label: 'Nein', icon: '❌' },
                            { value: 'nicht_im_text', label: 'Nicht im Text', icon: '◻️' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => selectAnswer(q.id, opt.value)}
                                className={`${styles.janeinButton} ${answers[q.id] === opt.value ? styles.selected : ''}`}
                            >
                                <span className="text-base">{opt.icon}</span>
                                <span className="text-sm font-medium">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                ) : q.options && q.options.length > 0 ? (
                    /* ── Multiple Choice / Detail Extraction ── */
                    <div className="space-y-2.5">
                        {q.options.map((opt, i) => {
                            const optionKey = String.fromCharCode(97 + i)
                            const isSelected = answers[q.id] === optionKey
                            return (
                                <button
                                    key={i}
                                    onClick={() => selectAnswer(q.id, optionKey)}
                                    className={`${styles.answerOption} ${isSelected ? styles.selected : ''}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg border-2 shrink-0 flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'border-[#FF6B35] bg-[#FF6B35] text-white' : 'border-gray-300 text-gray-500'
                                        }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`text-sm ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {opt}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                ) : (
                    /* ── Fallback: text input ── */
                    <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => selectAnswer(q.id, e.target.value)}
                        placeholder="Deine Antwort..."
                        className="w-full p-3.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 outline-none transition-all"
                    />
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                    {currentQuestion > 0 && (
                        <button
                            onClick={() => setCurrentQuestion(c => c - 1)}
                            className={styles.navButton}
                        >
                            ← Vorherige
                        </button>
                    )}
                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(c => c + 1)}
                            className={`${styles.navButton} ${styles.primary}`}
                        >
                            Weiter →
                        </button>
                    ) : (
                        <button
                            onClick={submitAnswers}
                            disabled={!allAnswered || isSubmitting}
                            className={`${styles.navButton} ${styles.submit}`}
                        >
                            {isSubmitting ? 'Wird geprüft...' : `✅ Abgeben (${Object.keys(answers).length}/${questions.length})`}
                        </button>
                    )}
                </div>

                {/* Mascot peek */}
                <div className="flex justify-center mt-4 opacity-60">
                    <Mascot variant="thinking" size={40} />
                </div>
            </div>
        )

        return (
            <div className="relative">
                {/* ── Top Progress Bar ── */}
                <div className="flex items-center gap-4 mb-5">
                    <button onClick={() => router.push('/reading')} className="text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%`, background: cefrColor.css }}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 shrink-0">
                        {currentQuestion + 1}/{questions.length}
                    </span>
                    {/* Vocab panel toggle */}
                    <button
                        onClick={() => setShowVocabPanel(v => !v)}
                        className={styles.vocabToggle}
                        title="Vokabeln"
                    >
                        📖 {vocabList.length > 0 && <span className={styles.vocabBadge}>{vocabList.length}</span>}
                    </button>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
                        style={{ background: cefrColor.css }}>
                        {cefrLevel}
                    </span>
                </div>

                {/* Click-to-translate hint + reading timer */}
                <div className="flex items-center justify-between mb-3">
                    {vocabList.length === 0 ? (
                        <div className={styles.translateHint}>
                            💡 Klicke auf ein Wort im Text, um die Übersetzung zu sehen
                        </div>
                    ) : <div />}
                    <div className={styles.readingTimer}>
                        ⏱️ {formatTime(Math.round((Date.now() - startTime) / 1000))}
                    </div>
                </div>

                <div onClick={handleTextClick} style={{ cursor: 'text' }}>
                    {isAdvanced ? (
                        /* \u2550\u2550\u2550 C1/C2: Full-width reader mode \u2550\u2550\u2550 */
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {renderAnzeigenCards(textsJson, imagesJson, cefrLevel)}
                                {renderSchilderCards(textsJson, imagesJson, cefrLevel)}
                                {renderTexts(textsJson, cefrLevel)}
                                {renderImages(imagesJson, cefrLevel, 'header')}
                            </div>
                            <div className="max-w-2xl mx-auto">
                                {questionPanel}
                            </div>
                        </div>
                    ) : (
                        /* \u2550\u2550\u2550 A1-B2: Two-column layout \u2550\u2550\u2550 */
                        <div className="flex flex-col lg:flex-row gap-5">
                            <div className="lg:w-3/5 space-y-4">
                                {renderAnzeigenCards(textsJson, imagesJson, cefrLevel)}
                                {renderSchilderCards(textsJson, imagesJson, cefrLevel)}
                                {renderTexts(textsJson, cefrLevel)}
                            </div>
                            <div className="lg:w-2/5 lg:sticky lg:top-6 lg:self-start">
                                {questionPanel}
                                {renderImages(imagesJson, cefrLevel, 'header')}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Translation Tooltip ── */}
                {tooltip && (
                    <div
                        ref={tooltipRef}
                        className={styles.translateTooltip}
                        style={{
                            left: Math.min(tooltip.x, window.innerWidth - 220),
                            top: tooltip.y - 70,
                            position: 'fixed',
                        }}
                    >
                        <div className="font-bold text-sm text-gray-900">{tooltip.word}</div>
                        {tooltip.loading ? (
                            <div className="text-xs text-gray-400 animate-pulse">Übersetzen...</div>
                        ) : (
                            <div className="text-xs text-gray-600">{tooltip.translation}</div>
                        )}
                    </div>
                )}

                {/* ── Vocab Panel Sidebar ── */}
                {showVocabPanel && (
                    <div className={styles.vocabPanel}>
                        <div className={styles.vocabPanelHeader}>
                            <h3 className="text-sm font-bold text-gray-900">📖 Nachgeschlagene Wörter</h3>
                            <button onClick={() => setShowVocabPanel(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        {vocabList.length === 0 ? (
                            <p className="text-xs text-gray-400 p-4 text-center">
                                Klicke auf Wörter im Text, um sie hier zu sammeln.
                            </p>
                        ) : (
                            <div className={styles.vocabPanelList}>
                                {vocabList.map((v, i) => (
                                    <div key={i} className={styles.vocabPanelItem}>
                                        <span className="font-semibold text-gray-800">{v.word}</span>
                                        <span className="text-gray-500">{v.translation}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE — Cloze exercises
    // ═══════════════════════════════════════════
    if (phase === 'results' && clozeResults) {
        const { score, total, percentage, timeTaken, gaps } = clozeResults
        const message = percentage >= 90 ? 'Ausgezeichnet! 🌟' :
            percentage >= 70 ? 'Sehr gut! 👏' :
                percentage >= 50 ? 'Gut gemacht! 💪' :
                    'Weiter üben! 📚'
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encouragement' : 'studying'
        const tips = POST_READING_TIPS[cefrLevel] || POST_READING_TIPS.A1!

        // Get display label for a cloze answer
        const getAnswerLabel = (gap: typeof gaps[0]) => {
            if (clozeData?.type === 'word') {
                const gapInfo = clozeData.data.gaps?.find((g: any) => String(g.pos) === gap.pos)
                const userLabel = gapInfo?.options?.[gap.userAnswer] || gap.userAnswer
                const correctLabel = gapInfo?.options?.[gap.correctAnswer] || gap.correctAnswer
                return { userLabel: `${gap.userAnswer}) ${userLabel}`, correctLabel: `${gap.correctAnswer}) ${correctLabel}` }
            }
            if (clozeData?.type === 'sentence') {
                const userSentence = clozeData.data.sentences?.find((s: any) => s.id === gap.userAnswer)
                const correctSentence = clozeData.data.sentences?.find((s: any) => s.id === gap.correctAnswer)
                return {
                    userLabel: `${gap.userAnswer}: ${(userSentence?.text || '?').slice(0, 60)}…`,
                    correctLabel: `${gap.correctAnswer}: ${(correctSentence?.text || '?').slice(0, 60)}…`,
                }
            }
            // section cloze
            const userSection = clozeData?.data.sections?.find((s: any) => s.id === gap.userAnswer)
            const correctSection = clozeData?.data.sections?.find((s: any) => s.id === gap.correctAnswer)
            return {
                userLabel: `${gap.userAnswer}: ${(userSection?.text || '?').slice(0, 50)}…`,
                correctLabel: `${gap.correctAnswer}: ${(correctSection?.text || '?').slice(0, 50)}…`,
            }
        }

        return (
            <div className="max-w-3xl mx-auto">
                {/* Celebration Header */}
                <div className={styles.introCard} style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                    {percentage >= 60 && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div key={i} className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 60}%`,
                                        backgroundColor: ['#FF6B35', '#4CAF50', '#2EC4B6', '#9C27B0', '#FF9800', '#004E89'][i % 6],
                                        opacity: 0.3 + Math.random() * 0.4,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <Mascot variant={mascotVariant} size={80} className="mx-auto relative z-10" />

                    {/* Score Ring */}
                    <div className={`relative w-28 h-28 mx-auto mt-4 ${styles.scoreRing}`}
                        style={{ '--ring-color': cefrColor.shadow } as React.CSSProperties}>
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle cx="56" cy="56" r="48"
                                stroke={percentage >= 70 ? '#10B981' : percentage >= 50 ? '#FF6B35' : '#EF4444'}
                                strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-gray-900">{percentage}%</span>
                            <span className="text-xs text-gray-500">{score}/{total}</span>
                        </div>
                    </div>

                    <p className="text-xl font-bold text-gray-900 text-center mt-3">{message}</p>
                    <p className="text-sm text-gray-500 text-center mt-1">
                        📝 Lückentext • ⏱️ {formatTime(timeTaken)}
                    </p>
                </div>

                {/* Gap-by-gap feedback */}
                <div className="mt-6 space-y-3">
                    <h3 className="text-base font-bold text-gray-800 mb-3">📋 Lücken-Auswertung</h3>
                    {gaps.map((gap) => {
                        const { userLabel, correctLabel } = getAnswerLabel(gap)
                        return (
                            <div key={gap.pos}
                                className={`${styles.clozeResultCard} ${gap.isCorrect ? styles.clozeResultCorrect : styles.clozeResultWrong}`}>
                                <div className={styles.clozeResultGapNum}>{gap.pos}</div>
                                <div className={styles.clozeResultContent}>
                                    {gap.isCorrect ? (
                                        <div>
                                            <span className="font-semibold text-green-800">✅ {userLabel}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <div><span className="font-semibold text-red-700">❌ Ihre Antwort:</span> {userLabel || '(leer)'}</div>
                                            <div className="mt-1"><span className="font-semibold text-green-700">✅ Richtig:</span> {correctLabel}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Tips */}
                <div className={`mt-6 ${styles.introCard}`}>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">💡 Nächste Schritte</h3>
                    <ul className="space-y-2">
                        {tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <span>•</span><span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-6 justify-center">
                    <button onClick={() => router.push('/reading')} className={styles.navButton}>
                        ← Zur Übersicht
                    </button>
                    <button onClick={() => {
                        setClozeAnswers({})
                        setClozeResults(null)
                        setPhase('exercise')
                    }} className={`${styles.navButton} ${styles.primary}`}>
                        🔄 Nochmal üben
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════
    // RESULTS PHASE — Normal exercises
    // ═══════════════════════════════════════════
    if (phase === 'results' && results) {
        const { score, totalQuestions, percentage, questionResults } = results
        const message = percentage >= 90 ? 'Ausgezeichnet! 🌟' :
            percentage >= 70 ? 'Sehr gut! 👏' :
                percentage >= 50 ? 'Gut gemacht! 💪' :
                    'Weiter üben! 📚'
        const mascotVariant = percentage >= 70 ? 'celebrate' : percentage >= 50 ? 'encouragement' : 'studying'

        return (
            <div className="max-w-3xl mx-auto">
                {/* ── Celebration Header ── */}
                <div className={styles.introCard} style={{ '--level-gradient': cefrColor.css, '--level-shadow': cefrColor.shadow } as React.CSSProperties}>
                    {/* Confetti background */}
                    {percentage >= 60 && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 60}%`,
                                        backgroundColor: ['#FF6B35', '#4CAF50', '#2EC4B6', '#9C27B0', '#FF9800', '#004E89'][i % 6],
                                        opacity: 0.3 + Math.random() * 0.4,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <Mascot variant={mascotVariant} size={80} className="mx-auto relative z-10" />

                    {/* Score Ring — level-colored */}
                    <div className={`relative w-28 h-28 mx-auto mt-4 ${styles.scoreRing}`}
                        style={{ '--ring-color': cefrColor.shadow } as React.CSSProperties}>
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                            <circle cx="56" cy="56" r="48" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle
                                cx="56" cy="56" r="48"
                                stroke={percentage >= 70 ? '#10B981' : percentage >= 50 ? '#FF6B35' : '#EF4444'}
                                strokeWidth="8" fill="none"
                                strokeDasharray={`${2 * Math.PI * 48}`}
                                strokeDashoffset={`${2 * Math.PI * 48 * (1 - percentage / 100)}`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-gray-900">{score}/{totalQuestions}</span>
                            <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-4">{message}</h2>

                    {/* Badges — level-colored */}
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{ background: cefrColor.css }}>
                            {cefrLevel} · Lesen · Teil {teil}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            {topic}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#FF6B35]">
                            +{Math.round(score * 4)} XP
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-center gap-4 mt-5">
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">⏱️ {formatTime(results.timeTaken)}</p>
                            <p className="text-[10px] text-gray-500">Zeit</p>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">📊 {percentage}%</p>
                            <p className="text-[10px] text-gray-500">Ergebnis</p>
                        </div>
                        <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-center">
                            <p className="text-lg font-bold text-gray-900">✅ {score}</p>
                            <p className="text-[10px] text-gray-500">Richtig</p>
                        </div>
                    </div>
                </div>

                {/* ── Question Breakdown ── */}
                <div className="mt-5">
                    <div className={styles.questionPanel}>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Antworten-Übersicht</h3>
                        <div className="space-y-2.5">
                            {questionResults.map((qr) => (
                                <button
                                    key={qr.questionId}
                                    onClick={() => setExpandedResult(expandedResult === qr.questionId ? null : qr.questionId)}
                                    className={`${styles.resultCard} ${qr.isCorrect ? styles.correct : styles.incorrect}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-base mt-0.5">{qr.isCorrect ? '✅' : '❌'}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Q{qr.questionNumber} — {qr.statement}
                                            </p>
                                            {qr.isCorrect ? (
                                                <p className="text-xs text-green-600 mt-1 font-medium">
                                                    {qr.correctAnswer}
                                                </p>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-red-500 mt-1">
                                                        Deine Antwort: <span className="font-medium">{qr.userAnswer}</span>
                                                    </p>
                                                    <p className="text-xs text-green-600 mt-0.5">
                                                        Richtig: <span className="font-medium">{qr.correctAnswer}</span>
                                                    </p>
                                                </>
                                            )}

                                            {/* Expanded explanation */}
                                            {expandedResult === qr.questionId && qr.explanation && (
                                                <div className={styles.explanation}>
                                                    <p className="font-bold text-yellow-700 mb-1">💡 Erklärung</p>
                                                    {typeof qr.explanation === 'object' && qr.explanation !== null ? (
                                                        <>
                                                            {(qr.explanation as ExplanationData).key_evidence && (
                                                                <p className="mt-1">
                                                                    <span className="font-semibold">Schlüsselstelle:</span>{' '}
                                                                    <span className={styles.evidenceHighlight}>{(qr.explanation as ExplanationData).key_evidence}</span>
                                                                </p>
                                                            )}
                                                            {(qr.explanation as ExplanationData).reasoning && (
                                                                <p className="mt-1">{(qr.explanation as ExplanationData).reasoning}</p>
                                                            )}
                                                            {(qr.explanation as ExplanationData).vocabulary_help && (
                                                                <div className="mt-2 pt-2 border-t border-yellow-200">
                                                                    <p className="font-semibold text-yellow-700">📖 Vokabeln</p>
                                                                    {Object.entries((qr.explanation as ExplanationData).vocabulary_help!).map(([word, meaning]) => (
                                                                        <p key={word} className="mt-0.5">
                                                                            <span className="font-medium">{word}</span> — {meaning}
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <p>{String(qr.explanation)}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 mt-1 ${expandedResult === qr.questionId ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Post-Reading Review: Vocab Summary ── */}
                {vocabList.length > 0 && (
                    <div className="mt-5">
                        <div className={styles.questionPanel}>
                            <h3 className="text-sm font-bold text-gray-700 mb-3">📖 Nachgeschlagene Wörter</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Du hast {vocabList.length} {vocabList.length === 1 ? 'Wort' : 'Wörter'} während des Lesens nachgeschlagen. Wiederhole sie!
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {vocabList.map((v, i) => (
                                    <div key={i} className={styles.vocabReviewCard}>
                                        <span className="font-bold text-gray-800 text-sm">{v.word}</span>
                                        <span className="text-gray-500 text-xs">{v.translation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Post-Reading Review: Performance Insights ── */}
                <div className="mt-5">
                    <div className={styles.questionPanel}>
                        <h3 className="text-sm font-bold text-gray-700 mb-3">📊 Lese-Analyse</h3>
                        <div className="space-y-3">
                            {/* Strengths */}
                            {percentage >= 60 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: '#10B981' }}>
                                    <span className="text-sm">💪</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-700">Stärke</p>
                                        <p className="text-xs text-gray-600">
                                            {percentage >= 90
                                                ? 'Exzellentes Textverständnis! Du hast die Kernaussagen perfekt erfasst.'
                                                : percentage >= 70
                                                    ? 'Gutes Textverständnis! Die meisten Informationen wurden korrekt erkannt.'
                                                    : 'Grundlegendes Verständnis vorhanden. Weiter so!'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Areas for improvement */}
                            {percentage < 90 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: '#FF6B35' }}>
                                    <span className="text-sm">🎯</span>
                                    <div>
                                        <p className="text-xs font-bold text-orange-700">Verbesserung</p>
                                        <p className="text-xs text-gray-600">
                                            {percentage < 50
                                                ? 'Lies den Text noch einmal langsam und achte auf die Schlüsselwörter.'
                                                : percentage < 70
                                                    ? 'Achte besonders auf Details und Nebensätze im Text.'
                                                    : 'Für die Bestnote: Prüfe auch die impliziten Informationen.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Vocab insight */}
                            {vocabList.length > 0 && (
                                <div className={styles.insightCard} style={{ borderLeftColor: '#6366F1' }}>
                                    <span className="text-sm">📚</span>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-700">Wortschatz</p>
                                        <p className="text-xs text-gray-600">
                                            {vocabList.length <= 3
                                                ? `Du hast nur ${vocabList.length} Wörter nachgeschlagen — guter Wortschatz!`
                                                : `${vocabList.length} Wörter nachgeschlagen. Wiederhole sie regelmäßig für besseres Verständnis.`}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Time insight */}
                            <div className={styles.insightCard} style={{ borderLeftColor: '#8B5CF6' }}>
                                <span className="text-sm">⏱️</span>
                                <div>
                                    <p className="text-xs font-bold text-purple-700">Tempo</p>
                                    <p className="text-xs text-gray-600">
                                        {results.timeTaken < estimatedMinutes * 45
                                            ? 'Sehr schnell gelesen! Nimm dir beim nächsten Mal etwas mehr Zeit für Details.'
                                            : results.timeTaken < estimatedMinutes * 90
                                                ? 'Gutes Tempo! Du hast dir genug Zeit genommen.'
                                                : 'Du hast dir viel Zeit genommen — das ist beim Üben völlig ok!'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Post-Reading Review: Reading Tip ── */}
                <div className="mt-5">
                    <div className={styles.readingTipCard} style={{ '--level-gradient': cefrColor.css } as React.CSSProperties}>
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">
                                    {isBeginner ? 'Tipp zum Weiterlernen' : 'Empfehlung'}
                                </p>
                                <p className="text-sm text-gray-700">
                                    {(POST_READING_TIPS[cefrLevel] ?? POST_READING_TIPS.A1!)[Math.floor(Math.random() * 3)]}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Action buttons — level-colored ── */}
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={() => router.push('/reading')}
                        className={styles.navButton}
                    >
                        ← Zurück zur Übersicht
                    </button>
                    <button
                        onClick={() => router.push('/reading')}
                        className={`${styles.navButton} ${styles.primary}`}
                    >
                        Nächste Aufgabe →
                    </button>
                </div>
            </div>
        )
    }

    return null
}

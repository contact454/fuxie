'use client'

import Image from 'next/image'
import styles from './reading.module.css'
import { getImageUrl } from './reading-types'

// ─── Helper: render images by placement ─────────────
export function renderImages(imagesJson: any, cefrLevel: string, placement?: string) {
    if (!imagesJson || !Array.isArray(imagesJson)) return null
    const images = placement
        ? imagesJson.filter((img: any) => img.placement === placement || img.placement?.startsWith(placement))
        : imagesJson
    if (images.length === 0) return null

    return (
        <div className={images.length > 1 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
            {images.map((img: any, i: number) => (
                <div key={img.id || i} className={styles.exerciseImage}>
                    <Image
                        src={getImageUrl(img.filename, cefrLevel)}
                        alt={img.alt_text || 'Illustration'}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto object-contain"
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
export function renderSchilderCards(textsJson: any, imagesJson: any, cefrLevel: string) {
    if (!textsJson) return null
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    const schilder = texts.filter((t: any) => t.type && t.text && t.icon)
    if (schilder.length === 0) return null

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
                        {img && (
                            <div style={{ margin: '-16px -16px 0 -16px' }}>
                                <Image
                                    src={img.url}
                                    alt={img.alt}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-auto object-cover"
                                    style={{ maxHeight: '260px', objectFit: 'cover' }}
                                />
                            </div>
                        )}
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
export function renderAnzeigenCards(textsJson: any, imagesJson: any, cefrLevel: string) {
    if (!textsJson) return null
    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    const anzeigen = texts.filter((t: any) => t.title && t.details && !t.text)
    if (anzeigen.length === 0) return null

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
                const label = String.fromCharCode(65 + i)
                const details = ad.details || {}
                return (
                    <div key={i} className={`${styles.textCard} ${styles.fadeInUp}`}
                        style={{ animationDelay: `${i * 0.1}s`, overflow: 'hidden' }}>
                        {img && (
                            <div style={{ margin: '-16px -16px 0 -16px' }}>
                                <Image
                                    src={img.url}
                                    alt={img.alt}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="w-full h-auto object-cover"
                                    style={{ maxHeight: '280px', objectFit: 'cover' }}
                                />
                            </div>
                        )}
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

// ─── Sub-renderers for structured content ────────────

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

// ─── Main text rendering dispatcher ────────────────
export function renderTexts(textsJson: any, cefrLevel?: string) {
    if (!textsJson) return null

    const texts = Array.isArray(textsJson) ? textsJson : [textsJson]
    if (texts.length === 0) return null
    const isAdvancedLevel = ['B1', 'B2', 'C1', 'C2'].includes(cefrLevel || '')

    return (
        <div className="space-y-5">
            {texts.map((txt: any, i: number) => {
                // ── Detect structured data format ──
                if (txt.columns && txt.rows) return renderSchedule(txt, i)
                if (txt.rows && txt.location) return renderInfotafel(txt, i)
                if (txt.letters && txt.context) return renderDebate(txt, i)
                if (txt.comments && txt.question) return renderForum(txt, i)
                if (txt.texts && txt.question && !txt.text) return renderOpinionTexts(txt, i)
                if (txt.sections && !txt.text) return renderSections(txt, i)
                // Schilder → skip, rendered by renderSchilderCards
                if (txt.type && txt.text && txt.icon) return null
                // Anzeigen → skip, rendered by renderAnzeigenCards
                if (txt.title && txt.details && !txt.text) return null

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

// ─── Types for Reading Text Renderers ────────────────
// These types describe the AI-generated JSON structures used in
// reading exercises. They replace `any` throughout reading-text-renderers.tsx.

/** Individual image entry from the reading exercise images JSON */
export interface ReadingImage {
    id?: string
    filename: string
    alt_text?: string
    placement?: string
}

/** Base text entry — common fields across all text types */
export interface ReadingTextBase {
    label?: string
    title?: string
    type?: string
    text_type?: string
    text?: string
    content?: string
    body?: string
    icon?: string
    // Email / letter metadata
    von?: string
    from?: string
    sender?: string
    an?: string
    to?: string
    recipient?: string
    receiver?: string
    betreff?: string
    subject?: string
    date?: string
    datum?: string
    author?: string
    autor?: string
}

/** Schild (sign) text entry */
export interface SchildText extends ReadingTextBase {
    type: string
    text: string
    icon: string
}

/** Anzeige (advertisement) text entry */
export interface AnzeigeText extends ReadingTextBase {
    title: string
    details: Record<string, string>
}

/** Schedule/timetable data */
export interface ScheduleData {
    title?: string
    type?: string
    columns: string[]
    rows: string[][]
    footnote?: string
}

/** Infotafel (info board) data */
export interface InfotafelData {
    title?: string
    location?: string
    rows: Record<string, unknown>[]
    extra_info?: string | Record<string, unknown>
}

/** Debate / reader letters data */
export interface DebateData {
    topic?: string
    context?: string
    letters?: Array<{
        author?: string
        name?: string
        stance?: string
        text?: string
        content?: string
        body?: string
    }>
}

/** Forum data */
export interface ForumData {
    question?: string
    comments?: Array<{
        author?: string
        name?: string
        username?: string
        stance?: string
        text?: string
        content?: string
        body?: string
    }>
}

/** Opinion texts data (Zuordnung) */
export interface OpinionData {
    question?: string
    texts?: Array<{
        author?: string
        name?: string
        text?: string
        opinion?: string
        content?: string
    }>
}

/** Sections data (structured article) */
export interface SectionsData {
    title?: string
    source?: string
    format?: string
    sections?: Array<{
        heading?: string
        text?: string
        content?: string
        body?: string
    }>
}

/** Union type for all possible text/data entries */
export type ReadingTextEntry =
    | ReadingTextBase
    | SchildText
    | AnzeigeText
    | ScheduleData
    | InfotafelData
    | DebateData
    | ForumData
    | OpinionData
    | SectionsData

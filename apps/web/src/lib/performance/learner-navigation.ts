type TimingMarks = {
    clickStart: number
    routeVisible?: number
    contentReady?: number
}

type ActiveTimingRecord = {
    id: string
    flow: string
    source?: string
    from: string
    href: string
    startedAt: string
    marks: TimingMarks
}

type CompletedTimingRecord = ActiveTimingRecord & {
    path: string
    durations: {
        routeVisibleMs: number | null
        contentReadyMs: number
        afterRouteMs: number | null
    }
}

const ACTIVE_KEY = 'fuxie:learner-nav-timing:active'
const HISTORY_KEY = 'fuxie:learner-nav-timing:history'
const MAX_HISTORY = 30

function isTimingEnabled() {
    return (
        typeof window !== 'undefined' &&
        process.env.NODE_ENV !== 'production' &&
        window.localStorage?.getItem('fuxie:learner-nav-timing:disabled') !== '1'
    )
}

function getCurrentPath() {
    return `${window.location.pathname}${window.location.search}`
}

function readActiveRecord(): ActiveTimingRecord | null {
    if (!isTimingEnabled()) return null

    try {
        const raw = window.sessionStorage.getItem(ACTIVE_KEY)
        return raw ? JSON.parse(raw) as ActiveTimingRecord : null
    } catch {
        return null
    }
}

function writeActiveRecord(record: ActiveTimingRecord) {
    try {
        window.sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(record))
    } catch {
        // Ignore storage failures in private windows or constrained browsers.
    }
}

function clearActiveRecord() {
    try {
        window.sessionStorage.removeItem(ACTIVE_KEY)
    } catch {
        // Ignore storage failures in private windows or constrained browsers.
    }
}

function pushHistory(record: CompletedTimingRecord) {
    try {
        const raw = window.localStorage.getItem(HISTORY_KEY)
        const history = raw ? JSON.parse(raw) as CompletedTimingRecord[] : []
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify([record, ...history].slice(0, MAX_HISTORY)))
    } catch {
        // Console timing is still useful if localStorage is unavailable.
    }
}

function markPerformance(record: ActiveTimingRecord, mark: keyof TimingMarks) {
    try {
        window.performance.mark(`fuxie:${record.id}:${mark}`)
    } catch {
        // Performance marks are diagnostic only.
    }
}

function formatFields(fields: Record<string, string | number | null | undefined>) {
    return Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(' ')
}

export function startLearnerNavigationTiming(input: {
    flow: string
    href: string
    source?: string
}) {
    if (!isTimingEnabled()) return

    const currentPath = getCurrentPath()
    if (input.href === currentPath) return

    const record: ActiveTimingRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        flow: input.flow,
        source: input.source,
        from: currentPath,
        href: input.href,
        startedAt: new Date().toISOString(),
        marks: {
            clickStart: window.performance.now(),
        },
    }

    writeActiveRecord(record)
    markPerformance(record, 'clickStart')
    console.info('[fuxie-perf] click_start ' + formatFields({
        flow: record.flow,
        source: record.source,
        from: record.from,
        href: record.href,
        id: record.id,
    }))
}

export function markLearnerRouteVisible(input?: { path?: string; label?: string }) {
    const record = readActiveRecord()
    if (!record || record.marks.routeVisible) return

    record.marks.routeVisible = window.performance.now()
    writeActiveRecord(record)
    markPerformance(record, 'routeVisible')

    console.info('[fuxie-perf] route_visible ' + formatFields({
        flow: record.flow,
        source: record.source,
        path: input?.path ?? getCurrentPath(),
        label: input?.label,
        routeVisibleMs: Math.round(record.marks.routeVisible - record.marks.clickStart),
        id: record.id,
    }))
}

export function markLearnerContentReady(input?: { path?: string; label?: string }) {
    let record = readActiveRecord()
    if (!record) return

    if (!record.marks.routeVisible) {
        markLearnerRouteVisible(input)
        record = readActiveRecord()
        if (!record) return
    }

    record.marks.contentReady = window.performance.now()
    markPerformance(record, 'contentReady')

    const routeVisibleMs = typeof record.marks.routeVisible === 'number'
        ? Math.round(record.marks.routeVisible - record.marks.clickStart)
        : null
    const contentReadyMs = Math.round(record.marks.contentReady - record.marks.clickStart)
    const afterRouteMs = typeof record.marks.routeVisible === 'number'
        ? Math.round(record.marks.contentReady - record.marks.routeVisible)
        : null
    const completed: CompletedTimingRecord = {
        ...record,
        path: input?.path ?? getCurrentPath(),
        durations: {
            routeVisibleMs,
            contentReadyMs,
            afterRouteMs,
        },
    }

    pushHistory(completed)
    clearActiveRecord()

    console.info('[fuxie-perf] content_ready ' + formatFields({
        flow: completed.flow,
        source: completed.source,
        from: completed.from,
        href: completed.href,
        path: completed.path,
        label: input?.label,
        ...completed.durations,
        id: completed.id,
    }))

    window.dispatchEvent(new CustomEvent('fuxie:learner-nav-timing', { detail: completed }))
}

export function getLearnerNavigationTimingHistory(): CompletedTimingRecord[] {
    if (!isTimingEnabled()) return []

    try {
        const raw = window.localStorage.getItem(HISTORY_KEY)
        return raw ? JSON.parse(raw) as CompletedTimingRecord[] : []
    } catch {
        return []
    }
}

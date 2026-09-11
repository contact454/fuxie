'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionAnswer, SessionAttemptView, SessionReceipt, SessionStartResult } from '@/lib/session/contracts'

type Identity = { clientStartKey: string; attemptId?: string; restartAttemptId?: string }
type Operation = 'start' | 'answer' | 'complete' | 'resume'
export type SessionClientError = { code: string; operation: Operation }

class RequestError extends Error {
    constructor(readonly code: string) { super(code) }
}

async function request<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        cache: 'no-store',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    const result = await response.json().catch(() => null)
    if (!response.ok || result?.success !== true || !result.data) {
        throw new RequestError(typeof result?.error?.code === 'string' ? result.error.code : `HTTP_${response.status}`)
    }
    return result.data as T
}

/** Only transport identity is kept in this tab. Raw answers stay in memory. */
export function useSessionAttempt(userId: string, preview?: SessionAttemptView) {
    const [view, setView] = useState<SessionAttemptView | null>(preview ?? null)
    const [phase, setPhase] = useState<'loading' | 'error' | 'empty' | 'active'>(preview ? 'active' : 'loading')
    const [currentId, setCurrentId] = useState<string | null>(preview?.nextQuestionId ?? null)
    const [pending, setPending] = useState<Operation | null>(null)
    const [error, setError] = useState<SessionClientError | null>(null)
    const busy = useRef(false)
    const identity = useRef<Identity | null>(null)
    const pendingAnswer = useRef<{ questionId: string; answer: SessionAnswer } | null>(null)
    const storageKey = `fuxie:session:v2:${userId}`

    const saveIdentity = useCallback((value: Identity) => {
        identity.current = value
        try { window.sessionStorage.setItem(storageKey, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
    }, [storageKey])

    const applyView = useCallback((next: SessionAttemptView, preserveQuestion?: string) => {
        if (next.state !== 'ready' || !next.attemptId || !Array.isArray(next.items) || !Array.isArray(next.checkedAnswers)) {
            throw new RequestError('INVALID_RESPONSE')
        }
        setView(next)
        setCurrentId(preserveQuestion ?? next.nextQuestionId)
        setPhase('active')
    }, [])

    const load = useCallback(async (newAttempt = false) => {
        if (preview || busy.current) return
        busy.current = true
        setPending('start')
        setError(null)
        if (!view) setPhase('loading')
        try {
            let current = identity.current
            if (!current) {
                try {
                    const stored = window.sessionStorage.getItem(storageKey)
                    const parsed = stored ? JSON.parse(stored) : null
                    if (typeof parsed?.clientStartKey === 'string') current = parsed as Identity
                } catch { /* Retry still uses the in-memory identity. */ }
            }
            if (newAttempt || !current) {
                current = {
                    clientStartKey: crypto.randomUUID(),
                    ...(newAttempt && view?.status === 'IN_PROGRESS' ? { restartAttemptId: view.attemptId } : {}),
                }
            }
            saveIdentity(current)
            const next = current.attemptId
                ? await request<SessionAttemptView>(`/api/v1/session/${current.attemptId}`)
                : await request<SessionStartResult>('/api/v1/session/start', {
                    contractVersion: 2,
                    clientStartKey: current.clientStartKey,
                    ...(current.restartAttemptId ? { restartAttemptId: current.restartAttemptId } : {}),
                })
            if (next.state === 'no_content') {
                setView(null)
                setCurrentId(null)
                setPhase('empty')
            } else {
                applyView(next)
                saveIdentity({ clientStartKey: current.clientStartKey, attemptId: next.attemptId })
                pendingAnswer.current = null
            }
        } catch (cause) {
            setError({ code: cause instanceof RequestError ? cause.code : 'NETWORK_ERROR', operation: 'start' })
            if (!view) setPhase('error')
        } finally {
            busy.current = false
            setPending(null)
        }
    }, [applyView, preview, saveIdentity, storageKey, view])

    // A view update must not start another request. Explicit actions handle all retries.
    const initialLoad = useRef(load)
    useEffect(() => { void initialLoad.current() }, [])

    const answer = useCallback(async (raw: SessionAnswer) => {
        if (preview || busy.current || !view || !currentId) return
        busy.current = true
        setPending('answer')
        setError(null)
        const payload = pendingAnswer.current?.questionId === currentId
            ? pendingAnswer.current
            : { questionId: currentId, answer: raw }
        pendingAnswer.current = payload
        try {
            const next = await request<SessionAttemptView>(`/api/v1/session/${view.attemptId}/answers`, {
                contractVersion: 2,
                publicRevision: view.publicRevision,
                questionId: payload.questionId,
                answer: payload.answer,
            })
            applyView(next, payload.questionId)
            pendingAnswer.current = null
        } catch (cause) {
            setError({ code: cause instanceof RequestError ? cause.code : 'NETWORK_ERROR', operation: 'answer' })
        } finally {
            busy.current = false
            setPending(null)
        }
    }, [applyView, currentId, preview, view])

    const resume = useCallback(async () => {
        if (preview || busy.current || !view) return
        busy.current = true
        setPending('resume')
        setError(null)
        try {
            const next = await request<SessionAttemptView>(`/api/v1/session/${view.attemptId}`)
            applyView(next, currentId ?? undefined)
            if (next.checkedAnswers.some(entry => entry.questionId === currentId)) pendingAnswer.current = null
        } catch (cause) {
            setError({ code: cause instanceof RequestError ? cause.code : 'NETWORK_ERROR', operation: 'resume' })
        } finally {
            busy.current = false
            setPending(null)
        }
    }, [applyView, currentId, preview, view])

    const complete = useCallback(async () => {
        if (preview || busy.current || !view || view.receipt || !view.completionAvailable) return
        busy.current = true
        setPending('complete')
        setError(null)
        try {
            const next = await request<{ receipt: SessionReceipt }>('/api/v1/session/complete', {
                contractVersion: 2, attemptId: view.attemptId, publicRevision: view.publicRevision,
            })
            if (!next.receipt || next.receipt.attemptId !== view.attemptId || !next.receipt.savedAt) {
                throw new RequestError('INVALID_RESPONSE')
            }
            setView({ ...view, status: next.receipt.status, receipt: next.receipt })
            setCurrentId(null)
        } catch (cause) {
            setError({ code: cause instanceof RequestError ? cause.code : 'NETWORK_ERROR', operation: 'complete' })
        } finally {
            busy.current = false
            setPending(null)
        }
    }, [preview, view])

    const next = useCallback(() => {
        if (busy.current || !view || !view.checkedAnswers.some(entry => entry.questionId === currentId)) return
        setCurrentId(view.nextQuestionId)
        setError(null)
    }, [currentId, view])

    return {
        view, phase, currentId, pending, error,
        answerLocked: pending === 'answer' || pendingAnswer.current?.questionId === currentId,
        load, answer, resume, complete, next,
    }
}

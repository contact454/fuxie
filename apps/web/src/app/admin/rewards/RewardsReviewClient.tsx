'use client'

import { useMemo, useState, useTransition } from 'react'
import {
    CheckCircle2,
    Coins,
    Filter,
    Gift,
    Loader2,
    ShieldAlert,
    XCircle,
} from 'lucide-react'

type RedeemRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
type AdminStatusFilter = 'FULFILLMENT' | 'ALL' | RedeemRequestStatus
type AdminRequestAction = 'approve' | 'reject' | 'fulfill'

interface RedeemRequestRow {
    id: string
    itemId: string
    itemTitle: string
    itemCategory: string
    itemBenefit: string
    cost: number
    walletBalanceAtRequest: number
    status: RedeemRequestStatus
    statusReason: string | null
    requestedAt: string
    reviewedAt: string | null
    fulfilledAt: string | null
    updatedAt: string
    user: {
        email: string
        profile: {
            displayName: string | null
            currentLevel: string
        } | null
    }
}

interface StatusCount {
    status: RedeemRequestStatus
    count: number
}

interface QueueCounts {
    statuses: StatusCount[]
    awaitingFulfillment: number
}

const FILTERS: AdminStatusFilter[] = ['PENDING', 'FULFILLMENT', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL']

const FILTER_LABELS: Record<AdminStatusFilter, string> = {
    PENDING: 'Pending',
    FULFILLMENT: 'Awaiting',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    ALL: 'All',
}

export default function RewardsReviewClient({
    initialRequests,
    initialCounts,
}: {
    initialRequests: RedeemRequestRow[]
    initialCounts: QueueCounts
}) {
    const [requests, setRequests] = useState(initialRequests)
    const [counts, setCounts] = useState(initialCounts)
    const [activeFilter, setActiveFilter] = useState<AdminStatusFilter>('PENDING')
    const [reviewReasons, setReviewReasons] = useState<Record<string, string>>({})
    const [message, setMessage] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const totalCount = useMemo(
        () => counts.statuses.reduce((sum, item) => sum + item.count, 0),
        [counts]
    )
    const pendingCount = getStatusCount(counts.statuses, 'PENDING')

    const loadFilter = (filter: AdminStatusFilter) => {
        setActiveFilter(filter)
        setMessage(null)
        startTransition(async () => {
            try {
                const response = await fetch(`/api/v1/admin/rewards/redeem-requests?status=${filter}`)
                const payload = await response.json()

                if (!response.ok || !payload.success) {
                    throw new Error(payload.error ?? 'Could not load requests')
                }

                setRequests(payload.data ?? [])
                setCounts(payload.meta?.counts ?? counts)
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Could not load requests')
            }
        })
    }

    const reviewRequest = (request: RedeemRequestRow, action: AdminRequestAction) => {
        setPendingId(request.id)
        setMessage(null)
        startTransition(async () => {
            try {
                const response = await fetch(`/api/v1/admin/rewards/redeem-requests/${request.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        reason: reviewReasons[request.id]?.trim() || undefined,
                    }),
                })
                const payload = await response.json()

                if (!response.ok || !payload.success) {
                    throw new Error(payload.error ?? 'Review failed')
                }

                const updated = normalizeRequest(payload.data)
                const nextStatus = updated.status
                setRequests((current) => {
                    if (activeFilter === 'ALL' || activeFilter === nextStatus) {
                        return current.map((item) => item.id === request.id ? updated : item)
                    }

                    if (activeFilter === 'FULFILLMENT' && nextStatus === 'APPROVED' && !updated.fulfilledAt) {
                        return current.map((item) => item.id === request.id ? updated : item)
                    }

                    return current.filter((item) => item.id !== request.id)
                })
                setCounts((current) => updateQueueCounts(current, request, updated))
                setReviewReasons((current) => {
                    const next = { ...current }
                    delete next[request.id]
                    return next
                })
                setMessage(getActionSuccessMessage(action))
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Review failed')
            } finally {
                setPendingId(null)
            }
        })
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                        <Coins className="h-3.5 w-3.5" />
                        Fucoin Economy
                    </div>
                    <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Reward Review</h1>
                    <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-500">
                        Review Fucoin redeem requests by status. Approval spends Fucoin through the ledger; fulfillment grants safe in-app rewards when supported and records manual delivery for everything else.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <AdminStat label="Pending" value={pendingCount} />
                    <AdminStat label="Awaiting" value={counts.awaitingFulfillment} />
                    <AdminStat label="Total" value={totalCount} />
                    <AdminStat label="Showing" value={requests.length} />
                </div>
            </div>

            {message ? (
                <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800 ring-1 ring-sky-100">
                    {message}
                </div>
            ) : null}

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                        <ShieldAlert className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-sm font-black text-amber-900">Guardrail active</p>
                        <p className="mt-1 text-sm font-medium leading-relaxed text-amber-800">
                            Approving spends Fucoin. Reject unsupported or manual-risk items with a reason; every approved request must get a fulfillment receipt before the pilot gate.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
                    <Filter className="h-3.5 w-3.5" />
                    Status
                </span>
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => loadFilter(filter)}
                        className={activeFilter === filter
                            ? 'rounded-full bg-sky-600 px-3 py-2 text-xs font-black text-white shadow-sm'
                            : 'rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-sky-50'}
                    >
                        {FILTER_LABELS[filter]}
                        <span className="ml-1 opacity-75">
                            {getFilterCount(counts, filter, totalCount)}
                        </span>
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-base font-semibold text-slate-900">{FILTER_LABELS[activeFilter]} Redeem Requests</h2>
                </div>

                <div className="divide-y divide-slate-200">
                    {requests.map((request) => {
                        const learnerName = request.user.profile?.displayName || request.user.email
                        const isBusy = isPending && pendingId === request.id
                        const canReview = request.status === 'PENDING'
                        const canFulfill = request.status === 'APPROVED' && !request.fulfilledAt

                        return (
                            <div key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_280px] lg:items-center">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                                            <Gift className="h-3.5 w-3.5" />
                                            {request.itemCategory}
                                        </span>
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                                            {request.cost.toLocaleString('vi-VN')} Fu
                                        </span>
                                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700 ring-1 ring-sky-100">
                                            Wallet snapshot {request.walletBalanceAtRequest.toLocaleString('vi-VN')} Fu
                                        </span>
                                        <span className={getStatusPillClass(request.status)}>
                                            {getRequestDisplayStatus(request)}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 text-lg font-bold text-slate-950">{request.itemTitle}</h3>
                                    <p className="mt-1 text-sm font-medium text-slate-500">{request.itemBenefit}</p>
                                    {request.statusReason ? (
                                        <p className="mt-2 text-sm font-semibold text-slate-600">{request.statusReason}</p>
                                    ) : null}
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                        <span>{learnerName}</span>
                                        <span>{request.user.email}</span>
                                        <span>{request.user.profile?.currentLevel ?? 'N/A'}</span>
                                        <span>{new Date(request.requestedAt).toLocaleString('vi-VN')}</span>
                                        {request.fulfilledAt ? <span>Fulfilled {new Date(request.fulfilledAt).toLocaleString('vi-VN')}</span> : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <textarea
                                        value={reviewReasons[request.id] ?? ''}
                                        onChange={(event) => setReviewReasons((current) => ({
                                            ...current,
                                            [request.id]: event.target.value,
                                        }))}
                                        disabled={(!canReview && !canFulfill) || isPending}
                                        placeholder={canFulfill ? 'Fulfillment note for learner/admin receipt' : 'Review reason; required when rejecting unsupported or manual-risk items'}
                                        className="min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
                                    />
                                    {canFulfill ? (
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => reviewRequest(request, 'fulfill')}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                            Mark fulfilled
                                        </button>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={!canReview || isPending}
                                                onClick={() => reviewRequest(request, 'approve')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                Approve
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!canReview || isPending}
                                                onClick={() => reviewRequest(request, 'reject')}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {requests.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Gift className="h-6 w-6" />
                            </div>
                            <p className="mt-4 font-semibold text-slate-700">No {FILTER_LABELS[activeFilter].toLowerCase()} redeem requests.</p>
                            <p className="mt-1 text-sm text-slate-500">{"Switch status filters to inspect the full" /* // locale-allow */} review queue.</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function AdminStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl bg-white px-5 py-4 text-sm shadow-sm ring-1 ring-slate-200">
            <p className="font-black text-slate-900">{value}</p>
            <p className="text-slate-500">{label}</p>
        </div>
    )
}

function getStatusCount(counts: StatusCount[], status: RedeemRequestStatus) {
    return counts.find((item) => item.status === status)?.count ?? 0
}

function getFilterCount(counts: QueueCounts, filter: AdminStatusFilter, totalCount: number) {
    if (filter === 'ALL') return totalCount
    if (filter === 'FULFILLMENT') return counts.awaitingFulfillment
    return getStatusCount(counts.statuses, filter)
}

function updateQueueCounts(
    counts: QueueCounts,
    previous: RedeemRequestRow,
    next: RedeemRequestRow
): QueueCounts {
    const statuses: RedeemRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
    const statusesNext = statuses.map((status) => {
        let count = getStatusCount(counts.statuses, status)

        if (previous.status !== next.status && status === previous.status) {
            count = Math.max(0, count - 1)
        }

        if (previous.status !== next.status && status === next.status) {
            count += 1
        }

        return { status, count }
    })
    const previousAwaiting = previous.status === 'APPROVED' && !previous.fulfilledAt
    const nextAwaiting = next.status === 'APPROVED' && !next.fulfilledAt

    return {
        statuses: statusesNext,
        awaitingFulfillment: counts.awaitingFulfillment
            + (nextAwaiting ? 1 : 0)
            - (previousAwaiting ? 1 : 0),
    }
}

function normalizeRequest(request: RedeemRequestRow): RedeemRequestRow {
    return {
        ...request,
        requestedAt: String(request.requestedAt),
        reviewedAt: request.reviewedAt ? String(request.reviewedAt) : null,
        fulfilledAt: request.fulfilledAt ? String(request.fulfilledAt) : null,
        updatedAt: String(request.updatedAt),
    }
}

function getActionSuccessMessage(action: AdminRequestAction) {
    if (action === 'approve') {
        return 'Request approved and Fucoin spent through the ledger. It is now awaiting fulfillment.'
    }

    if (action === 'fulfill') {
        return 'Request fulfilled. Safe in-app rewards are granted when supported; other items remain manual.'
    }

    return 'Request rejected. No Fucoin was spent.'
}

function getRequestDisplayStatus(request: RedeemRequestRow) {
    if (request.status === 'APPROVED' && request.fulfilledAt) {
        return 'FULFILLED'
    }

    if (request.status === 'APPROVED') {
        return 'AWAITING FULFILLMENT'
    }

    return request.status
}

function getStatusPillClass(status: RedeemRequestStatus) {
    const base = 'rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ring-1'

    if (status === 'APPROVED') {
        return `${base} bg-emerald-50 text-emerald-700 ring-emerald-100`
    }

    if (status === 'REJECTED') {
        return `${base} bg-rose-50 text-rose-700 ring-rose-100`
    }

    if (status === 'CANCELLED') {
        return `${base} bg-slate-100 text-slate-600 ring-slate-200`
    }

    return `${base} bg-amber-50 text-amber-700 ring-amber-100`
}

'use client'

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

interface ConfirmExitDialogProps {
    open: boolean
    title: ReactNode
    description: ReactNode
    stayLabel: ReactNode
    exitLabel: ReactNode
    ariaLabel: string
    onStay: () => void
    onExit: () => void
}

export function ConfirmExitDialog({
    open,
    title,
    description,
    stayLabel,
    exitLabel,
    ariaLabel,
    onStay,
    onExit,
}: ConfirmExitDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)
    const stayButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!open) return
        stayButtonRef.current?.focus()
    }, [open])

    if (!open) return null

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            onStay()
            return
        }

        if (event.key !== 'Tab') return

        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable?.length) return

        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[color:rgba(23,59,86,0.45)] px-4"
            onKeyDown={handleKeyDown}
        >
            <div
                ref={dialogRef}
                className="w-full max-w-sm rounded-2xl border border-[var(--fuxie-blue-200)] bg-white p-6 shadow-xl"
            >
                <h3 className="mb-2 text-lg font-bold text-[var(--fuxie-blue-900)]">
                    {title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-[var(--fuxie-blue-700)]">
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        ref={stayButtonRef}
                        type="button"
                        onClick={onStay}
                        className="w-full sm:flex-1 rounded-xl bg-[var(--fuxie-action)] py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fuxie-action-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                    >
                        {stayLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onExit}
                        className="w-full sm:flex-1 rounded-xl border border-[var(--fuxie-blue-200)] bg-white py-2 text-sm font-medium text-[var(--fuxie-blue-700)] transition hover:bg-[var(--fuxie-blue-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fuxie-blue-700)]"
                    >
                        {exitLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

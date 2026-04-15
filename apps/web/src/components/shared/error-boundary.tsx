'use client'

import React, { Component, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    /** Optional fallback UI to display when an error occurs */
    fallback?: ReactNode
    /** Optional callback when an error is caught */
    onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * React Error Boundary — wraps AI-heavy sections so a crash in one
 * component doesn't take down the entire page.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Oops!</p>}>
 *     <NachsprechenPlayer ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    override componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Caught:', error, info)
        this.props.onError?.(error, info)
    }

    override render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div
                    role="alert"
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                >
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>😅</p>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        Đã xảy ra lỗi không mong muốn
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        Vui lòng tải lại trang hoặc thử lại sau.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#3B82F6',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

import * as React from 'react'

export interface FrostedPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function FrostedPanel({ children, className = '', ...props }: FrostedPanelProps) {
    return (
        <div
            className={`bg-[rgba(228,240,240,0.85)] backdrop-blur-md rounded-[var(--fuxie-radius-lg)] shadow-[var(--fuxie-shadow-card)] p-[var(--fuxie-space-4)] border border-[var(--fuxie-blue-200)]/70 ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    )
}

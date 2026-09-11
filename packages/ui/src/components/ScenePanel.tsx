import * as React from 'react'

export interface ScenePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function ScenePanel({ children, className = '', ...props }: ScenePanelProps) {
    return (
        <div
            className={`bg-[var(--fuxie-blue-100)] rounded-[var(--fuxie-radius-lg)] shadow-[var(--fuxie-shadow-card)] p-[var(--fuxie-space-4)] border border-[var(--fuxie-blue-200)] ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    )
}

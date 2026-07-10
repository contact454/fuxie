import * as React from 'react'

export interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
    value: number // 0 to 100
    size?: number
    strokeWidth?: number
}

export function ProgressRing({ value, size = 36, strokeWidth = 4, className = '', ...props }: ProgressRingProps) {
    const safeValue = Math.max(0, Math.min(100, value))
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (safeValue / 100) * circumference

    const ringStyles = `
        .progress-ring-circle {
            transition: stroke-dashoffset 0.6s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
            .progress-ring-circle {
                transition: none !important;
            }
        }
    `

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={`rotate-[-90deg] ${className}`.trim()}
            {...props}
        >
            <style dangerouslySetInnerHTML={{ __html: ringStyles }} />
            {/* Vòng nền */}
            <circle
                stroke="var(--fuxie-blue-200)"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            {/* Vòng tiến độ */}
            <circle
                className="progress-ring-circle"
                stroke="var(--fuxie-success)"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
        </svg>
    )
}

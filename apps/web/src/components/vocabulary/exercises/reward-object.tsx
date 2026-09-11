'use client'

import * as React from 'react'

export type RewardObjectType = 'medal' | 'trophy' | 'lantern' | 'flag'

export interface RewardObjectProps {
    type: RewardObjectType
    size?: number
    className?: string
}

export function RewardObject({ type, size = 128, className = '' }: RewardObjectProps) {
    // The sprite sheet fig/m4-reward-objects.png is a 2x2 grid of 512x512 quadrants (1024x1024 total)
    const scale = size / 512
    const imgSize = 1024 * scale

    let left = 0
    let top = 0

    if (type === 'trophy') {
        left = -512 * scale
    } else if (type === 'lantern') {
        top = -512 * scale
    } else if (type === 'flag') {
        left = -512 * scale
        top = -512 * scale
    }

    return (
        <div
            className={`relative overflow-hidden shrink-0 select-none pointer-events-none ${className}`}
            style={{ width: size, height: size }}
        >
            <img
                src="/fig/m4-reward-objects.png"
                alt={`Reward object ${type}`}
                className="max-w-none absolute transition-none"
                style={{
                    width: `${imgSize}px`,
                    height: `${imgSize}px`,
                    left: `${left}px`,
                    top: `${top}px`,
                }}
            />
        </div>
    )
}

'use client'

import * as React from 'react'

export type FuxiePoseType = 'idle-wave' | 'correct-cheer' | 'wrong-oops' | 'level-up-jump'

export interface FuxiePoseProps {
    pose: FuxiePoseType
    size?: number
    className?: string
}

export function FuxiePose({ pose, size = 128, className = '' }: FuxiePoseProps) {
    // The sprite sheet fig/fuxie-poses.png is a 2x2 grid of 512x512 quadrants (1024x1024 total)
    const scale = size / 512
    const imgSize = 1024 * scale

    let left = 0
    let top = 0

    if (pose === 'correct-cheer') {
        left = -512 * scale
    } else if (pose === 'wrong-oops') {
        top = -512 * scale
    } else if (pose === 'level-up-jump') {
        left = -512 * scale
        top = -512 * scale
    }

    return (
        <div
            className={`relative overflow-hidden shrink-0 select-none pointer-events-none ${className}`}
            style={{ width: size, height: size }}
        >
            <img
                src="/fig/fuxie-poses.png"
                alt={`Fuxie mascot ${pose}`}
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

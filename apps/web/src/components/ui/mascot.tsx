'use client'

import Image from 'next/image'
import { getFuxieMascotSrc, type FuxieMascotKey } from '@/lib/mascot/fuxie-assets'

interface MascotProps {
    variant: FuxieMascotKey
    size?: number
    className?: string
    speechBubble?: string
}

export function Mascot({ variant, size = 80, className = '', speechBubble }: MascotProps) {
    const src = getFuxieMascotSrc(variant)

    return (
        <div className={`relative inline-flex items-end gap-2 ${className}`}>
            <Image
                src={src}
                alt={`Fuxie ${variant}`}
                width={size}
                height={size}
                className="object-contain select-none"
                style={{ width: 'auto', height: 'auto' }}
                draggable={false}
            />
            {speechBubble && (
                <div
                    className="relative bg-white rounded-xl px-3 py-2 shadow-md border border-gray-100 text-sm text-gray-700 max-w-[200px]"
                    style={{ marginBottom: size * 0.3 }}
                >
                    <div className="absolute -left-2 bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-white border-b-[6px] border-b-transparent" />
                    {speechBubble}
                </div>
            )}
        </div>
    )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

interface MascotAvatarProps {
    isSpeaking: boolean
    audioAnalyser?: AnalyserNode | null
    size?: number
    className?: string
}

export function MascotAvatar({
    isSpeaking,
    audioAnalyser,
    size = 150,
    className = '',
}: MascotAvatarProps) {
    const [mouthOpen, setMouthOpen] = useState(false)
    const requestRef = useRef<number | null>(null)

    // Simple Lip-sync based on Audio Analyser volume
    useEffect(() => {
        if (!isSpeaking || !audioAnalyser) {
            setMouthOpen(false)
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current)
            return
        }

        const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount)

        const updateMouth = () => {
            audioAnalyser.getByteFrequencyData(dataArray)
            // Calculate average volume
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] ?? 0
            }
            const average = sum / dataArray.length

            // Threshold for mouth open
            setMouthOpen(average > 15) // Adjust threshold as needed

            requestRef.current = requestAnimationFrame(updateMouth)
        }

        updateMouth()

        return () => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current)
        }
    }, [isSpeaking, audioAnalyser])

    return (
        <div 
            className={`relative rounded-full bg-gradient-to-br from-cyan-200 to-blue-400 shadow-xl overflow-hidden flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Animated breathing background */}
            <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ animationDuration: '3s' }} />
            
            {/* Mascot Image */}
            <Image
                src={mouthOpen ? "/mascot/core/fuxie-core-surprised.png?v=2" : "/mascot/core/fuxie-core-happy-wave.png?v=2"}
                alt="Fuxie Mascot"
                width={size * 0.8}
                height={size * 0.8}
                className="relative z-10 transition-transform duration-100 object-contain drop-shadow-md"
                style={{
                    transform: mouthOpen ? 'scale(1.02)' : 'scale(1)',
                }}
            />
            
            {/* Audio Wave Ring (only when speaking) */}
            {isSpeaking && (
                <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" style={{ animationDuration: '1.5s' }} />
            )}
        </div>
    )
}

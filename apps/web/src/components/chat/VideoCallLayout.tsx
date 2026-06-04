'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { MascotAvatar } from './MascotAvatar'
import { useLiveAPI } from '@/hooks/useLiveAPI'
import { SCENARIOS } from '@/lib/content/scenarios'

interface VideoCallLayoutProps {
    onEndCall: () => void
    level: string
    scenarioId: string
}

export function VideoCallLayout({ onEndCall, level, scenarioId }: VideoCallLayoutProps) {
    const t = useTranslations('Chat')
    const [isMuted, setIsMuted] = useState(false)
    const [showSummary, setShowSummary] = useState(false)
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [pronunciationErrors, setPronunciationErrors] = useState<any[]>([])
    const [pronunciationFeedbackStatus, setPronunciationFeedbackStatus] = useState<'pending' | 'ready' | 'unavailable'>('pending')
    
    const MAX_CALL_DURATION_SEC = 300 // 5 minutes
    const [timeLeft, setTimeLeft] = useState(MAX_CALL_DURATION_SEC)
    
    const audioAnalyserRef = useRef<AnalyserNode | null>(null)
    
    const { connect, disconnect, isConnected, isSpeaking, transcript, fullTranscript, connectionError } = useLiveAPI()
    const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0]!

    // Connect on mount
    useEffect(() => {
        connect(scenarioId)
        return () => disconnect()
    }, [connect, disconnect, scenarioId])

    // Countdown Timer Logic
    useEffect(() => {
        if (!isConnected || showSummary) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleEndCall()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isConnected, showSummary])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    const handleEndCall = async () => {
        disconnect()
        setShowSummary(true)
        setIsSummarizing(true)
        setPronunciationFeedbackStatus('pending')
        
        // Extract pronunciation feedback from transcript JSON blocks
        try {
            const matches = fullTranscript.match(/"pronunciation_feedback"\s*:\s*(\[.*?\])/s)
            if (matches && matches[1]) {
                const parsed = JSON.parse(matches[1])
                if (Array.isArray(parsed)) {
                    setPronunciationErrors(parsed)
                    setPronunciationFeedbackStatus('ready')
                } else {
                    setPronunciationErrors([])
                    setPronunciationFeedbackStatus('unavailable')
                }
            } else {
                setPronunciationErrors([])
                setPronunciationFeedbackStatus('unavailable')
            }
        } catch (e) {
            setPronunciationErrors([])
            setPronunciationFeedbackStatus('unavailable')
        }

        // Save memory
        try {
            await fetch('/api/v1/chat/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullTranscript })
            })
        } catch (error) {
            console.error('Failed to save memory', error)
        } finally {
            setIsSummarizing(false)
        }
    }

    if (showSummary) {
        return (
            <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-4xl mx-auto bg-gray-900 rounded-3xl overflow-hidden p-8 shadow-2xl items-center justify-center text-white">
                <h2 className="text-3xl font-bold mb-6">{t('videoCall.summary')}</h2>
                
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mb-8 text-left">
                    <h3 className="text-xl font-semibold mb-4 text-blue-400">{t('videoCall.pronunciationFeedback')}</h3>
                    {pronunciationFeedbackStatus === 'unavailable' ? (
                        <p className="text-amber-200">{t('videoCall.feedbackUnavailable')}</p>
                    ) : pronunciationErrors.length > 0 ? (
                        <ul className="space-y-4">
                            {pronunciationErrors.map((err, idx) => (
                                <li key={idx} className="bg-gray-700/50 p-4 rounded-lg">
                                    <span className="font-bold text-red-400 block mb-1">&quot;{err.word}&quot;</span>
                                    <span className="text-gray-300">{err.phoneme_error}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">{t('videoCall.noErrorsFeedback')}</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={onEndCall}
                        disabled={isSummarizing}
                        className="px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
                    >
                        {isSummarizing ? t('videoCall.savingMemory') : t('videoCall.complete')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] w-full max-w-4xl mx-auto bg-gray-900 rounded-3xl overflow-hidden relative shadow-2xl">
            {/* Main Video Area (AI Avatar) */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-gray-800 to-gray-900">
                
                {/* Background ambient glow when speaking */}
                {isSpeaking && (
                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                )}

                {/* Missions Overlay - Top Left */}
                {scenario.missions.length > 0 && (
                    <div className="absolute top-6 left-6 w-64 bg-black/40 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-white/10 z-20 hidden md:block">
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-blue-300">
                            <span>🎯</span> {t('videoCall.scenarioMissions')}
                        </h3>
                        <ul className="space-y-3">
                            {scenario.missions.map((m: any) => (
                                <li key={m.id} className="text-xs flex gap-2 items-start text-gray-200 bg-black/20 p-2.5 rounded-lg">
                                    <div className="w-3.5 h-3.5 rounded-full border border-gray-400 shrink-0 mt-0.5" />
                                    <span>{m.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Countdown Timer Badge */}
                <div className="absolute top-6 right-6">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-md font-bold text-lg shadow-lg flex items-center gap-2 transition-colors ${
                        timeLeft <= 60 
                            ? 'bg-red-500/80 text-white animate-pulse' 
                            : 'bg-black/40 text-white'
                    }`}>
                        ⏱ {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <MascotAvatar 
                        isSpeaking={isSpeaking} 
                        audioAnalyser={audioAnalyserRef.current}
                        size={220}
                        className={!isConnected ? 'opacity-50 blur-sm' : 'opacity-100'}
                    />
                    
                    {/* Status Badge */}
                    <div className="mt-8 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-sm font-medium flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-400' : !isConnected ? 'bg-yellow-400' : isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                        {connectionError ? t('videoCall.connectError') : !isConnected ? t('videoCall.connecting') : isSpeaking ? t('videoCall.aiSpeaking') : t('videoCall.aiListening')}
                    </div>
                    {connectionError && (
                        <div className="mt-3 max-w-md text-center text-xs text-red-200 bg-red-950/60 border border-red-500/30 rounded-xl px-4 py-2">
                            {connectionError}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-24 left-0 w-full px-8 flex justify-center">
                    <div className="bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-2xl max-w-2xl text-center shadow-xl">
                        <p className="text-lg leading-relaxed font-medium">
                            {transcript || '...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Self Camera (User) Placeholder - Bottom Right */}
            <div className="absolute bottom-28 right-6 w-32 h-44 bg-gray-800 rounded-2xl border-2 border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
                <div className="text-4xl">👤</div>
                {isMuted && (
                    <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className="h-20 bg-gray-950 flex items-center justify-center gap-6 px-6">
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                    {isMuted ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                <button 
                    onClick={handleEndCall}
                    className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                    {t('videoCall.endCall')}
                </button>
            </div>
        </div>
    )
}

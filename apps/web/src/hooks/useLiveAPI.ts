'use client'

import { useState, useRef, useCallback } from 'react'
import { floatTo16BitPCM, pcm16ToFloat32, arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/audio/pcm'
import { SCENARIOS } from '@/lib/content/scenarios'

export function useLiveAPI() {
    const [isConnected, setIsConnected] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [fullTranscript, setFullTranscript] = useState('')
    const [connectionError, setConnectionError] = useState<string | null>(null)
    
    const wsRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const nextPlayTimeRef = useRef<number>(0)

    const connect = useCallback(async (scenarioId: string = 'free_talk') => {
        try {
            setConnectionError(null)
            // Setup AudioContext FIRST (synchronously) to bypass iOS Safari autoplay restrictions
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
            audioContextRef.current = audioCtx
            nextPlayTimeRef.current = audioCtx.currentTime
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume()
            }

            // 1. Fetch secure token/key
            const res = await fetch('/api/v1/chat/credentials')
            const data = await res.json()
            if (!data.success) throw new Error('Failed to get credentials')
            if (!data.liveApiEnabled) {
                throw new Error(data.error || 'Live voice chat is not enabled.')
            }

            const selectedScenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0]
            const systemPrompt = selectedScenario?.systemPrompt || data.systemPrompt || "Du bist Fuxie, ein freundlicher Deutschlehrer."

            // 2. Connect to WebSocket

            // 3. Connect to WebSocket
            const wsUrl = data.transport === 'proxy' && data.liveProxyUrl
                ? data.liveProxyUrl
                : data.apiKey
                    ? `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${data.apiKey}`
                    : null

            if (!wsUrl) {
                throw new Error('Live voice chat credentials are incomplete.')
            }

            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = async () => {
                setIsConnected(true)
                console.log('[LiveAPI] Connected')
                
                // Send initial setup message
                ws.send(JSON.stringify({
                    setup: {
                        model: 'models/gemini-3.1-flash-live-preview',
                        generationConfig: {
                            responseModalities: ["AUDIO"]
                        },
                        systemInstruction: {
                            parts: [{ text: systemPrompt }]
                        }
                    }
                }))

                // 4. Capture Microphone
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } })
                    streamRef.current = stream
                    
                    const source = audioCtx.createMediaStreamSource(stream)
                    
                    await audioCtx.audioWorklet.addModule('/worklets/pcm-processor.js')
                    const workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor')
                    workletNodeRef.current = workletNode

                    workletNode.port.onmessage = (e) => {
                        if (ws.readyState !== WebSocket.OPEN) return
                        const pcmBuffer = e.data
                        const base64Audio = arrayBufferToBase64(pcmBuffer)
                        
                        ws.send(JSON.stringify({
                            realtimeInput: {
                                mediaChunks: [{
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: base64Audio
                                }]
                            }
                        }))
                    }

                    source.connect(workletNode)
                    // AudioWorkletNode does not need to connect to destination to process audio
                } catch (err) {
                    console.error('[LiveAPI] Microphone access denied', err)
                }
            }

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.serverContent?.modelTurn) {
                        const parts = msg.serverContent.modelTurn.parts
                        for (const part of parts) {
                            if (part.text) {
                                setTranscript(prev => prev + part.text)
                                setFullTranscript(prev => prev + ' ' + part.text)
                            }
                            if (part.inlineData && part.inlineData.data) {
                                setIsSpeaking(true)
                                // Play audio
                                const base64 = part.inlineData.data
                                const arrayBuffer = base64ToArrayBuffer(base64)
                                const float32Data = pcm16ToFloat32(arrayBuffer)
                                
                                const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 16000)
                                audioBuffer.getChannelData(0).set(float32Data)
                                
                                const source = audioCtx.createBufferSource()
                                source.buffer = audioBuffer
                                source.connect(audioCtx.destination)
                                
                                const startTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current)
                                source.start(startTime)
                                nextPlayTimeRef.current = startTime + audioBuffer.duration
                                
                                source.onended = () => {
                                    if (audioCtx.currentTime >= nextPlayTimeRef.current - 0.1) {
                                        setIsSpeaking(false)
                                    }
                                }
                            }
                        }
                    }
                    if (msg.serverContent?.turnComplete) {
                        setTranscript('') // Clear short-term transcript after turn
                    }
                } catch (e) {
                    console.error('[LiveAPI] Parse error', e)
                }
            }

            ws.onclose = () => {
                disconnect()
            }

        } catch (error) {
            console.error('[LiveAPI] Connection failed:', error)
            setConnectionError(error instanceof Error ? error.message : 'Live voice chat connection failed.')
            setIsConnected(false)
        }
    }, [])

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        if (workletNodeRef.current) {
            workletNodeRef.current.port.close()
            workletNodeRef.current.disconnect()
            workletNodeRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        setIsConnected(false)
        setIsSpeaking(false)
    }, [])

    return {
        connect,
        disconnect,
        isConnected,
        isSpeaking,
        transcript,
        fullTranscript,
        connectionError
    }
}

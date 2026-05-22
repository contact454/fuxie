'use client'

import React, { useState, useRef, useEffect } from 'react'

interface AudioRecorderProps {
    onTranscript: (text: string) => void
    onError: (err: string) => void
    onAudioReady?: (blob: Blob) => void
    className?: string
    buttonText?: string
    language?: string
}

type RecorderState = 'idle' | 'recording' | 'processing'

export default function AudioRecorder({ 
    onTranscript, 
    onError, 
    onAudioReady,
    className = '', 
    buttonText = 'Bắt đầu nói',
    language = 'de' 
}: AudioRecorderProps) {
    const [state, setState] = useState<RecorderState>('idle')
    const [duration, setDuration] = useState(0)
    
    const mediaRecorder = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
                mediaRecorder.current.stop()
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            
            // Set up audio visualizer
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            const audioCtx = new AudioContextClass()
            audioContextRef.current = audioCtx
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            analyserRef.current = analyser
            
            const source = audioCtx.createMediaStreamSource(stream)
            source.connect(analyser)

            // Start drawing waveform
            drawWaveform()

            // Determine supported mimeType (iOS Safari prefers mp4/aac, Chrome prefers webm)
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
                ? 'audio/webm' 
                : MediaRecorder.isTypeSupported('audio/mp4') 
                    ? 'audio/mp4' 
                    : '' // fallback to browser default

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            mediaRecorder.current = recorder
            audioChunks.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data)
                }
            }

            recorder.onstop = async () => {
                // Stop audio tracks to free mic
                stream.getTracks().forEach(track => track.stop())
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
                if (audioContextRef.current) audioContextRef.current.close()
                
                const finalMimeType = mimeType || 'audio/mp4'
                const audioBlob = new Blob(audioChunks.current, { type: finalMimeType })
                if (onAudioReady) onAudioReady(audioBlob)
                
                await handleTranscription(audioBlob, finalMimeType)
            }

            recorder.start(100) // collect 100ms chunks
            setState('recording')
            setDuration(0)
            
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Error accessing microphone:', err)
            onError('Không thể truy cập Microphone. Em vui lòng cấp quyền cho trình duyệt nhé!')
        }
    }

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop()
            setState('processing')
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const drawWaveform = () => {
        if (!analyserRef.current || !canvasRef.current) return
        
        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        if (!canvasCtx) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height

        const draw = () => {
            if (!analyserRef.current) return
            animationFrameRef.current = requestAnimationFrame(draw)

            analyserRef.current.getByteTimeDomainData(dataArray)

            canvasCtx.fillStyle = 'rgb(243, 244, 246)' // Tailwind gray-100 to match background
            canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight)

            canvasCtx.lineWidth = 2
            canvasCtx.strokeStyle = 'rgb(59, 130, 246)' // Tailwind blue-500
            canvasCtx.beginPath()

            const sliceWidth = canvasWidth * 1.0 / bufferLength
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                const val = dataArray[i] ?? 128
                const v = val / 128.0
                const y = v * canvasHeight / 2

                if (i === 0) {
                    canvasCtx.moveTo(x, y)
                } else {
                    canvasCtx.lineTo(x, y)
                }

                x += sliceWidth
            }

            canvasCtx.lineTo(canvasWidth, canvasHeight / 2)
            canvasCtx.stroke()
        }

        draw()
    }

    const handleTranscription = async (audioBlob: Blob, mimeType: string) => {
        try {
            const formData = new FormData()
            const ext = mimeType.includes('webm') ? 'webm' : 'm4a'
            const file = new File([audioBlob], `recording.${ext}`, { type: mimeType })
            formData.append('file', file)
            formData.append('language', language)

            const res = await fetch('/api/v1/stt', {
                method: 'POST',
                body: formData,
            })

            const json = await res.json()
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Transcription failed')
            }

            if (!json.data?.transcript?.trim()) {
                throw new Error('Không nghe rõ lời nói. Bạn vui lòng nói to hơn nhé!')
            }

            onTranscript(json.data.transcript)
            setState('idle')
        } catch (err: any) {
            console.error('Transcription error:', err)
            onError(err.message || 'Lỗi nhận diện giọng nói')
            setState('idle')
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    return (
        <div className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm ${className}`}>
            
            <div className="relative w-full h-24 bg-gray-100 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
                {state === 'recording' && (
                    <canvas ref={canvasRef} width={300} height={96} className="absolute inset-0 w-full h-full opacity-70" />
                )}
                
                {state === 'idle' && (
                    <div className="text-gray-400 font-medium">Bấm để bắt đầu thu âm</div>
                )}

                {state === 'processing' && (
                    <div className="flex flex-col items-center animate-pulse text-blue-500">
                        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="font-semibold text-sm">Đang nhận diện giọng nói...</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-4">
                {state === 'idle' && (
                    <button 
                        onClick={startRecording}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        {buttonText}
                    </button>
                )}

                {state === 'recording' && (
                    <>
                        <div className="text-xl font-mono font-bold text-red-500 min-w-[60px] text-center">
                            {formatTime(duration)}
                        </div>
                        <button 
                            onClick={stopRecording}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 animate-pulse"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                            </svg>
                            Dừng lại
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

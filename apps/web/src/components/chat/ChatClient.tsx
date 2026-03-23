'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import Image from 'next/image'

// ─── Types ─────────────────────────────────────────
interface Message {
    id: string
    role: 'user' | 'assistant'
    text: string
    timestamp: Date
}

type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

const LEVEL_COLORS: Record<CefrLevel, { bg: string; text: string; ring: string; gradient: string }> = {
    A1: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-300', gradient: 'from-green-400 to-emerald-500' },
    A2: { bg: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-300', gradient: 'from-teal-400 to-cyan-500' },
    B1: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-300', gradient: 'from-blue-400 to-indigo-500' },
    B2: { bg: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-300', gradient: 'from-indigo-400 to-violet-500' },
    C1: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-300', gradient: 'from-purple-400 to-fuchsia-500' },
    C2: { bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-300', gradient: 'from-rose-400 to-pink-500' },
}

const LEVEL_DESC: Record<CefrLevel, string> = {
    A1: 'Cơ bản — Einfache Sätze',
    A2: 'Sơ cấp — Alltag',
    B1: 'Trung cấp — Selbstständig',
    B2: 'Trung cao — Fließend',
    C1: 'Nâng cao — Kompetent',
    C2: 'Thành thạo — Muttersprachlich',
}

// Simple markdown rendering
function renderMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
        .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^(\d+)\. (.*)/gm, '<li class="ml-4 list-decimal">$2</li>')
        .replace(/\n\n/g, '</p><p class="mb-2">')
        .replace(/\n/g, '<br/>')
}

export function ChatClient() {
    const [level, setLevel] = useState<CefrLevel>('A1')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [showLevelPicker, setShowLevelPicker] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Start a conversation
    const startConversation = useCallback(async (selectedLevel: CefrLevel) => {
        setLevel(selectedLevel)
        setShowLevelPicker(false)
        setHasStarted(true)
        setMessages([])

        try {
            const res = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', level: selectedLevel }),
            })
            const data = await res.json()

            if (data.success) {
                setMessages([{
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    text: data.data.message,
                    timestamp: new Date(),
                }])
            }
        } catch (err) {
            console.error('Start error:', err)
        }
    }, [])

    // Send message with streaming
    const sendMessage = useCallback(async (e?: FormEvent) => {
        e?.preventDefault()
        const text = input.trim()
        if (!text || isStreaming) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            text,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsStreaming(true)

        // Build history for context (last 20 messages)
        const history = [...messages, userMsg].slice(-20).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
        }))

        // Create assistant placeholder
        const assistantId = crypto.randomUUID()
        setMessages(prev => [...prev, {
            id: assistantId,
            role: 'assistant',
            text: '',
            timestamp: new Date(),
        }])

        try {
            abortRef.current = new AbortController()

            const res = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history, level }),
                signal: abortRef.current.signal,
            })

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Unknown error' }))
                setMessages(prev => prev.map(m =>
                    m.id === assistantId
                        ? { ...m, text: `❌ Lỗi: ${error.error || 'AI không phản hồi'}` }
                        : m
                ))
                setIsStreaming(false)
                return
            }

            // Read the stream
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value, { stream: true })
                    fullText += chunk

                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, text: fullText } : m
                    ))
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setMessages(prev => prev.map(m =>
                    m.id === assistantId
                        ? { ...m, text: '❌ Lỗi kết nối. Vui lòng thử lại.' }
                        : m
                ))
            }
        } finally {
            setIsStreaming(false)
            abortRef.current = null
            inputRef.current?.focus()
        }
    }, [input, isStreaming, messages, level])

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const colors = LEVEL_COLORS[level]

    // ─── Level Picker Screen ───────────────────────
    if (!hasStarted || showLevelPicker) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
                {/* Mascot */}
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-200/50 animate-bounce" style={{ animationDuration: '3s' }}>
                        <Image
                            src="/mascot/poses/happy.png"
                            alt="Fuxie"
                            width={80}
                            height={80}
                            className="drop-shadow-md"
                        />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Trò chuyện với Fuxie 🦊
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
                    Chọn trình độ để Fuxie điều chỉnh cuộc trò chuyện phù hợp
                </p>

                {/* Level Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                    {(Object.keys(LEVEL_COLORS) as CefrLevel[]).map(l => (
                        <button
                            key={l}
                            onClick={() => startConversation(l)}
                            className={`relative overflow-hidden rounded-2xl p-4 text-white font-bold text-lg
                                bg-gradient-to-br ${LEVEL_COLORS[l].gradient} shadow-md
                                hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]
                                transition-all duration-200 ease-out`}
                        >
                            <div className="relative z-10">
                                <div className="text-xl mb-1">{l}</div>
                                <div className="text-[10px] font-normal opacity-80">{LEVEL_DESC[l]}</div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 text-5xl opacity-10">🦊</div>
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // ─── Chat Screen ────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3
                bg-gradient-to-r ${colors.gradient} text-white rounded-b-2xl shadow-lg`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Image src="/mascot/poses/happy.png" alt="Fuxie" width={32} height={32} />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm">Fuxie Tutor 🦊</h2>
                        <p className="text-[10px] opacity-80">
                            {isStreaming ? 'Schreibt...' : 'Online • ' + LEVEL_DESC[level]}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowLevelPicker(true)}
                        className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors backdrop-blur-sm"
                    >
                        {level}
                    </button>
                    <button
                        onClick={() => startConversation(level)}
                        className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs transition-colors backdrop-blur-sm"
                        title="Cuộc trò chuyện mới"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                    >
                        {/* Fuxie avatar */}
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mb-1">
                                <Image src="/mascot/poses/happy.png" alt="🦊" width={24} height={24} />
                            </div>
                        )}

                        {/* Bubble */}
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                                ${msg.role === 'user'
                                    ? `bg-gradient-to-r ${colors.gradient} text-white rounded-br-md`
                                    : 'bg-white text-gray-800 ring-1 ring-gray-100 rounded-bl-md'
                                }
                                ${msg.role === 'assistant' && !msg.text ? 'animate-pulse' : ''}
                            `}
                        >
                            {msg.role === 'assistant' && !msg.text ? (
                                <div className="flex gap-1.5 py-1">
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            ) : msg.role === 'assistant' ? (
                                <div
                                    className="prose prose-sm max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                                />
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}
                        </div>

                        {/* User avatar */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mb-1 text-sm">
                                👤
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 px-4 py-3 bg-gray-50/80 backdrop-blur-md border-t border-gray-100">
                <form onSubmit={sendMessage} className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Schreib etwas auf Deutsch..."
                            rows={1}
                            className="w-full rounded-2xl bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-300
                                px-4 py-3 pr-12 text-sm resize-none outline-none transition-all
                                placeholder:text-gray-400 max-h-32 overflow-y-auto"
                            style={{ minHeight: '44px' }}
                            disabled={isStreaming}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0
                            bg-gradient-to-r ${colors.gradient} text-white shadow-md
                            hover:shadow-lg hover:scale-105 active:scale-95
                            disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-md
                            transition-all duration-150`}
                    >
                        {isStreaming ? (
                            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                        )}
                    </button>
                </form>
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    Shift+Enter để xuống dòng · Fuxie có thể sai, hãy kiểm tra lại
                </p>
            </div>
        </div>
    )
}

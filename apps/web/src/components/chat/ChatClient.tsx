'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import Image from 'next/image'
import { getCefrTheme, CEFR_LEVELS } from '@/lib/constants/cefr'
import type { CefrLevel } from '@/lib/constants/cefr'
import { CorrectionBubble } from './CorrectionBubble'
import { SuggestedTopics } from './SuggestedTopics'
import { ChatHistory } from './ChatHistory'
import { VoiceInput } from './VoiceInput'

// ─── Types ─────────────────────────────────────────
interface Correction {
    original: string
    corrected: string
    explanation: string
    rule: string
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    text: string
    corrections?: Correction[]
    suggestedFollowUps?: string[]
    timestamp: Date
}

interface ChatClientProps {
    initialLevel?: CefrLevel
    displayName?: string
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

export function ChatClient({ initialLevel, displayName }: ChatClientProps) {
    const [level, setLevel] = useState<CefrLevel>(initialLevel ?? 'A1')
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showLevelPicker, setShowLevelPicker] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // ─── Start a new conversation ──────────────────
    const startConversation = useCallback(async (selectedLevel: CefrLevel) => {
        setLevel(selectedLevel)
        setShowLevelPicker(false)
        setHasStarted(true)
        setMessages([])
        setConversationId(null)
        setSuggestedTopics([])

        try {
            const res = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', level: selectedLevel }),
            })
            const data = await res.json()

            if (data.success) {
                setConversationId(data.data.conversationId)
                setMessages([{
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    text: data.data.message,
                    timestamp: new Date(),
                }])
                setSuggestedTopics(data.data.suggestedTopics ?? [])
            }
        } catch (err) {
            console.error('Start error:', err)
        }
    }, [])

    // ─── Send a message ────────────────────────────
    const sendMessage = useCallback(async (e?: FormEvent) => {
        e?.preventDefault()
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            text,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)
        setSuggestedTopics([]) // Clear suggestions while loading

        // Build history for context (last 20 messages)
        const history = [...messages, userMsg].slice(-20).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            text: m.text,
        }))

        // Add assistant placeholder
        const assistantId = crypto.randomUUID()
        setMessages(prev => [...prev, {
            id: assistantId,
            role: 'assistant',
            text: '',
            timestamp: new Date(),
        }])

        try {
            const res = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history,
                    level,
                    conversationId,
                }),
            })

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Unknown error' }))
                setMessages(prev => prev.map(m =>
                    m.id === assistantId
                        ? { ...m, text: `❌ Lỗi: ${error.error || 'AI không phản hồi'}` }
                        : m
                ))
                setIsLoading(false)
                return
            }

            const data = await res.json()

            if (data.success) {
                // Update conversation ID if this was the first message
                if (data.data.conversationId && !conversationId) {
                    setConversationId(data.data.conversationId)
                }

                setMessages(prev => prev.map(m =>
                    m.id === assistantId
                        ? {
                            ...m,
                            text: data.data.text,
                            corrections: data.data.corrections,
                            suggestedFollowUps: data.data.suggestedFollowUps,
                        }
                        : m
                ))

                // Set follow-up suggestions
                if (data.data.suggestedFollowUps?.length > 0) {
                    setSuggestedTopics(data.data.suggestedFollowUps)
                }
            }
        } catch (err) {
            console.error('[Chat] Send error:', err)
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, text: '❌ Lỗi kết nối. Vui lòng thử lại.' }
                    : m
            ))
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }, [input, isLoading, messages, level, conversationId])

    // ─── Handle topic / follow-up click ────────────
    const handleTopicSelect = useCallback((topic: string) => {
        setInput(topic)
        // Auto-send after a short delay for UX
        setTimeout(() => {
            const textarea = inputRef.current
            if (textarea) {
                textarea.focus()
            }
        }, 50)
    }, [])

    // ─── Handle voice transcript ───────────────────
    const handleVoiceTranscript = useCallback((text: string) => {
        setInput(prev => (prev ? prev + ' ' + text : text))
        inputRef.current?.focus()
    }, [])

    // ─── Load conversation from history ────────────
    const loadConversation = useCallback(async (convId: string) => {
        try {
            const res = await fetch(`/api/v1/chat/history/${convId}`)
            if (!res.ok) return

            const data = await res.json()
            if (!data.success) return

            const conv = data.data
            setConversationId(conv.id)
            setLevel(conv.level as CefrLevel)
            setHasStarted(true)
            setShowLevelPicker(false)
            setMessages(conv.messages.map((m: { id: string; role: string; text: string; corrections: Correction[]; timestamp: string }) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                text: m.text,
                corrections: m.corrections,
                timestamp: new Date(m.timestamp),
            })))
            setSuggestedTopics([])
        } catch (err) {
            console.error('[Chat] Load conversation error:', err)
        }
    }, [])

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const theme = getCefrTheme(level)

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
                    {displayName
                        ? `Chào ${displayName}! Chọn trình độ để Fuxie điều chỉnh cuộc trò chuyện phù hợp`
                        : 'Chọn trình độ để Fuxie điều chỉnh cuộc trò chuyện phù hợp'
                    }
                </p>

                {/* Level Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
                    {CEFR_LEVELS.map(l => {
                        const t = getCefrTheme(l)
                        return (
                            <button
                                key={l}
                                onClick={() => startConversation(l)}
                                className={`relative overflow-hidden rounded-2xl p-4 text-white font-bold text-lg
                                    bg-gradient-to-br ${t.gradient} shadow-md
                                    hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]
                                    transition-all duration-200 ease-out`}
                            >
                                <div className="relative z-10">
                                    <div className="text-xl mb-1">{l}</div>
                                    <div className="text-[10px] font-normal opacity-80">{LEVEL_DESC[l]}</div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 text-5xl opacity-10">🦊</div>
                            </button>
                        )
                    })}
                </div>

                {/* History button */}
                <button
                    onClick={() => setShowHistory(true)}
                    className="mt-6 px-5 py-2.5 rounded-full text-sm font-medium text-gray-500
                        bg-white ring-1 ring-gray-200 shadow-sm
                        hover:bg-gray-50 hover:ring-gray-300 hover:text-gray-700
                        transition-all duration-200"
                >
                    📜 Lịch sử trò chuyện
                </button>

                {/* History sidebar */}
                <ChatHistory
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    onSelectConversation={loadConversation}
                    onNewChat={() => setShowLevelPicker(true)}
                    activeConversationId={conversationId ?? undefined}
                />
            </div>
        )
    }

    // ─── Chat Screen ────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            {/* Header */}
            <div
                className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 text-white rounded-b-2xl shadow-lg"
                style={{ background: theme.cssGradient }}
            >
                <div className="flex items-center gap-3">
                    {/* History button */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center
                            backdrop-blur-sm hover:bg-white/30 transition-colors"
                        title="Lịch sử"
                    >
                        📜
                    </button>
                    <div>
                        <h2 className="font-bold text-sm">Fuxie Tutor 🦊</h2>
                        <p className="text-[10px] opacity-80">
                            {isLoading ? 'Schreibt...' : 'Online • ' + LEVEL_DESC[level]}
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
                        <div className="max-w-[80%]">
                            <div
                                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user'
                                        ? 'text-white rounded-br-md'
                                        : 'bg-white text-gray-800 ring-1 ring-gray-100 rounded-bl-md'
                                    }
                                    ${msg.role === 'assistant' && !msg.text ? 'animate-pulse' : ''}
                                `}
                                style={msg.role === 'user' ? { background: theme.cssGradient } : undefined}
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

                            {/* Corrections */}
                            {msg.role === 'assistant' && msg.corrections && msg.corrections.length > 0 && (
                                <CorrectionBubble corrections={msg.corrections} />
                            )}

                            {/* Follow-up suggestions (only on last assistant message) */}
                            {msg.role === 'assistant' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 &&
                                msg.id === messages[messages.length - 1]?.id && (
                                    <SuggestedTopics
                                        topics={msg.suggestedFollowUps}
                                        onSelect={handleTopicSelect}
                                        variant="inline"
                                    />
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

                {/* Suggested topics at start (when only greeting exists) */}
                {messages.length === 1 && suggestedTopics.length > 0 && (
                    <div className="mt-4">
                        <p className="text-xs text-gray-400 text-center mb-2">💡 Gợi ý chủ đề</p>
                        <SuggestedTopics
                            topics={suggestedTopics}
                            onSelect={handleTopicSelect}
                            variant="grid"
                        />
                    </div>
                )}

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
                            className="w-full rounded-2xl bg-white ring-1 ring-gray-200 focus:ring-2 focus:ring-orange-300
                                px-4 py-3 pr-12 text-sm resize-none outline-none transition-all
                                placeholder:text-gray-400 max-h-32 overflow-y-auto"
                            style={{ minHeight: '44px' }}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Voice input */}
                    <VoiceInput
                        onTranscript={handleVoiceTranscript}
                        disabled={isLoading}
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0
                            text-white shadow-md
                            hover:shadow-lg hover:scale-105 active:scale-95
                            disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-md
                            transition-all duration-150"
                        style={{ background: theme.cssGradient }}
                    >
                        {isLoading ? (
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
                    Shift+Enter để xuống dòng · 🎤 nhập giọng nói · Fuxie có thể sai
                </p>
            </div>

            {/* History sidebar */}
            <ChatHistory
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onSelectConversation={loadConversation}
                onNewChat={() => startConversation(level)}
                activeConversationId={conversationId ?? undefined}
            />
        </div>
    )
}

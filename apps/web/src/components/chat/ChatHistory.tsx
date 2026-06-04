'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { getCefrTheme } from '@/lib/constants/cefr'

interface Conversation {
    id: string
    title: string
    level: string
    totalMessages: number
    lastMessage: string
    updatedAt: string
}

interface ChatHistoryProps {
    isOpen: boolean
    onClose: () => void
    onSelectConversation: (id: string) => void
    onNewChat: () => void
    activeConversationId?: string
}

export function ChatHistory({
    isOpen,
    onClose,
    onSelectConversation,
    onNewChat,
    activeConversationId,
}: ChatHistoryProps) {
    const t = useTranslations('Chat')
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchHistory = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/v1/chat/history')
            if (res.ok) {
                const data = await res.json()
                setConversations(data.data?.conversations ?? [])
            }
        } catch (err) {
            console.error('[ChatHistory] Failed to fetch:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen) fetchHistory()
    }, [isOpen, fetchHistory])

    const handleDelete = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await fetch('/api/v1/chat/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convId }),
            })
            setConversations(prev => prev.filter(c => c.id !== convId))
        } catch (err) {
            console.error('[ChatHistory] Delete error:', err)
        }
    }

    const formatDate = (iso: string) => {
        const d = new Date(iso)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const mins = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (mins < 1) return 'Gerade eben'
        if (mins < 60) return `${mins} Min.`
        if (hours < 24) return `${hours} Std.`
        if (days < 7) return `${days} Tage`
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar panel */}
            <div
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50
                    shadow-2xl transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-800">{t('history.title')}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center
                            text-gray-500 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* New chat button */}
                <div className="px-4 py-3">
                    <button
                        onClick={() => {
                            onNewChat()
                            onClose()
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500
                            text-white font-semibold text-sm shadow-sm
                            hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                            transition-all duration-200"
                    >
                        ✨ {t('client.newChatTooltip')}
                    </button>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1"
                    style={{ maxHeight: 'calc(100vh - 160px)' }}>
                    {isLoading ? (
                        <div className="space-y-2 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3 opacity-40">🦊</div>
                            <p className="text-sm text-gray-400">{t('history.empty')}</p>
                            <p className="text-xs text-gray-300 mt-1">{t('history.startPrompt')}</p>
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const theme = getCefrTheme(conv.level)
                            const isActive = conv.id === activeConversationId

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        onSelectConversation(conv.id)
                                        onClose()
                                    }}
                                    className={`w-full text-left rounded-xl px-3 py-2.5 group
                                        transition-all duration-150
                                        ${isActive
                                            ? 'bg-[#F3FBFF] ring-1 ring-[#60A8E4]/30'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className="inline-block px-1.5 py-0.5 rounded-md text-xs font-bold"
                                                    style={{
                                                        backgroundColor: theme.bg,
                                                        color: theme.text,
                                                    }}
                                                >
                                                    {conv.level}
                                                </span>
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {conv.title}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                {conv.lastMessage || 'Neues Gespräch'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-xs text-gray-300">
                                                {formatDate(conv.updatedAt)}
                                            </span>
                                            <button
                                                onClick={(e) => handleDelete(conv.id, e)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center
                                                    opacity-0 group-hover:opacity-100
                                                    hover:bg-red-50 text-gray-300 hover:text-red-400
                                                    transition-all duration-150"
                                                title={t('history.deleteTooltip')}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}

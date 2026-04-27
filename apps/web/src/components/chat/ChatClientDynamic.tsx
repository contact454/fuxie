'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { ChatClient as ChatClientComponent } from './ChatClient'

type ChatClientProps = ComponentProps<typeof ChatClientComponent>

const ChatClient = dynamic(() => import('./ChatClient').then(mod => mod.ChatClient), {
    ssr: false,
    loading: () => (
        <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
            <div className="border-b border-gray-100 bg-white px-4 py-3">
                <div className="mx-auto flex max-w-4xl items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-5 w-36 rounded bg-gray-100 animate-pulse" />
                        <div className="mt-2 h-3 w-24 rounded bg-gray-100 animate-pulse" />
                    </div>
                </div>
            </div>
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-end px-4 py-6">
                <div className="mb-4 h-24 w-3/4 rounded-2xl bg-white border border-gray-100 animate-pulse" />
                <div className="mb-4 ml-auto h-16 w-2/3 rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-14 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            </div>
        </div>
    ),
})

export function ChatClientDynamic(props: ChatClientProps) {
    return <ChatClient {...props} />
}

/**
 * Route-specific loading skeleton for the Chat page.
 * Mimics the chat layout: header bar + message bubbles + input area.
 */
export default function ChatLoading() {
    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto animate-pulse">
            {/* Header skeleton */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3
                bg-gradient-to-r from-orange-300 to-amber-400 rounded-b-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/30" />
                    <div>
                        <div className="h-4 w-28 rounded-full bg-white/30 mb-1" />
                        <div className="h-2.5 w-20 rounded-full bg-white/20" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-7 w-10 rounded-full bg-white/20" />
                    <div className="h-7 w-10 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Messages skeleton */}
            <div className="flex-1 overflow-hidden px-4 py-4 space-y-4">
                {/* Assistant message */}
                <div className="flex justify-start items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100" />
                    <div className="max-w-[70%]">
                        <div className="rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-100 px-4 py-3 space-y-2">
                            <div className="h-3 w-48 rounded-full bg-gray-100" />
                            <div className="h-3 w-36 rounded-full bg-gray-100" />
                            <div className="h-3 w-52 rounded-full bg-gray-100" />
                        </div>
                    </div>
                </div>

                {/* User message */}
                <div className="flex justify-end items-end gap-2">
                    <div className="max-w-[60%]">
                        <div className="rounded-2xl rounded-br-md bg-orange-200/50 px-4 py-3 space-y-2">
                            <div className="h-3 w-32 rounded-full bg-orange-300/30" />
                            <div className="h-3 w-24 rounded-full bg-orange-300/30" />
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                </div>

                {/* Another assistant message */}
                <div className="flex justify-start items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100" />
                    <div className="max-w-[75%]">
                        <div className="rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-100 px-4 py-3 space-y-2">
                            <div className="h-3 w-56 rounded-full bg-gray-100" />
                            <div className="h-3 w-40 rounded-full bg-gray-100" />
                            <div className="h-3 w-48 rounded-full bg-gray-100" />
                            <div className="h-3 w-32 rounded-full bg-gray-100" />
                        </div>
                        {/* Correction skeleton */}
                        <div className="mt-2 rounded-xl border border-amber-200/50 bg-amber-50/40 px-3 py-2">
                            <div className="h-3 w-44 rounded-full bg-amber-200/30" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Input skeleton */}
            <div className="sticky bottom-0 px-4 py-3 bg-gray-50/80 border-t border-gray-100">
                <div className="flex items-end gap-2">
                    <div className="flex-1 h-11 rounded-2xl bg-white ring-1 ring-gray-200" />
                    <div className="w-11 h-11 rounded-full bg-gray-100" />
                    <div className="w-11 h-11 rounded-full bg-orange-200/50" />
                </div>
                <div className="h-2 w-48 rounded-full bg-gray-100 mx-auto mt-2" />
            </div>
        </div>
    )
}

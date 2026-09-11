'use client'

import * as React from 'react'
import { TopBar, BottomNav, BottomNavTab } from '@fuxie/ui/components'
import { LearningWorldCanvas } from '@/components/learning-world/LearningWorldCanvas'

export interface WorldMapDashboardClientProps {
    readonly username: string
    readonly streakCount: number
    readonly gemCount: number
    readonly totalLessonsCompleted: number
    readonly xpCount?: number
    readonly avatarUrl?: string
    readonly forceEmpty?: boolean
}

export function WorldMapDashboardClient({
    username,
    streakCount,
    gemCount,
    totalLessonsCompleted,
    xpCount,
    avatarUrl = '',
    forceEmpty = false,
}: WorldMapDashboardClientProps) {
    const isMarktplatzMastered = !forceEmpty && totalLessonsCompleted > 0

    // Cấu hình worldMapScene với tọa độ realigned theo bbox của styleframe final
    const worldMapScene = React.useMemo(() => ({
        grid: {
            tileWidth: 64,
            tileHeight: 32,
            cols: 10,
            rows: 10,
        },
        camera: {
            minZoom: 1.0,
            maxZoom: 1.0,
            initialZoom: 1.0,
        },
        terrain: [],
        isTransparent: true,
        backgroundImage: '/images/worldmap-styleframe-final.png',
        canvasAriaLabel: 'Fuxie Learning World Map' /* // locale-allow */,
        objects: [
            {
                id: 'marktplatz',
                gx: 5,
                gy: 2,
                footprint: { w: 1, d: 1 },
                assetKey: 'marktplatz',
                ariaLabel: 'Marktplatz' /* // locale-allow */,
                href: '/course',
                meta: {
                    x: 35, // Trái-trên, ngay trên quầy chợ và không che mascot Fuxie bên trái
                    y: 26,
                    state: isMarktplatzMastered ? 'mastered' : 'open',
                    nodeNumber: 1,
                    title: 'Marktplatz' /* // locale-allow */,
                    isPrimaryCta: !isMarktplatzMastered,
                    href: '/course',
                },
            },
            {
                id: 'wohnhaus',
                gx: 3,
                gy: 4,
                footprint: { w: 1, d: 1 },
                assetKey: 'wohnhaus',
                ariaLabel: 'Wohnhaus' /* // locale-allow */,
                meta: {
                    x: 75, // Phải-trên
                    y: 39,
                    state: 'locked',
                    nodeNumber: 2,
                    title: 'Wohnhaus' /* // locale-allow */,
                },
            },
            {
                id: 'schulhaus',
                gx: 3,
                gy: 8,
                footprint: { w: 1, d: 1 },
                assetKey: 'schulhaus',
                ariaLabel: 'Schulhaus' /* // locale-allow */,
                meta: {
                    x: 74, // Phải-giữa
                    y: 66,
                    state: 'locked',
                    nodeNumber: 3,
                    title: 'Schulhaus' /* // locale-allow */,
                },
            },
            {
                id: 'brunnenplatz',
                gx: 5,
                gy: 6,
                footprint: { w: 1, d: 1 },
                assetKey: 'brunnenplatz',
                ariaLabel: 'Brunnenplatz' /* // locale-allow */,
                meta: {
                    x: 48, // Giữa
                    y: 70,
                    state: 'locked',
                    nodeNumber: 4,
                    title: 'Brunnenplatz' /* // locale-allow */,
                },
            },
            {
                id: 'familienhaus',
                gx: 7,
                gy: 4,
                footprint: { w: 1, d: 1 },
                assetKey: 'familienhaus',
                ariaLabel: 'Familienhaus' /* // locale-allow */,
                meta: {
                    x: 27, // Trái-giữa
                    y: 56,
                    state: 'locked',
                    nodeNumber: 5,
                    title: 'Familienhaus' /* // locale-allow */,
                },
            },
            {
                id: 'bahnhof',
                gx: 7,
                gy: 8,
                footprint: { w: 1, d: 1 },
                assetKey: 'bahnhof',
                ariaLabel: 'Bahnhof' /* // locale-allow */,
                meta: {
                    x: 29, // Trái-dưới
                    y: 84,
                    state: 'locked',
                    nodeNumber: 6,
                    title: 'Bahnhof' /* // locale-allow */,
                },
            },
        ],
    }), [isMarktplatzMastered])

    const handleTabChange = React.useCallback((tab: BottomNavTab) => {
        if (tab === 'world') {
            window.location.href = '/dashboard'
        } else if (tab === 'review') {
            window.location.href = '/review'
        } else if (tab === 'profile') {
            window.location.href = '/profile'
        }
    }, [])

    return (
        <div className="min-h-screen bg-[var(--fuxie-blue-50)] flex flex-col relative overflow-x-hidden">
            {/* TopBar overlay cố định trên map */}
            <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--fuxie-blue-200)] shadow-sm">
                <div className="max-w-lg mx-auto w-full">
                    <TopBar
                        username={forceEmpty ? ("Learner" /* // locale-allow */) : username}
                        streakCount={forceEmpty ? 0 : streakCount}
                        coinCount={forceEmpty ? 0 : gemCount}
                        gemCount={0}
                        xpCount={forceEmpty ? 0 : xpCount}
                        avatarUrl={avatarUrl}
                    />
                </div>
            </div>

            {/* Vùng bản đồ full-bleed, cuộn dọc, neo TOP */}
            <main className="flex-1 w-full max-w-lg mx-auto overflow-y-auto">
                <LearningWorldCanvas scene={worldMapScene} />
            </main>

            {/* BottomNav overlay cố định dưới map */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[var(--fuxie-blue-200)] shadow-lg">
                <div className="max-w-lg mx-auto w-full">
                    <BottomNav
                        activeTab="world"
                        onChange={handleTabChange}
                    />
                </div>
            </div>
        </div>
    )
}

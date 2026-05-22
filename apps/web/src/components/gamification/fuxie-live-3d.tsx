'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import { FUXIE_GAMIFICATION_MASCOTS, FUXIE_MASCOT_STATES, FUXIE_MODULE_MASCOTS } from '@/lib/mascot/fuxie-assets'

export type FuxieLive3DState = 'idle' | 'wave' | 'talk' | 'listen' | 'reward' | 'tryAgain'
export type FuxieLive3DQuality = 'adaptive' | 'performance' | 'static'
export type FuxieLive3DSource = 'imageSet' | 'rig'
export type FuxieLive3DAssetKey = 'v19' | 'v18' | 'v17' | 'v16' | 'v15' | 'v14' | 'v13' | 'v12' | 'v11' | 'v10' | 'v9' | 'v8' | 'v7b' | 'v6b'

export const FUXIE_RIGGED_3D_ASSET_SETS: Record<FuxieLive3DAssetKey, {
    model: string
    poster: string
    manifest: string
    clips: readonly FuxieLive3DState[]
}> = {
    v19: {
        model: '/mascot-3d/live/fuxie-motion-balance-rig-v19.glb',
        poster: '/mascot-3d/live/fuxie-motion-balance-rig-v19-poster.png',
        manifest: '/mascot-3d/live/fuxie-motion-balance-rig-v19.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v18: {
        model: '/mascot-3d/live/fuxie-motion-polish-rig-v18.glb',
        poster: '/mascot-3d/live/fuxie-motion-polish-rig-v18-poster.png',
        manifest: '/mascot-3d/live/fuxie-motion-polish-rig-v18.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v17: {
        model: '/mascot-3d/live/fuxie-contour-source-skinned-rig-v17.glb',
        poster: '/mascot-3d/live/fuxie-contour-source-skinned-rig-v17-poster.png',
        manifest: '/mascot-3d/live/fuxie-contour-source-skinned-rig-v17.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v16: {
        model: '/mascot-3d/live/fuxie-unified-source-skinned-rig-v16.glb',
        poster: '/mascot-3d/live/fuxie-unified-source-skinned-rig-v16-poster.png',
        manifest: '/mascot-3d/live/fuxie-unified-source-skinned-rig-v16.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v15: {
        model: '/mascot-3d/live/fuxie-source-locked-skinned-rig-v15.glb',
        poster: '/mascot-3d/live/fuxie-source-locked-skinned-rig-v15-poster.png',
        manifest: '/mascot-3d/live/fuxie-source-locked-skinned-rig-v15.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v14: {
        model: '/mascot-3d/live/fuxie-identity-deform-rig-v14.glb',
        poster: '/mascot-3d/live/fuxie-identity-deform-rig-v14-poster.png',
        manifest: '/mascot-3d/live/fuxie-identity-deform-rig-v14.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v13: {
        model: '/mascot-3d/live/fuxie-deform-rig-v13.glb',
        poster: '/mascot-3d/live/fuxie-deform-rig-v13-poster.png',
        manifest: '/mascot-3d/live/fuxie-deform-rig-v13.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v12: {
        model: '/mascot-3d/live/fuxie-volume-rig-v12.glb',
        poster: '/mascot-3d/live/fuxie-volume-rig-v12-poster.png',
        manifest: '/mascot-3d/live/fuxie-volume-rig-v12.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v11: {
        model: '/mascot-3d/live/fuxie-true-rig-v11.glb',
        poster: '/mascot-3d/live/fuxie-true-rig-v11-poster.png',
        manifest: '/mascot-3d/live/fuxie-true-rig-v11.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v10: {
        model: '/mascot-3d/live/fuxie-imagegen-coherent-v10.glb',
        poster: '/mascot-3d/live/fuxie-imagegen-coherent-v10-poster.png',
        manifest: '/mascot-3d/live/fuxie-imagegen-coherent-v10.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v9: {
        model: '/mascot-3d/live/fuxie-imagegen-modular-v9.glb',
        poster: '/mascot-3d/live/fuxie-imagegen-modular-v9-poster.png',
        manifest: '/mascot-3d/live/fuxie-imagegen-modular-v9.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v8: {
        model: '/mascot-3d/live/fuxie-hunyuan-v8.glb',
        poster: '/mascot-3d/live/fuxie-hunyuan-v8-poster.png',
        manifest: '/mascot-3d/live/fuxie-hunyuan-v8.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v7b: {
        model: '/mascot-3d/live/fuxie-true-mesh-v7b.glb',
        poster: '/mascot-3d/live/fuxie-true-mesh-v7b-poster.png',
        manifest: '/mascot-3d/live/fuxie-true-mesh-v7b.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
    v6b: {
        model: '/mascot-3d/live/fuxie-game-rig-v6b.glb',
        poster: '/mascot-3d/live/fuxie-game-rig-v6b-poster.png',
        manifest: '/mascot-3d/live/fuxie-game-rig-v6b.json',
        clips: ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain'],
    },
} as const

export const FUXIE_RIGGED_3D_ASSETS = FUXIE_RIGGED_3D_ASSET_SETS.v7b

export const FUXIE_IMAGE_ANIMATION_SETS: Record<FuxieLive3DState, readonly string[]> = {
    idle: [
        FUXIE_MASCOT_STATES.wave,
        FUXIE_MODULE_MASCOTS.dashboard,
        FUXIE_MODULE_MASCOTS.reading,
        FUXIE_MASCOT_STATES.wave,
    ],
    wave: [
        FUXIE_MASCOT_STATES.wave,
        FUXIE_MODULE_MASCOTS.listening,
        FUXIE_MASCOT_STATES.wave,
        FUXIE_MODULE_MASCOTS.speaking,
    ],
    talk: [
        FUXIE_MODULE_MASCOTS.speaking,
        FUXIE_MODULE_MASCOTS.chat,
        FUXIE_MODULE_MASCOTS.speaking,
        FUXIE_MASCOT_STATES.wave,
    ],
    listen: [
        FUXIE_MODULE_MASCOTS.listening,
        FUXIE_GAMIFICATION_MASCOTS['daily-goal'],
        FUXIE_MODULE_MASCOTS.listening,
        FUXIE_MODULE_MASCOTS.exam,
    ],
    reward: [
        FUXIE_GAMIFICATION_MASCOTS['perfect-score'],
        FUXIE_GAMIFICATION_MASCOTS.fucoin,
        FUXIE_GAMIFICATION_MASCOTS['achievement-unlocked'],
        FUXIE_GAMIFICATION_MASCOTS['reward-chest'],
    ],
    tryAgain: [
        FUXIE_GAMIFICATION_MASCOTS.mission,
        FUXIE_MODULE_MASCOTS.exam,
        FUXIE_MASCOT_STATES.wave,
        FUXIE_GAMIFICATION_MASCOTS['daily-goal'],
    ],
} as const

const SIZE_MAP = {
    sm: 80,
    md: 112,
    lg: 160,
    xl: 220,
} as const

type FuxieLive3DSize = keyof typeof SIZE_MAP | number

const STATE_CLASS: Record<FuxieLive3DState, string> = {
    idle: 'fuxie-live-rigged-idle',
    wave: 'fuxie-live-rigged-wave',
    talk: 'fuxie-live-rigged-talk',
    listen: 'fuxie-live-rigged-listen',
    reward: 'fuxie-live-rigged-reward',
    tryAgain: 'fuxie-live-rigged-try-again',
}

interface FuxieLive3DProps {
    state?: FuxieLive3DState
    size?: FuxieLive3DSize
    quality?: FuxieLive3DQuality
    fallbackSrc?: string
    source?: FuxieLive3DSource
    assetKey?: FuxieLive3DAssetKey
    alt?: string
    priority?: boolean
    className?: string
    imageClassName?: string
}

interface FuxieRuntime {
    actions: Map<string, THREE.AnimationAction>
    activeAction: THREE.AnimationAction | null
    animationFrame: number
    camera: THREE.OrthographicCamera
    lastFrameAt: number
    mixer: THREE.AnimationMixer
    model: THREE.Group
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
}

interface ImageCanvasFrame {
    image: HTMLImageElement
    src: string
}

const RIG_MOTION_PROFILES = {
    idle: { bob: 0.020, sway: 0.006, tilt: 0.014, squash: 0.012, speed: 2.4 },
    wave: { bob: 0.035, sway: 0.022, tilt: 0.050, squash: 0.018, speed: 4.4 },
    talk: { bob: 0.024, sway: 0.008, tilt: 0.018, squash: 0.026, speed: 7.2 },
    listen: { bob: 0.016, sway: 0.010, tilt: 0.060, squash: 0.010, speed: 2.0 },
    reward: { bob: 0.070, sway: 0.026, tilt: 0.070, squash: 0.040, speed: 5.8 },
    tryAgain: { bob: 0.018, sway: 0.012, tilt: 0.035, squash: 0.012, speed: 2.5 },
} satisfies Record<FuxieLive3DState, { bob: number; sway: number; tilt: number; squash: number; speed: number }>

const V10_LAYER_SOURCE = {
    height: 1536,
    width: 1024,
    worldHeight: 2.95,
} as const

const V10_LAYER_PARTS = [
    { image: 'Fuxie_V10_Tail.png', key: 'tail', rect: [650, 810, 960, 1258], pivot: [700, 1120], z: -0.056 },
    { image: 'Fuxie_V10_Leg_L.png', key: 'legL', rect: [230, 1038, 500, 1438], pivot: [370, 1070], z: 0.020 },
    { image: 'Fuxie_V10_Leg_R.png', key: 'legR', rect: [510, 1038, 815, 1445], pivot: [650, 1070], z: 0.018 },
    { image: 'Fuxie_V10_Body_Hoodie.png', key: 'body', rect: [175, 590, 842, 1145], pivot: [510, 780], z: 0.005 },
    { image: 'Fuxie_V10_Arm_L.png', key: 'armL', rect: [150, 600, 390, 1125], pivot: [310, 660], z: 0.030 },
    { image: 'Fuxie_V10_Arm_R.png', key: 'armR', rect: [675, 600, 858, 1125], pivot: [705, 660], z: 0.032 },
    { image: 'Fuxie_V10_Head.png', key: 'head', rect: [130, 70, 875, 760], pivot: [512, 590], z: 0.055 },
    { image: 'Fuxie_V10_Mouth_Overlay.png', key: 'mouth', rect: [420, 530, 610, 660], pivot: [515, 600], z: 0.060 },
] as const

const V10_LAYER_BOUNDS = {
    height: 1395,
    width: 850,
    x: 110,
    y: 50,
} as const

const V10_STATE_POSE_FRAMES: Partial<Record<FuxieLive3DState, string>> = {
    wave: FUXIE_MASCOT_STATES.wave,
    talk: FUXIE_MODULE_MASCOTS.speaking,
    listen: FUXIE_MODULE_MASCOTS.listening,
    reward: FUXIE_GAMIFICATION_MASCOTS.fucoin,
    tryAgain: FUXIE_GAMIFICATION_MASCOTS.mission,
} as const

function resolveSize(size: FuxieLive3DSize) {
    return typeof size === 'number' ? size : SIZE_MAP[size]
}

function resolveImageFrames(state: FuxieLive3DState, fallbackSrc?: string) {
    const frames = [...FUXIE_IMAGE_ANIMATION_SETS[state]]

    if (fallbackSrc) {
        frames[0] = fallbackSrc
    }

    while (frames.length < 4) {
        frames.push(frames[frames.length - 1] ?? FUXIE_RIGGED_3D_ASSETS.poster)
    }

    return frames.slice(0, 4)
}

function disposeRuntime(runtime: FuxieRuntime | null) {
    if (!runtime) return

    cancelAnimationFrame(runtime.animationFrame)
    runtime.mixer.stopAllAction()
    runtime.renderer.dispose()
    runtime.renderer.domElement.remove()

    runtime.model.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) {
            mesh.geometry.dispose()
        }
        const material = mesh.material
        if (Array.isArray(material)) {
            material.forEach((item) => item.dispose())
        } else if (material) {
            material.dispose()
        }
    })
}

function playClip(runtime: FuxieRuntime | null, clipName: FuxieLive3DState) {
    if (!runtime) return

    const nextAction = runtime.actions.get(clipName) ?? runtime.actions.get('idle')
    if (!nextAction || nextAction === runtime.activeAction) return

    nextAction.enabled = true
    nextAction.reset()
    nextAction.fadeIn(0.22)
    nextAction.play()

    if (runtime.activeAction) {
        runtime.activeAction.fadeOut(0.18)
    }
    runtime.activeAction = nextAction
}

function applyRigMotion(runtime: FuxieRuntime, state: FuxieLive3DState, now: number) {
    const profile = RIG_MOTION_PROFILES[state]
    const seconds = now / 1000
    const primary = Math.sin(seconds * profile.speed)
    const secondary = Math.sin(seconds * profile.speed * 0.5 + 0.7)
    const bounce = state === 'reward' ? Math.abs(primary) : primary
    const talkPulse = state === 'talk' ? Math.max(0, Math.sin(seconds * profile.speed * 1.85)) : 0
    const squash = 1 + (Math.max(0, bounce) + talkPulse * 0.6) * profile.squash

    runtime.model.position.set(
        secondary * profile.sway,
        -0.02 + bounce * profile.bob,
        0
    )
    runtime.model.rotation.z = secondary * profile.tilt
    runtime.model.scale.set(1 / squash, squash, 1)
}

async function createV10LayeredModel(Three: typeof import('three')) {
    const group = new Three.Group()
    const textureLoader = new Three.TextureLoader()
    const scale = V10_LAYER_SOURCE.worldHeight / V10_LAYER_SOURCE.height

    const pixelToWorld = (px: number, py: number) => ({
        x: (px - V10_LAYER_SOURCE.width / 2) * scale,
        y: (V10_LAYER_SOURCE.height - py) * scale,
    })

    for (const part of V10_LAYER_PARTS) {
        const [x0, y0, x1, y1] = part.rect
        const leftTop = pixelToWorld(x0, y0)
        const rightBottom = pixelToWorld(x1, y1)
        const width = Math.abs(rightBottom.x - leftTop.x)
        const height = Math.abs(leftTop.y - rightBottom.y)
        const texture = await textureLoader.loadAsync(`/mascot-3d/imagegen-fullbody/v10/${part.image}`)

        texture.colorSpace = Three.SRGBColorSpace
        texture.needsUpdate = true

        const mesh = new Three.Mesh(
            new Three.PlaneGeometry(width, height),
            new Three.MeshBasicMaterial({
                alphaTest: 0.02,
                depthWrite: false,
                map: texture,
                side: Three.DoubleSide,
                transparent: true,
            })
        )

        mesh.name = part.image.replace('.png', '')
        mesh.position.set((leftTop.x + rightBottom.x) / 2, (leftTop.y + rightBottom.y) / 2, part.z)
        group.add(mesh)
    }

    return group
}

export function FuxieLive3D({
    state = 'idle',
    size = 'md',
    quality = 'adaptive',
    fallbackSrc,
    source = 'imageSet',
    assetKey = 'v7b',
    alt = 'Fuxie 3D coach',
    priority = false,
    className = '',
    imageClassName = '',
}: FuxieLive3DProps) {
    const resolvedSize = resolveSize(size)
    const containerRef = useRef<HTMLSpanElement | null>(null)
    const imageCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const runtimeRef = useRef<FuxieRuntime | null>(null)
    const pendingStateRef = useRef<FuxieLive3DState>(state)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [imageCanvasReady, setImageCanvasReady] = useState(false)
    const [runtimeReady, setRuntimeReady] = useState(false)
    const [runtimeFailed, setRuntimeFailed] = useState(false)
    const selectedAssets = FUXIE_RIGGED_3D_ASSET_SETS[assetKey] ?? FUXIE_RIGGED_3D_ASSETS

    const fallback = fallbackSrc ?? selectedAssets.poster
    const imageFrames = useMemo(() => resolveImageFrames(state, fallbackSrc), [fallbackSrc, state])
    const useV10LayeredCanvas = source === 'rig' && assetKey === 'v10' && quality !== 'static' && !prefersReducedMotion
    const useStaticFallback = source === 'imageSet' || quality === 'static' || prefersReducedMotion || runtimeFailed
    const shouldAnimateImageSet = useStaticFallback || (!runtimeReady && !imageCanvasReady)
    const useImageCanvas = source === 'imageSet' && quality !== 'static' && !prefersReducedMotion
    const useCanvasRenderer = useImageCanvas || useV10LayeredCanvas
    const hasLiveRenderer = (runtimeReady && !useStaticFallback) || imageCanvasReady
    const motionClass = shouldAnimateImageSet ? STATE_CLASS[state] : ''

    const rendererSize = useMemo(() => {
        return {
            height: resolvedSize,
            width: resolvedSize,
        }
    }, [resolvedSize])

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)')
        const updatePreference = () => setPrefersReducedMotion(query.matches)

        updatePreference()
        query.addEventListener('change', updatePreference)

        return () => {
            query.removeEventListener('change', updatePreference)
        }
    }, [])

    useEffect(() => {
        pendingStateRef.current = state
        playClip(runtimeRef.current, state)
    }, [state])

    useEffect(() => {
        if (!useCanvasRenderer) {
            setImageCanvasReady(false)
            return
        }

        const canvas = imageCanvasRef.current
        if (!canvas) return

        let disposed = false
        let frameId = 0
        let lastFrameAt = window.performance.now()
        const dpr = Math.min(window.devicePixelRatio || 1, quality === 'performance' ? 1.5 : 2)
        const width = rendererSize.width
        const height = rendererSize.height
        const ctx = canvas.getContext('2d', { alpha: true })

        if (!ctx) {
            setImageCanvasReady(false)
            return
        }

        canvas.width = Math.max(1, Math.round(width * dpr))
        canvas.height = Math.max(1, Math.round(height * dpr))
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const loadFrame = (src: string): Promise<ImageCanvasFrame> => new Promise((resolve, reject) => {
            const image = new window.Image()
            image.decoding = 'async'
            image.onload = () => resolve({ image, src })
            image.onerror = () => reject(new Error(`Unable to load Fuxie frame: ${src}`))
            image.src = src
        })

        if (useV10LayeredCanvas) {
            const enableQaReadback = window.location.pathname.includes('fuxie-live-qa')
            const basePath = '/mascot-3d/imagegen-fullbody/v10' // asset-registry-allow: dev-only debugger preview for layered imagegen-fullbody canvas, not learner-facing
            const sourceToCanvas = (x: number, y: number, scale: number, offsetX: number, offsetY: number) => ({
                x: offsetX + x * scale,
                y: offsetY + y * scale,
            })
            const drawLayer = (
                frame: ImageCanvasFrame,
                part: (typeof V10_LAYER_PARTS)[number],
                scale: number,
                offsetX: number,
                offsetY: number,
                rotation = 0,
                translateX = 0,
                translateY = 0,
                scaleX = 1,
                scaleY = 1,
                alpha = 1
            ) => {
                if (alpha <= 0) return
                const [x0, y0, x1, y1] = part.rect
                const [pivotX, pivotY] = part.pivot
                const canvasPivot = sourceToCanvas(pivotX, pivotY, scale, offsetX, offsetY)
                ctx.save()
                ctx.globalAlpha = alpha
                ctx.translate(canvasPivot.x + translateX * scale, canvasPivot.y + translateY * scale)
                ctx.rotate(rotation)
                ctx.scale(scaleX, scaleY)
                ctx.translate(-canvasPivot.x, -canvasPivot.y)
                ctx.drawImage(
                    frame.image,
                    offsetX + x0 * scale,
                    offsetY + y0 * scale,
                    (x1 - x0) * scale,
                    (y1 - y0) * scale
                )
                ctx.restore()
            }
            const drawStar = (x: number, y: number, radius: number, alpha: number, color: string) => {
                if (alpha <= 0) return
                ctx.save()
                ctx.globalAlpha = alpha
                ctx.fillStyle = color
                ctx.beginPath()
                for (let point = 0; point < 10; point += 1) {
                    const angle = -Math.PI / 2 + point * Math.PI / 5
                    const pointRadius = point % 2 === 0 ? radius : radius * 0.42
                    const px = x + Math.cos(angle) * pointRadius
                    const py = y + Math.sin(angle) * pointRadius
                    if (point === 0) {
                        ctx.moveTo(px, py)
                    } else {
                        ctx.lineTo(px, py)
                    }
                }
                ctx.closePath()
                ctx.fill()
                ctx.restore()
            }
            const drawMotionArc = (
                x: number,
                y: number,
                radius: number,
                start: number,
                end: number,
                alpha: number,
                color = '#2EC4B6'
            ) => {
                if (alpha <= 0) return
                ctx.save()
                ctx.globalAlpha = alpha
                ctx.strokeStyle = color
                ctx.lineWidth = 2.4
                ctx.lineCap = 'round'
                ctx.beginPath()
                ctx.arc(x, y, radius, start, end)
                ctx.stroke()
                ctx.restore()
            }
            const drawPulseDot = (x: number, y: number, radius: number, alpha: number, color: string) => {
                if (alpha <= 0) return
                ctx.save()
                ctx.globalAlpha = alpha
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(x, y, radius, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
            }
            const drawPoseFrame = (
                frame: ImageCanvasFrame,
                rotation: number,
                translateX: number,
                translateY: number,
                scaleX: number,
                scaleY: number
            ) => {
                ctx.save()
                ctx.translate(width / 2 + translateX, height / 2 + translateY)
                ctx.rotate(rotation)
                ctx.scale(scaleX, scaleY)
                ctx.drawImage(frame.image, -width / 2, -height / 2, width, height)
                ctx.restore()
            }

            Promise.all([
                Promise.all(V10_LAYER_PARTS.map((part) => loadFrame(`${basePath}/${part.image}`))),
                Promise.all(Object.entries(V10_STATE_POSE_FRAMES).map(([stateName, src]) => (
                    loadFrame(src).then((frame) => [stateName, frame] as const)
                ))),
            ])
                .then(([frames, poseFrames]) => {
                    if (disposed) return
                    const frameMap = new Map(frames.map((frame) => [frame.src.split('/').pop(), frame]))
                    const poseFrameMap = new Map<FuxieLive3DState, ImageCanvasFrame>(
                        poseFrames.map(([stateName, frame]) => [stateName as FuxieLive3DState, frame])
                    )
                    let fpsFrameCount = 0
                    let fpsWindowStart = window.performance.now()
                    let totalFrameCount = 0
                    setImageCanvasReady(true)

                    const tick = (now: number) => {
                        if (disposed) return

                        const seconds = now / 1000
                        const currentState = pendingStateRef.current
                        const profile = RIG_MOTION_PROFILES[currentState]
                        const primary = Math.sin(seconds * profile.speed)
                        const secondary = Math.sin(seconds * profile.speed * 0.5 + 0.7)
                        const wavePulse = Math.sin(seconds * 10.5)
                        const rewardPulse = Math.sin(seconds * 8.4)
                        const rewardBounce = currentState === 'reward' ? Math.abs(primary) : primary
                        const talkPulse = currentState === 'talk' ? Math.max(0, Math.sin(seconds * 13.5)) : 0
                        const listenTilt = currentState === 'listen' ? -0.16 : 0
                        const bodyScaleY = 1 + (Math.max(0, rewardBounce) * profile.squash)
                        const bodyScaleX = 1 / bodyScaleY
                        const modelScale = Math.min(
                            width * 0.76 / V10_LAYER_BOUNDS.width,
                            height * 0.94 / V10_LAYER_BOUNDS.height
                        )
                        const offsetX = width / 2 - (V10_LAYER_BOUNDS.x + V10_LAYER_BOUNDS.width / 2) * modelScale
                        const offsetY = height / 2 - (V10_LAYER_BOUNDS.y + V10_LAYER_BOUNDS.height / 2) * modelScale + height * 0.03
                        const bodyBob = -Math.abs(rewardBounce) * (currentState === 'reward' ? 42 : currentState === 'wave' ? 16 : 9)
                        const bodyTilt = secondary * profile.tilt + (currentState === 'listen' ? -0.035 : 0)
                        const poseShiftX = currentState === 'listen'
                            ? -Math.abs(secondary) * 4
                            : currentState === 'tryAgain'
                                ? Math.sin(seconds * 2.2) * 2.4
                                : 0
                        const poseTilt = bodyTilt
                            + (currentState === 'wave' ? wavePulse * 0.018 : 0)
                            + (currentState === 'reward' ? rewardPulse * 0.014 : 0)

                        ctx.clearRect(0, 0, width, height)
                        ctx.imageSmoothingEnabled = true
                        ctx.imageSmoothingQuality = 'high'
                        ctx.save()
                        ctx.globalAlpha = 0.36
                        ctx.fillStyle = 'rgba(60, 120, 168, 0.16)'
                        ctx.filter = 'blur(5px)'
                        ctx.beginPath()
                        ctx.ellipse(width / 2, height * 0.90, width * 0.22, height * 0.035, 0, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.restore()

                        const poseFrame = poseFrameMap.get(currentState)
                        if (poseFrame) {
                            drawPoseFrame(poseFrame, poseTilt, poseShiftX, bodyBob * 0.18 - talkPulse * 4, bodyScaleX, bodyScaleY)
                        } else {
                            ctx.save()
                            ctx.translate(width / 2, height / 2 + bodyBob * 0.18)
                            ctx.rotate(bodyTilt)
                            ctx.scale(bodyScaleX, bodyScaleY)
                            ctx.translate(-width / 2, -height / 2)

                            for (const part of V10_LAYER_PARTS) {
                                const frame = frameMap.get(part.image)
                                if (!frame) continue

                                let rotation = 0
                                let translateX = 0
                                let translateY = 0
                                let partScaleX = 1
                                let partScaleY = 1
                                let alpha = 1

                                if (part.key === 'tail') {
                                    rotation = secondary * 0.22
                                    translateY = bodyBob * 0.42
                                }
                                if (part.key === 'head') {
                                    rotation = secondary * 0.028
                                    translateY = bodyBob * 0.30
                                }
                                if (part.key === 'armL') {
                                    rotation = secondary * 0.035
                                    translateY = bodyBob * 0.25
                                }
                                if (part.key === 'armR') {
                                    rotation = -secondary * 0.028
                                    translateY = bodyBob * 0.20
                                }
                                if (part.key === 'mouth') {
                                    alpha = 0
                                    partScaleY = 0.82
                                }

                                drawLayer(frame, part, modelScale, offsetX, offsetY, rotation, translateX, translateY, partScaleX, partScaleY, alpha)
                            }

                            ctx.restore()
                        }

                        if (currentState === 'wave') {
                            const waveAlpha = 0.30 + Math.abs(wavePulse) * 0.42
                            drawMotionArc(width * 0.31, height * 0.30, 19 + wavePulse * 2, -2.5, -0.65, waveAlpha, '#2EC4B6')
                            drawMotionArc(width * 0.29, height * 0.27, 28 - wavePulse * 2, -2.55, -0.62, waveAlpha * 0.72, '#3C78A8')
                            drawPulseDot(width * 0.30, height * 0.23, 2.4 + Math.abs(wavePulse) * 1.2, waveAlpha * 0.65, '#FFD166')
                        }
                        if (currentState === 'talk') {
                            const talkAlpha = 0.32 + talkPulse * 0.55
                            drawPulseDot(width * 0.72, height * 0.27, 2.8 + talkPulse * 2.0, talkAlpha, '#2EC4B6')
                            drawPulseDot(width * 0.76, height * 0.24, 2.2 + talkPulse * 1.6, talkAlpha * 0.76, '#3C78A8')
                            drawPulseDot(width * 0.80, height * 0.22, 1.8 + talkPulse * 1.4, talkAlpha * 0.56, '#FFD166')
                        }
                        if (currentState === 'listen') {
                            const listenAlpha = 0.20 + Math.abs(secondary) * 0.34
                            drawMotionArc(width * 0.34, height * 0.26, 25 + Math.abs(secondary) * 5, -2.85, -0.3, listenAlpha, '#2EC4B6')
                            drawMotionArc(width * 0.64, height * 0.26, 25 + Math.abs(secondary) * 5, Math.PI + 0.3, Math.PI * 2.85, listenAlpha, '#2EC4B6')
                        }
                        if (currentState === 'reward') {
                            const sparkleAlpha = 0.35 + Math.abs(rewardPulse) * 0.55
                            drawStar(width * 0.30, height * 0.24 - Math.abs(rewardPulse) * 8, 7, sparkleAlpha, '#FFD166')
                            drawStar(width * 0.72, height * 0.28 - Math.abs(primary) * 10, 6, sparkleAlpha * 0.85, '#FFD166')
                            drawStar(width * 0.64, height * 0.16, 4.5, sparkleAlpha * 0.65, '#2EC4B6')
                        }
                        if (currentState === 'tryAgain') {
                            const tryAlpha = 0.24 + Math.abs(primary) * 0.28
                            drawMotionArc(width * 0.66, height * 0.37, 19 + Math.abs(primary) * 3, -0.85, 0.72, tryAlpha, '#3C78A8')
                            drawStar(width * 0.33, height * 0.70, 4.8, tryAlpha * 0.78, '#FFD166')
                        }

                        fpsFrameCount += 1
                        totalFrameCount += 1
                        if (now - fpsWindowStart >= 500) {
                            const fps = fpsFrameCount * 1000 / (now - fpsWindowStart)
                            canvas.parentElement?.setAttribute('data-fps', fps.toFixed(1))
                            canvas.parentElement?.setAttribute('data-frame-count', String(totalFrameCount))
                            canvas.parentElement?.setAttribute(
                                'data-motion-signature',
                                `${currentState}:${primary.toFixed(2)},${secondary.toFixed(2)},${wavePulse.toFixed(2)},${rewardPulse.toFixed(2)},${talkPulse.toFixed(2)},${poseTilt.toFixed(2)}`
                            )
                            fpsFrameCount = 0
                            fpsWindowStart = now
                        }

                        if (enableQaReadback && Math.floor(now / 500) !== Math.floor(lastFrameAt / 500)) {
                            try {
                                const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data
                                let maxAlpha = 0
                                let maxColor = 0
                                let paintedPixels = 0
                                for (let index = 0; index < sample.length; index += 4) {
                                    const alpha = sample[index + 3] ?? 0
                                    const color = Math.max(sample[index] ?? 0, sample[index + 1] ?? 0, sample[index + 2] ?? 0)
                                    if (alpha > 0 || color > 0) paintedPixels += 1
                                    maxAlpha = Math.max(maxAlpha, alpha)
                                    maxColor = Math.max(maxColor, color)
                                }
                                canvas.parentElement?.setAttribute('data-canvas-pixel', `${paintedPixels}/${canvas.width * canvas.height}`)
                                canvas.parentElement?.setAttribute('data-canvas-max-alpha', String(maxAlpha))
                                canvas.parentElement?.setAttribute('data-canvas-max-color', String(maxColor))
                                canvas.parentElement?.setAttribute('data-runtime-mode', 'v10-layered-canvas')
                            } catch {
                                canvas.parentElement?.setAttribute('data-canvas-pixel', 'unavailable')
                            }
                        }

                        lastFrameAt = now
                        frameId = window.requestAnimationFrame(tick)
                    }

                    frameId = window.requestAnimationFrame(tick)
                })
                .catch((error) => {
                    console.error('[FuxieLive3D] Failed to load V10 layered animation frames', error)
                    if (!disposed) {
                        setImageCanvasReady(false)
                    }
                })

            return () => {
                disposed = true
                window.cancelAnimationFrame(frameId)
            }
        }

        const smooth = (value: number) => value * value * (3 - 2 * value)
        const profile = {
            idle: { duration: 2800, bob: 4, rotate: 0.014, squash: 0.012, sparkle: 0.35 },
            wave: { duration: 1700, bob: 8, rotate: 0.050, squash: 0.018, sparkle: 0.70 },
            talk: { duration: 1150, bob: 3, rotate: 0.018, squash: 0.020, sparkle: 0.42 },
            listen: { duration: 2400, bob: 3, rotate: 0.070, squash: 0.010, sparkle: 0.22 },
            reward: { duration: 1350, bob: 14, rotate: 0.075, squash: 0.035, sparkle: 0.95 },
            tryAgain: { duration: 2600, bob: 4, rotate: 0.040, squash: 0.012, sparkle: 0.28 },
        } satisfies Record<FuxieLive3DState, { duration: number; bob: number; rotate: number; squash: number; sparkle: number }>

        const drawMascot = (
            frame: ImageCanvasFrame,
            alpha: number,
            centerX: number,
            centerY: number,
            rotation: number,
            scaleX: number,
            scaleY: number
        ) => {
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.translate(centerX, centerY)
            ctx.rotate(rotation)
            ctx.scale(scaleX, scaleY)
            ctx.drawImage(frame.image, -width / 2, -height / 2, width, height)
            ctx.restore()
        }

        const drawSpark = (x: number, y: number, size: number, alpha: number, color: string) => {
            ctx.save()
            ctx.globalAlpha = alpha
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }

        Promise.all(imageFrames.map(loadFrame))
            .then((frames) => {
                if (disposed) return
                setImageCanvasReady(true)

                const tick = (now: number) => {
                    if (disposed) return

                    const delta = Math.min((now - lastFrameAt) / 1000, 0.05)
                    lastFrameAt = now
                    const seconds = now / 1000
                    const stateProfile = profile[pendingStateRef.current]
                    const loop = (now % stateProfile.duration) / stateProfile.duration
                    const framePosition = loop * frames.length
                    const currentIndex = Math.floor(framePosition) % frames.length
                    const nextIndex = (currentIndex + 1) % frames.length
                    const blend = smooth(framePosition - Math.floor(framePosition))
                    const pulse = Math.sin(loop * Math.PI * 2)
                    const bounce = Math.sin(loop * Math.PI * 4)
                    const bob = -Math.abs(pulse) * stateProfile.bob
                    const rotation = Math.sin(loop * Math.PI * 2 + 0.25) * stateProfile.rotate
                    const squash = 1 + Math.max(0, bounce) * stateProfile.squash
                    const centerX = width / 2 + Math.sin(seconds * 1.7) * 1.4
                    const centerY = height / 2 + bob

                    ctx.clearRect(0, 0, width, height)
                    ctx.save()
                    ctx.globalAlpha = 0.38
                    ctx.fillStyle = 'rgba(60, 120, 168, 0.16)'
                    ctx.filter = 'blur(5px)'
                    ctx.beginPath()
                    ctx.ellipse(width / 2, height * 0.88, width * 0.24 * (1 - bob / 80), height * 0.035, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()

                    drawMascot(frames[currentIndex]!, 1 - blend, centerX, centerY, rotation, 1 / squash, squash)
                    drawMascot(frames[nextIndex]!, blend, centerX, centerY, rotation * 0.85, 1 / squash, squash)

                    const sparkleAlpha = Math.max(0, Math.sin(loop * Math.PI * 2 - 0.45)) * stateProfile.sparkle
                    drawSpark(width * 0.82, height * 0.22 - sparkleAlpha * 10, 3.2 + sparkleAlpha * 1.8, sparkleAlpha, '#FFD166')
                    drawSpark(width * 0.18, height * 0.34 - sparkleAlpha * 8, 2.7 + sparkleAlpha * 1.4, sparkleAlpha * 0.72, '#2EC4B6')

                    void delta
                    frameId = window.requestAnimationFrame(tick)
                }

                frameId = window.requestAnimationFrame(tick)
            })
            .catch((error) => {
                console.error('[FuxieLive3D] Failed to load image animation frames', error)
                if (!disposed) {
                    setImageCanvasReady(false)
                }
            })

        return () => {
            disposed = true
            window.cancelAnimationFrame(frameId)
        }
    }, [imageFrames, quality, rendererSize.height, rendererSize.width, useCanvasRenderer, useV10LayeredCanvas])

    useEffect(() => {
        if (source === 'imageSet' || quality === 'static' || prefersReducedMotion || useV10LayeredCanvas) {
            setRuntimeReady(false)
            disposeRuntime(runtimeRef.current)
            runtimeRef.current = null
            return
        }

        const container = containerRef.current
        if (!container) return
        const host = container

        let disposed = false
        const loadTimeout = window.setTimeout(() => {
            if (!disposed && !runtimeRef.current) {
                setRuntimeFailed(true)
            }
        }, 9000)

        setRuntimeReady(false)
        setRuntimeFailed(false)
        disposeRuntime(runtimeRef.current)
        runtimeRef.current = null

        async function startRuntime() {
            try {
                const [Three, { GLTFLoader }] = await Promise.all([
                    import('three'),
                    import('three/addons/loaders/GLTFLoader.js'),
                ])

                if (disposed) return

                const enableQaReadback = window.location.pathname.includes('fuxie-live-qa')
                const renderer = new Three.WebGLRenderer({
                    alpha: true,
                    antialias: quality !== 'performance',
                    powerPreference: quality === 'performance' ? 'low-power' : 'high-performance',
                    preserveDrawingBuffer: enableQaReadback,
                })
                renderer.setClearColor(0x000000, 0)
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'performance' ? 1.5 : 2))
                renderer.setSize(rendererSize.width, rendererSize.height, false)
                renderer.domElement.className = 'fuxie-live-rigged-canvas absolute inset-0 h-full w-full'
                renderer.domElement.setAttribute('aria-hidden', 'true')

                const scene = new Three.Scene()
                const camera = new Three.OrthographicCamera(-1.18, 1.18, 1.18, -1.18, 0.1, 20)
                camera.position.set(0, 0, 5)
                camera.lookAt(0, 0, 0)

                const ambient = new Three.HemisphereLight(0xffffff, 0x74a8c7, 2.15)
                const key = new Three.DirectionalLight(0xffffff, 2.45)
                key.position.set(2.4, 3.4, 4.2)
                const fill = new Three.DirectionalLight(0x9ee8ff, 0.72)
                fill.position.set(-2.2, 1.4, 2.2)
                scene.add(ambient, key, fill)

                const isV10LayeredRuntime = selectedAssets.model.includes('fuxie-imagegen-coherent-v10')
                const loader = new GLTFLoader()
                const gltf = isV10LayeredRuntime ? null : await loader.loadAsync(selectedAssets.model)

                if (disposed) {
                    renderer.dispose()
                    return
                }

                const model = isV10LayeredRuntime ? await createV10LayeredModel(Three) : gltf!.scene
                model.traverse((object) => {
                    const mesh = object as THREE.Mesh
                    if (!mesh.isMesh || !mesh.material) return

                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                    materials.forEach((material) => {
                        const usesTransparency = material.transparent || material.opacity < 0.999
                        material.side = Three.DoubleSide
                        material.transparent = usesTransparency
                        material.depthWrite = !usesTransparency
                        material.needsUpdate = true
                    })
                })
                const box = new Three.Box3().setFromObject(model)
                const center = box.getCenter(new Three.Vector3())
                const bounds = box.getSize(new Three.Vector3())
                const maxDimension = Math.max(bounds.x, bounds.y, bounds.z) || 1
                const group = new Three.Group()

                if (enableQaReadback) {
                    host.dataset.runtimeMode = isV10LayeredRuntime ? 'v10-layered' : 'gltf'
                    host.dataset.modelBounds = [bounds.x, bounds.y, bounds.z].map((value) => value.toFixed(3)).join(',')
                    host.dataset.modelCenter = [center.x, center.y, center.z].map((value) => value.toFixed(3)).join(',')
                    host.dataset.modelScale = (2.15 / maxDimension).toFixed(3)
                }

                model.position.set(-center.x, -center.y, -center.z)
                model.scale.setScalar(2.15 / maxDimension)
                group.add(model)
                group.position.set(0, -0.02, 0)
                scene.add(group)

                const mixer = new Three.AnimationMixer(model)
                const actions = new Map<string, THREE.AnimationAction>()
                for (const clip of gltf?.animations ?? []) {
                    actions.set(clip.name, mixer.clipAction(clip))
                }

                host.appendChild(renderer.domElement)

                const runtime: FuxieRuntime = {
                    actions,
                    activeAction: null,
                    animationFrame: 0,
                    camera,
                    lastFrameAt: window.performance.now(),
                    mixer,
                    model: group,
                    renderer,
                    scene,
                }
                runtimeRef.current = runtime
                playClip(runtime, pendingStateRef.current)

                let fpsFrameCount = 0
                let fpsWindowStart = window.performance.now()
                let totalFrameCount = 0

                const tick = () => {
                    if (disposed) return

                    const now = window.performance.now()
                    const delta = Math.min((now - runtime.lastFrameAt) / 1000, 0.05)
                    runtime.lastFrameAt = now
                    runtime.mixer.update(delta)
                    applyRigMotion(runtime, pendingStateRef.current, now)
                    runtime.camera.updateProjectionMatrix()
                    runtime.camera.updateMatrixWorld()
                    runtime.scene.updateMatrixWorld(true)
                    runtime.renderer.render(runtime.scene, runtime.camera)
                    fpsFrameCount += 1
                    totalFrameCount += 1
                    if (now - fpsWindowStart >= 500) {
                        const fps = fpsFrameCount * 1000 / (now - fpsWindowStart)
                        host.dataset.fps = fps.toFixed(1)
                        host.dataset.frameCount = String(totalFrameCount)
                        if (enableQaReadback) {
                            try {
                                const gl = runtime.renderer.getContext()
                                const readWidth = runtime.renderer.domElement.width
                                const readHeight = runtime.renderer.domElement.height
                                const pixels = new Uint8Array(readWidth * readHeight * 4)
                                let maxAlpha = 0
                                let maxColor = 0
                                let paintedPixels = 0
                                gl.readPixels(0, 0, readWidth, readHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
                                for (let index = 0; index < pixels.length; index += 4) {
                                    const alpha = pixels[index + 3] ?? 0
                                    const color = Math.max(pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0)
                                    if (alpha > 0 || color > 0) paintedPixels += 1
                                    maxAlpha = Math.max(maxAlpha, alpha)
                                    maxColor = Math.max(maxColor, color)
                                }
                                host.dataset.canvasPixel = `${paintedPixels}/${readWidth * readHeight}`
                                host.dataset.canvasMaxAlpha = String(maxAlpha)
                                host.dataset.canvasMaxColor = String(maxColor)
                            } catch {
                                host.dataset.canvasPixel = 'unavailable'
                                host.dataset.canvasMaxAlpha = 'unavailable'
                                host.dataset.canvasMaxColor = 'unavailable'
                            }
                        }
                        fpsFrameCount = 0
                        fpsWindowStart = now
                    }
                    runtime.animationFrame = window.requestAnimationFrame(tick)
                }
                tick()

                window.clearTimeout(loadTimeout)
                setRuntimeReady(true)
            } catch (error) {
                console.error('[FuxieLive3D] Failed to load rigged model', error)
                if (!disposed) {
                    setRuntimeFailed(true)
                    setRuntimeReady(false)
                }
            }
        }

        startRuntime()

        return () => {
            disposed = true
            window.clearTimeout(loadTimeout)
            disposeRuntime(runtimeRef.current)
            runtimeRef.current = null
        }
    }, [prefersReducedMotion, quality, rendererSize.height, rendererSize.width, selectedAssets.model, source, useV10LayeredCanvas])

    return (
        <span
            ref={containerRef}
            className={`fuxie-live-rigged relative inline-flex shrink-0 items-center justify-center overflow-visible ${motionClass} ${className}`}
            style={{ width: resolvedSize, height: resolvedSize }}
            data-asset-key={assetKey}
            data-model-src={selectedAssets.model}
            data-manifest-src={selectedAssets.manifest}
            data-animation-state={state}
            data-quality={quality}
            data-source={source}
            data-runtime={runtimeReady && source === 'rig' ? 'webgl' : useV10LayeredCanvas && imageCanvasReady ? 'layered-canvas' : source === 'imageSet' && imageCanvasReady ? 'image-canvas' : source === 'imageSet' ? 'image-set' : 'fallback'}
        >
            {useCanvasRenderer ? (
                <canvas
                    ref={imageCanvasRef}
                    className={`fuxie-live-image-canvas absolute inset-0 h-full w-full transition-opacity duration-200 ${imageCanvasReady ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                />
            ) : null}
            <span
                className={`fuxie-live-rigged-stage absolute inset-0 transition-opacity duration-300 ${hasLiveRenderer ? 'opacity-0' : 'opacity-100'}`}
                aria-hidden={hasLiveRenderer ? true : undefined}
            >
                {imageFrames.map((frameSrc, index) => (
                    <Image
                        key={`${state}-${frameSrc}-${index}`}
                        src={frameSrc || fallback}
                        alt={index === 0 ? alt : ''}
                        width={resolvedSize}
                        height={resolvedSize}
                        priority={priority}
                        aria-hidden={index === 0 ? undefined : true}
                        onError={(event) => {
                            event.currentTarget.src = fallback
                        }}
                        className={`fuxie-live-rigged-image fuxie-live-3d-frame fuxie-live-3d-frame-${index + 1} absolute inset-0 h-full w-full object-contain ${imageClassName}`}
                    />
                ))}
                <span className="fuxie-live-rigged-spark fuxie-live-rigged-spark-1 absolute rounded-full bg-[#FFD166]" aria-hidden="true" />
                <span className="fuxie-live-rigged-spark fuxie-live-rigged-spark-2 absolute rounded-full bg-[#2EC4B6]" aria-hidden="true" />
            </span>
            <span className="fuxie-live-rigged-shadow absolute bottom-1 left-1/2 h-3 w-3/5 -translate-x-1/2 rounded-full bg-[#3C78A8]/12 blur-sm" aria-hidden="true" />
        </span>
    )
}

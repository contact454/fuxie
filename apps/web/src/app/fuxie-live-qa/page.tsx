import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
    type FuxieLive3DAssetKey,
    type FuxieLive3DState,
} from '@/components/gamification/fuxie-live-3d'
import { FuxieLive3DDynamic } from '@/components/gamification/FuxieLive3DDynamic'
import Image from 'next/image'
import { notFound } from 'next/navigation'

const STATES: FuxieLive3DState[] = ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain']
const RIG_STATES: FuxieLive3DState[] = ['idle', 'wave', 'talk', 'listen', 'reward', 'tryAgain']
const V19_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-motion-balance-rig-v19.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-motion-balance-rig-v19.glb'),
]
const V18_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-motion-polish-rig-v18.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-motion-polish-rig-v18.glb'),
]
const V17_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-contour-source-skinned-rig-v17.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-contour-source-skinned-rig-v17.glb'),
]
const V16_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-unified-source-skinned-rig-v16.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-unified-source-skinned-rig-v16.glb'),
]
const V15_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-source-locked-skinned-rig-v15.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-source-locked-skinned-rig-v15.glb'),
]
const V14_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-identity-deform-rig-v14.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-identity-deform-rig-v14.glb'),
]
const V13_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-deform-rig-v13.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-deform-rig-v13.glb'),
]
const V12_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-volume-rig-v12.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-volume-rig-v12.glb'),
]
const V11_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-true-rig-v11.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-true-rig-v11.glb'),
]
const V8_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-hunyuan-v8.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-hunyuan-v8.glb'),
]
const V9_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-imagegen-modular-v9.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-imagegen-modular-v9.glb'),
]
const V10_PUBLIC_MODEL_CANDIDATES = [
    join(process.cwd(), 'public', 'mascot-3d', 'live', 'fuxie-imagegen-coherent-v10.glb'),
    join(process.cwd(), 'apps', 'web', 'public', 'mascot-3d', 'live', 'fuxie-imagegen-coherent-v10.glb'),
]
const BASELINE_POSTERS: Record<FuxieLive3DAssetKey, string> = {
    v19: '/mascot-3d/live/fuxie-motion-balance-rig-v19-poster.png',
    v18: '/mascot-3d/live/fuxie-motion-polish-rig-v18-poster.png',
    v17: '/mascot-3d/live/fuxie-contour-source-skinned-rig-v17-poster.png',
    v16: '/mascot-3d/live/fuxie-unified-source-skinned-rig-v16-poster.png',
    v15: '/mascot-3d/live/fuxie-source-locked-skinned-rig-v15-poster.png',
    v14: '/mascot-3d/live/fuxie-identity-deform-rig-v14-poster.png',
    v13: '/mascot-3d/live/fuxie-deform-rig-v13-poster.png',
    v12: '/mascot-3d/live/fuxie-volume-rig-v12-poster.png',
    v11: '/mascot-3d/live/fuxie-true-rig-v11-poster.png',
    v10: '/mascot-3d/live/fuxie-imagegen-coherent-v10-poster.png',
    v9: '/mascot-3d/live/fuxie-imagegen-modular-v9-poster.png',
    v8: '/mascot-3d/live/fuxie-hunyuan-v8-poster.png',
    v7b: '/mascot-3d/live/fuxie-true-mesh-v7b-poster.png',
    v6b: '/mascot-3d/live/fuxie-game-rig-v6b-poster.png',
}
const SOURCE_REFERENCES = [
    {
        label: 'source front',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_front_full_body.png',
    },
    {
        label: 'source face',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_front_head_face.png',
    },
    {
        label: 'source eyes',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_front_eyes_brows.png',
    },
    {
        label: 'source hoodie token',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_front_hoodie_bandana_token.png',
    },
    {
        label: 'source hand',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_front_left_hand.png',
    },
    {
        label: 'source tail',
        src: '/mascot-3d/reference-parts/fuxie_ref_part_tail_material.png',
    },
] as const

const MODULAR_SOURCE_PARTS = [
    { label: 'new head face', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_head_face.png' },
    { label: 'new left ear', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_left_ear.png' },
    { label: 'new right ear', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_right_ear.png' },
    { label: 'new body hoodie token', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_body_hoodie_token.png' },
    { label: 'new left arm hand', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_left_arm_hand.png' },
    { label: 'new right arm hand', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_right_arm_hand.png' },
    { label: 'new left leg shoe', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_left_leg_shoe.png' },
    { label: 'new right leg shoe', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_right_leg_shoe.png' },
    { label: 'new tail', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_tail.png' },
    { label: 'new chest token', src: '/mascot-3d/modular-source/v1/fuxie_modular_source_v1_chest_token.png' },
] as const

const IMAGEGEN_PARTS_V2 = [
    { label: 'imagegen head face', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_head_face.png' },
    { label: 'imagegen left ear', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_left_ear.png' },
    { label: 'imagegen right ear', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_right_ear.png' },
    { label: 'imagegen hoodie token', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_body_hoodie_token.png' },
    { label: 'imagegen left arm hand', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_left_arm_hand.png' },
    { label: 'imagegen right arm hand', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_right_arm_hand.png' },
    { label: 'imagegen left leg shoe', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_left_leg_shoe.png' },
    { label: 'imagegen right leg shoe', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_right_leg_shoe.png' },
    { label: 'imagegen tail', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_tail.png' },
    { label: 'imagegen bandana token', src: '/mascot-3d/imagegen-parts/v2/parts/fuxie_imagegen_parts_v2_bandana_token.png' },
] as const

const IMAGEGEN_FULLBODY_V10 = [
    { label: 'v10 coherent source', src: '/mascot-3d/imagegen-fullbody/v10/fuxie_imagegen_fullbody_v10_source.png' },
    { label: 'v10 extracted layers', src: '/mascot-3d/imagegen-fullbody/v10/fuxie_v10_layers_contact_sheet.png' },
] as const

export default function FuxieLiveQaPage() {
    if (process.env.NODE_ENV === 'production') {
        notFound()
    }

    const hasV19Model = V19_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV18Model = V18_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV17Model = V17_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV16Model = V16_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV15Model = V15_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV14Model = V14_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV13Model = V13_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV12Model = V12_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV11Model = V11_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV8Model = V8_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV9Model = V9_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))
    const hasV10Model = V10_PUBLIC_MODEL_CANDIDATES.some((candidate) => existsSync(candidate))

    return (
        <main className="min-h-screen bg-white px-6 py-8">
            <section className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="text-xs font-black uppercase tracking-wide text-[#3C78A8]">Fuxie live QA</p>
                    <h1 className="mt-2 text-2xl font-black text-slate-950">Fuxie identity and animation QA</h1>
                    <p className="mt-2 text-sm font-bold text-slate-500">Source references and V6B are the current visual baseline. Hunyuan V8 is experimental until it matches the source identity.</p>
                </div>
                <div className="mb-8">
                    <h2 className="mb-3 text-base font-black text-[#173B56]">source-of-truth references</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {SOURCE_REFERENCES.map((reference) => (
                            <article key={reference.src} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-[#F0FCFF] p-5 shadow-sm">
                                <Image
                                    src={reference.src}
                                    alt={reference.label}
                                    width={220}
                                    height={220}
                                    className="h-[220px] w-[220px] object-contain"
                                />
                                <p className="mt-3 text-sm font-black text-[#173B56]">{reference.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="mb-3 text-base font-black text-[#173B56]">codex imagegen coherent full-body v10</h2>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {IMAGEGEN_FULLBODY_V10.map((reference) => (
                            <article key={reference.src} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-white p-5 shadow-sm">
                                <Image
                                    src={reference.src}
                                    alt={reference.label}
                                    width={360}
                                    height={260}
                                    loading="eager"
                                    unoptimized
                                    className="h-[260px] w-full object-contain"
                                />
                                <p className="mt-3 text-sm font-black text-[#173B56]">{reference.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
                {hasV19Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v19 motion balance rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v19-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="performance" size={220} assetKey="v19" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v19 motion balance rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV18Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v18 motion polish rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v18-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v18" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v18 motion polish rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV17Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v17 contour source skinned rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v17-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v17" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v17 contour source skinned rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV16Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v16 unified source skinned rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v16-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v16" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v16 unified source skinned rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV15Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v15 source-locked skinned rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v15-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v15" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v15 source-locked skinned rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV14Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v14 identity deform skeletal rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v14-${state}`} className="grid place-items-center rounded-2xl border border-[#84DCCF] bg-[#F2FFFC] p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v14" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v14 identity deform rig {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                {hasV10Model ? (
                    <div className="mb-8">
                        <h2 className="mb-3 text-base font-black text-[#173B56]">v10 imagegen coherent rig candidate</h2>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {RIG_STATES.map((state) => (
                                <article key={`v10-${state}`} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-white p-5 shadow-sm">
                                    <FuxieLive3DDynamic state={state} source="rig" quality="static" size={220} assetKey="v10" priority />
                                    <p className="mt-3 text-sm font-black text-[#173B56]">v10 imagegen coherent {state}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : null}
                <div className="mb-8">
                    <h2 className="mb-3 text-base font-black text-[#173B56]">codex imagegen modular source v2, generated parts</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        {IMAGEGEN_PARTS_V2.map((part) => (
                            <article key={part.src} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-white p-4 shadow-sm">
                                <Image
                                    src={part.src}
                                    alt={part.label}
                                    width={180}
                                    height={180}
                                    loading="eager"
                                    unoptimized
                                    className="h-[180px] w-[180px] object-contain"
                                />
                                <p className="mt-3 text-center text-xs font-black text-[#173B56]">{part.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="mb-3 text-base font-black text-[#173B56]">rendered modular source v1, not crops</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        {MODULAR_SOURCE_PARTS.map((part) => (
                            <article key={part.src} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-white p-4 shadow-sm">
                                <Image
                                    src={part.src}
                                    alt={part.label}
                                    width={180}
                                    height={180}
                                    loading="eager"
                                    unoptimized
                                    className="h-[180px] w-[180px] object-contain"
                                />
                                <p className="mt-3 text-center text-xs font-black text-[#173B56]">{part.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="mb-3 text-base font-black text-[#173B56]">identity poster comparison</h2>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            { assetKey: 'v6b' as const, label: 'v6b approved baseline' },
                            ...(hasV19Model ? [{ assetKey: 'v19' as const, label: 'v19 motion balance rig' }] : []),
                            ...(hasV18Model ? [{ assetKey: 'v18' as const, label: 'v18 motion polish rig' }] : []),
                            ...(hasV17Model ? [{ assetKey: 'v17' as const, label: 'v17 contour source skinned rig' }] : []),
                            ...(hasV16Model ? [{ assetKey: 'v16' as const, label: 'v16 unified source skinned rig' }] : []),
                            ...(hasV15Model ? [{ assetKey: 'v15' as const, label: 'v15 source-locked skinned rig' }] : []),
                            ...(hasV14Model ? [{ assetKey: 'v14' as const, label: 'v14 identity deform rig' }] : []),
                            ...(hasV13Model ? [{ assetKey: 'v13' as const, label: 'v13 true deform rig' }] : []),
                            ...(hasV12Model ? [{ assetKey: 'v12' as const, label: 'v12 volume rig candidate' }] : []),
                            ...(hasV11Model ? [{ assetKey: 'v11' as const, label: 'v11 true skeletal GLB rig' }] : []),
                            ...(hasV10Model ? [{ assetKey: 'v10' as const, label: 'v10 imagegen coherent' }] : []),
                            ...(hasV9Model ? [{ assetKey: 'v9' as const, label: 'v9 imagegen modular' }] : []),
                            ...(hasV8Model ? [{ assetKey: 'v8' as const, label: 'v8 hunyuan experimental' }] : []),
                        ].map((variant) => (
                            <article key={`baseline-${variant.assetKey}`} className="grid place-items-center rounded-2xl border border-[#BFE8F4] bg-[#F0FCFF] p-5 shadow-sm">
                                <Image
                                    src={BASELINE_POSTERS[variant.assetKey]}
                                    alt={`${variant.label} poster`}
                                    width={220}
                                    height={220}
                                    className="h-[220px] w-[220px] object-contain"
                                />
                                <p className="mt-3 text-sm font-black text-[#173B56]">{variant.label}</p>
                            </article>
                        ))}
                    </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {STATES.map((state) => (
                        <article key={state} className="grid place-items-center rounded-2xl border border-slate-100 bg-[#F3FBFF] p-5 shadow-sm">
                            <FuxieLive3DDynamic state={state} size={180} quality="static" priority />
                            <p className="mt-3 text-sm font-black text-[#173B56]">{state}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    )
}

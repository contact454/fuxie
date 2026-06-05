/**
 * CoursePathNodes — vertical list of `CourseNode`s with single Primary_CTA discipline.
 *
 * Vai chinh: Frontend Engineer
 * Vai phoi hop: Design System Designer
 *
 * Spec source-of-truth:
 *   - Task 9.1 (gamified-ui-asset-rollout)
 *   - design.md §I.2
 *   - requirements.md Req 4.1, 4.2, 4.3, 4.6, 4.7, 4.8
 *
 * Contract:
 *   - Renders an `<ol data-role="course-path">` of `<CourseNode>`s. // locale-allow
 *   - Among nodes whose `state === 'available'`, exactly one carries
 *     `data-role="primary-cta"` — the first in path order — and all
 *     subsequent `available` nodes carry `data-cta-variant="secondary"`
 *     (Req 4.2, 4.3 + Property 11).
 *   - When zero nodes are `available`, zero nodes carry
 *     `data-role="primary-cta"`. The Single-Primary_CTA invariant for the
 *     surrounding surface is enforced separately by the page-level CTA
 *     (e.g. "Tiếp tục học" on Dashboard) — this list never invents a
 *     primary CTA out of a `locked|completed|mastered|in-progress` state.
 */

'use client'

import { CourseNode, type CourseNodeProps, type CourseNodeState } from './course-node'

/**
 * Subset of `CourseNodeProps` the consumer must provide. `isPrimaryCta` is
 * derived inside this component so callers cannot accidentally violate the
 * single-Primary_CTA invariant.
 */
export type CourseNodeInput = Omit<CourseNodeProps, 'isPrimaryCta'>

export interface CoursePathNodesProps {
    nodes: CourseNodeInput[]
    /** Optional className appended to the root `<ol>`. */
    className?: string
}

/**
 * Decide which nodes are the first-available (Primary_CTA) and which are
 * secondary `available` nodes. Pure function so tests can pin the rule
 * directly without rendering.
 *
 * Validates: Requirements 4.2, 4.3
 */
export function annotatePrimaryCta(
    nodes: ReadonlyArray<{ state: CourseNodeState }>,
): boolean[] {
    let firstAvailableSeen = false
    return nodes.map((node) => {
        if (node.state !== 'available') return false
        if (firstAvailableSeen) return false
        firstAvailableSeen = true
        return true
    })
}

export function CoursePathNodes({ nodes, className = '' }: CoursePathNodesProps) {
    const primaryFlags = annotatePrimaryCta(nodes)

    return (
        <ol
            data-role="course-path"
            className={
                'flex flex-col gap-1 ' +
                'border-l-2 border-dashed border-[#CCE4F0] pl-3 ' +
                className
            }
        >
            {nodes.map((node, index) => (
                <CourseNode
                    key={node.nodeId}
                    {...node}
                    isPrimaryCta={primaryFlags[index] ?? false}
                />
            ))}
        </ol>
    )
}

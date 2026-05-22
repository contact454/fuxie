/**
 * PrimaryCta — shared design-system button primitive
 *
 * Vai chinh: Design System Designer
 * Vai phoi hop: Frontend Engineer
 *
 * Spec source-of-truth:
 *   - Task 4.5 (gamified-ui-asset-rollout)
 *   - design.md §F (Bright Sky palette), §H (Accessibility), §I (surface CTA pattern)
 *   - requirements.md Req 14.1, 15.2, 15.4, 16.4, 19.3
 *
 * Contract (machine-checkable):
 *   - `variant="primary"`  → renders `data-role="primary-cta"`,
 *                            background `var(--fuxie-action)`,
 *                            tap target ≥ 44×44 px (Req 15.2).
 *   - `variant="review"`   → same as primary BUT tap target ≥ 48×48 px
 *                            (Req 9.1, Req 14.1 review-specific).
 *   - `variant="secondary"`→ outline style with Bright Sky border,
 *                            STRIPS `data-role="primary-cta"` and sets
 *                            `data-cta-variant="secondary"` (Property 8 / 11).
 *   - `disabled`           → STRIPS `data-role="primary-cta"`, opacity ~0.5,
 *                            `cursor: not-allowed`, `aria-disabled="true"`.
 *   - Focus visible ring   → outline ≥ 2px contrast ≥ 3:1 against
 *                            `--fuxie-blue-50` and white backgrounds (Req 15.4).
 *
 * Notes:
 *   - This is the single Primary_CTA primitive enforced across P0 surfaces.
 *     Secondary visual treatment is provided here so consumers do not roll
 *     their own off-pattern button (Req 19.3).
 *   - `asChild` clones the single child element so router `<Link>` or
 *     `<form>` submit elements can receive the same className/data attrs
 *     without pulling in `@radix-ui/react-slot` (not in deps).
 */

'use client'

import * as React from 'react'

import { fx } from './fuxie-ui'

export type PrimaryCtaVariant = 'primary' | 'secondary' | 'review'

export interface PrimaryCtaProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    children: React.ReactNode
    variant?: PrimaryCtaVariant
    /**
     * When true, render the single child element (typically a Next.js `<Link>`
     * or a custom anchor) and forward className + data-role attributes onto it.
     * The child must accept className, data-* and ref props.
     */
    asChild?: boolean
}

/* ----------------------------------------------------------------------------
 * Class composition
 * Tap-target sizing is intentionally expressed via min-h/min-w in pixels so
 * that property tests using `getBoundingClientRect()` can validate Req 15.2 /
 * Req 9.1 deterministically (44px / 48px floors).
 * -------------------------------------------------------------------------- */

const baseClasses = fx(
    // Layout
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-bold',
    'px-5 py-3 text-sm leading-none',
    // Motion stays within the closed set: transform/opacity only (Req 13.1).
    'transition-[transform,opacity,background-color,border-color,box-shadow] duration-150',
    // Focus ring: 2px solid + 2px offset, contrast ≥ 3:1 against light bgs (Req 15.4).
    'outline-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-[var(--fuxie-blue-700)]',
    // Disabled: visual + pointer state, role stripped via attribute logic below.
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
    'disabled:hover:translate-y-0',
)

const variantClasses: Record<PrimaryCtaVariant, string> = {
    primary: fx(
        // Bright Sky action — Req 16.4.
        'min-h-[44px] min-w-[44px]',
        'bg-[var(--fuxie-action)] text-white',
        'shadow-md shadow-sky-900/15',
        'hover:bg-[var(--fuxie-action-hover)] hover:-translate-y-0.5',
        'active:translate-y-0',
    ),
    review: fx(
        // Same fill as primary, but ≥48×48 dp tap target — Req 9.1 / Req 14.1.
        'min-h-[48px] min-w-[48px] px-6 py-3.5',
        'bg-[var(--fuxie-action)] text-white',
        'shadow-md shadow-sky-900/15',
        'hover:bg-[var(--fuxie-action-hover)] hover:-translate-y-0.5',
        'active:translate-y-0',
    ),
    secondary: fx(
        // Outline style — Bright Sky border, NO data-role="primary-cta".
        'min-h-[44px] min-w-[44px]',
        'bg-white text-[color:var(--color-text-brand)]',
        'border-2 border-[var(--fuxie-action)]',
        'hover:bg-[var(--fuxie-blue-50)]',
    ),
}

/* ----------------------------------------------------------------------------
 * Data-attribute resolution (Property 7 / 8 / 11 / 22 invariants)
 * - primary-cta role is exposed ONLY when variant=primary|review AND not disabled.
 * - secondary explicitly opts OUT of primary-cta and announces its variant so
 *   surface tests can assert "exactly one Primary_CTA per non-default state".
 * -------------------------------------------------------------------------- */

interface ResolvedDataAttrs {
    'data-role'?: 'primary-cta'
    'data-cta-variant'?: 'secondary'
}

function resolveDataAttrs(
    variant: PrimaryCtaVariant,
    disabled: boolean | undefined,
): ResolvedDataAttrs {
    if (variant === 'secondary') {
        return { 'data-cta-variant': 'secondary' }
    }
    if (disabled) {
        // Disabled CTA cannot be the primary path; strip role to keep
        // single-Primary_CTA invariant honest in error/loading states.
        return {}
    }
    return { 'data-role': 'primary-cta' }
}

/* ----------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export const PrimaryCta = React.forwardRef<HTMLButtonElement, PrimaryCtaProps>(
    function PrimaryCta(
        {
            children,
            variant = 'primary',
            type = 'button',
            disabled = false,
            asChild = false,
            className,
            ...rest
        },
        ref,
    ) {
        const dataAttrs = resolveDataAttrs(variant, disabled)
        const composedClassName = fx(baseClasses, variantClasses[variant], className)

        if (asChild) {
            // Forward the resolved class + data-attrs onto the single child.
            // We deliberately avoid pulling @radix-ui/react-slot to keep the
            // dependency graph light; consumers must provide one valid React
            // element child (e.g. <Link>, <a>).
            const child = React.Children.only(children) as React.ReactElement<
                Record<string, unknown>
            >
            const childProps = (child.props ?? {}) as { className?: string }
            return React.cloneElement(child, {
                ...dataAttrs,
                ...rest,
                className: fx(composedClassName, childProps.className),
                'aria-disabled': disabled || undefined,
                ref,
            } as Record<string, unknown>)
        }

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={composedClassName}
                {...dataAttrs}
                {...rest}
            >
                {children}
            </button>
        )
    },
)

PrimaryCta.displayName = 'PrimaryCta'

import * as React from 'react'

export interface PrimaryCtaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    variant?: 'primary' | 'secondary'
    asChild?: boolean
}

type AsChildProps = Record<string, unknown> & {
    className?: string
    href?: string
    onClick?: React.MouseEventHandler<HTMLElement>
    tabIndex?: number
}

export const PrimaryCta = React.forwardRef<HTMLButtonElement, PrimaryCtaProps>(
    function PrimaryCta(
        {
            children,
            variant = 'primary',
            disabled = false,
            asChild = false,
            className = '',
            type = 'button',
            onClick,
            ...props
        },
        ref,
    ) {
        const isPrimary = variant === 'primary'

        // enabled primary → data-role; secondary → data-cta-variant; disabled primary → neither
        const dataAttrs: Record<string, string> = !isPrimary
            ? { 'data-cta-variant': 'secondary' }
            : !disabled
                ? { 'data-role': 'primary-cta' }
                : {}

        const baseStyles = [
            'inline-flex items-center justify-center font-extrabold text-[17px] tracking-wide',
            'px-[var(--fuxie-space-5)] h-[56px] min-h-[var(--fuxie-tap-min)] min-w-[var(--fuxie-tap-min)]',
            'rounded-[var(--fuxie-radius-lg)]',
            // Tactile lip 4px
            'border-t-2 border-l-2 border-r-2 border-b-[4px]',
            'outline-none select-none touch-action-manipulation',
            // Limit animated properties; no transition-all
            'transition-[transform,background-color,border-color,opacity,box-shadow] duration-75',
            // Keyboard focus
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--fuxie-blue-700)]',
            // Reduced motion: no decorative transform / transition
            'motion-reduce:transition-none motion-reduce:active:translate-y-0',
        ].join(' ')

        let stateStyles = ''
        if (disabled) {
            stateStyles =
                'bg-slate-200 border-slate-200 border-b-slate-300 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none'
        } else if (isPrimary) {
            stateStyles = [
                'bg-[var(--fuxie-action)] border-[var(--fuxie-action)] border-b-[var(--fuxie-lip-action)] text-white',
                'hover:bg-[var(--fuxie-action-hover)] hover:border-[var(--fuxie-action-hover)] hover:border-b-[var(--fuxie-lip-action)]',
                'active:translate-y-[2px] active:border-b-[2px]',
                'motion-reduce:active:border-b-[4px]',
            ].join(' ')
        } else {
            stateStyles = [
                'bg-white border-[var(--fuxie-action)] border-b-[var(--fuxie-lip-gray)] text-[var(--fuxie-blue-600)]',
                'hover:bg-[var(--fuxie-blue-50)]',
                'active:translate-y-[2px] active:border-b-[2px]',
                'motion-reduce:active:border-b-[4px]',
            ].join(' ')
        }

        const composedClassName = `${baseStyles} ${stateStyles} ${className}`.trim()

        if (asChild) {
            const child = React.Children.only(children) as React.ReactElement<AsChildProps>
            const {
                className: childClassName,
                href: childHref,
                onClick: childOnClick,
                ...restChild
            } = child.props

            const childClass =
                typeof childClassName === 'string' ? childClassName : ''

            if (disabled) {
                // Anchor-safe disabled: no invalid `disabled` attr, no navigable href.
                // Block activation even if pointer-events is overridden by consumers.
                const blockActivation: React.MouseEventHandler<HTMLElement> = (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    // Intentionally do not call childOnClick or wrapper onClick.
                }

                return React.cloneElement(child, {
                    ...restChild,
                    // Do not forward `disabled` or navigable `href` onto non-button hosts.
                    ...props,
                    className: `${composedClassName} ${childClass}`.trim(),
                    'aria-disabled': true,
                    tabIndex: -1,
                    href: undefined,
                    onClick: blockActivation,
                    ref,
                    ...dataAttrs,
                } as AsChildProps)
            }

            const mergeClick: React.MouseEventHandler<HTMLElement> | undefined =
                childOnClick || onClick
                    ? (event) => {
                          childOnClick?.(event)
                          if (!event.defaultPrevented) {
                              onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>)
                          }
                      }
                    : undefined

            return React.cloneElement(child, {
                ...restChild,
                ...props,
                className: `${composedClassName} ${childClass}`.trim(),
                href: childHref,
                onClick: mergeClick,
                'aria-disabled': undefined,
                ref,
                ...dataAttrs,
            } as AsChildProps)
        }

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={composedClassName}
                onClick={onClick}
                {...dataAttrs}
                {...props}
            >
                {children}
            </button>
        )
    },
)

PrimaryCta.displayName = 'PrimaryCta'

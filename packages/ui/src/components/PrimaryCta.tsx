import * as React from 'react'

export interface PrimaryCtaProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    variant?: 'primary' | 'secondary'
    asChild?: boolean
}

export const PrimaryCta = React.forwardRef<HTMLButtonElement, PrimaryCtaProps>(
    function PrimaryCta({ children, variant = 'primary', disabled = false, asChild = false, className = '', type = 'button', ...props }, ref) {
        const isPrimary = variant === 'primary'

        // enabled primary → data-role; secondary → data-cta-variant; disabled primary → neither
        const dataAttrs: Record<string, string> = !isPrimary
            ? { 'data-cta-variant': 'secondary' }
            : !disabled
                ? { 'data-role': 'primary-cta' }
                : {}

        const baseStyles = 'inline-flex items-center justify-center font-extrabold text-[17px] tracking-wide px-[var(--fuxie-space-5)] h-[56px] min-h-[var(--fuxie-tap-min)] rounded-[var(--fuxie-radius-lg)] border-t-2 border-l-2 border-r-2 border-b-[4px] outline-none transition-all duration-75 select-none touch-action-manipulation'

        let stateStyles = ''
        if (disabled) {
            stateStyles = 'bg-slate-200 border-slate-200 border-b-slate-300 text-slate-400 opacity-60 cursor-not-allowed'
        } else if (isPrimary) {
            stateStyles = 'bg-[var(--fuxie-action)] border-[var(--fuxie-action)] border-b-[var(--fuxie-lip-action)] text-white hover:bg-[var(--fuxie-action-hover)] hover:border-[var(--fuxie-action-hover)] hover:border-b-[var(--fuxie-lip-action)] active:translate-y-[2px] active:border-b-[2px]'
        } else {
            stateStyles = 'bg-white border-[var(--fuxie-action)] border-b-[var(--fuxie-lip-gray)] text-[var(--fuxie-blue-600)] hover:bg-[var(--fuxie-blue-50)] active:translate-y-[2px] active:border-b-[2px]'
        }

        const composedClassName = `${baseStyles} ${stateStyles} ${className}`.trim()

        if (asChild) {
            const child = React.Children.only(children) as React.ReactElement<any>
            return React.cloneElement(child, {
                ...dataAttrs,
                ...props,
                className: `${composedClassName} ${child.props.className ?? ''}`.trim(),
                'aria-disabled': disabled || undefined,
                ref,
            })
        }

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={composedClassName}
                {...dataAttrs}
                {...props}
            >
                {children}
            </button>
        )
    }
)

PrimaryCta.displayName = 'PrimaryCta'

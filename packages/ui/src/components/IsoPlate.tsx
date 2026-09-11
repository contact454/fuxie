import * as React from 'react'

export interface IsoPlateProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string
    alt: string
    width?: number | string
    height?: number | string
    imgClassName?: string
    bleed?: boolean
}

export function IsoPlate({ src, alt, width, height, className = '', imgClassName = '', bleed = false, ...props }: IsoPlateProps) {
    const containerClasses = bleed
        ? `relative overflow-hidden inline-flex items-center justify-center w-full h-full ${className}`.trim()
        : `relative overflow-hidden bg-[var(--fuxie-blue-50)] rounded-[var(--fuxie-radius-lg)] shadow-[var(--fuxie-shadow-iso)] border border-[var(--fuxie-blue-200)] inline-flex items-center justify-center p-[var(--fuxie-space-3)] ${className}`.trim()

    const imgClasses = bleed
        ? `w-full h-full object-cover select-none pointer-events-none ${imgClassName}`.trim()
        : `max-w-full h-auto object-contain select-none pointer-events-none ${imgClassName}`.trim()

    return (
        <div
            className={containerClasses}
            {...props}
        >
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                className={imgClasses}
            />
        </div>
    )
}

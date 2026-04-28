import { MeasuredLink } from '@/components/performance/measured-link'

// ─── Quick Action Link ──────────────────────────────
interface QuickActionProps {
    href: string
    icon: string
    label: string
    sublabel: string
    color: string
    badge?: number
}

export function QuickAction({ href, icon, label, sublabel, color, badge }: QuickActionProps) {
    return (
        <MeasuredLink
            href={href}
            flow="dashboard.quick_action"
            source={label}
            className="card-hover group relative flex items-center gap-3 rounded-xl p-3 transition-all"
            style={{
                background: `linear-gradient(135deg, ${color}08, ${color}04)`,
            }}
        >
            <span
                className="flex h-9 w-9 items-center justify-center rounded-lg text-base text-white transition-transform group-hover:scale-110"
                style={{ backgroundColor: color }}
            >
                {icon}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400">{sublabel}</p>
            </div>
            {badge !== undefined && badge > 0 && (
                <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: color }}
                >
                    {badge}
                </span>
            )}
            <svg
                className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
        </MeasuredLink>
    )
}

import { useState, type ReactNode } from 'react'

const DEPTH_STYLES = [
  { container: 'bg-white border border-gray-200',          label: 'text-gray-400',    arrow: 'text-gray-400' },
  { container: 'bg-blue-50/50 border border-gray-200',     label: 'text-blue-500',    arrow: 'text-blue-400' },
  { container: 'bg-violet-50/50 border border-gray-200',   label: 'text-violet-500',  arrow: 'text-violet-400' },
  { container: 'bg-emerald-50/50 border border-gray-200',  label: 'text-emerald-600', arrow: 'text-emerald-500' },
  { container: 'bg-amber-50/50 border border-gray-200',    label: 'text-amber-600',   arrow: 'text-amber-500' },
  { container: 'bg-rose-50/50 border border-gray-200',     label: 'text-rose-500',    arrow: 'text-rose-400' },
  { container: 'bg-cyan-50/50 border border-gray-200',     label: 'text-cyan-600',    arrow: 'text-cyan-500' },
  { container: 'bg-lime-50/50 border border-gray-200',     label: 'text-lime-600',    arrow: 'text-lime-500' },
  { container: 'bg-fuchsia-50/50 border border-gray-200',  label: 'text-fuchsia-500', arrow: 'text-fuchsia-400' },
  { container: 'bg-sky-50/50 border border-gray-200',      label: 'text-sky-600',     arrow: 'text-sky-500' },
  { container: 'bg-orange-50/50 border border-gray-200',   label: 'text-orange-600',  arrow: 'text-orange-500' },
  { container: 'bg-teal-50/50 border border-gray-200',     label: 'text-teal-600',    arrow: 'text-teal-500' },
]

interface FieldGroupProps {
  title: string
  children: ReactNode
  wrap?: boolean
  fullWidth?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  depth?: number
}

export default function FieldGroup({
  title,
  children,
  wrap,
  fullWidth,
  collapsible,
  defaultOpen = false,
  depth = 0,
}: FieldGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = !collapsible || open
  const style = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-fit'} ${style.container} rounded-lg p-3 ${collapsible && !isOpen ? 'cursor-pointer select-none' : ''}`}
      onClick={collapsible && !isOpen ? () => setOpen(true) : undefined}
    >
      <div
        className={`flex items-center justify-between ${collapsible ? 'cursor-pointer select-none' : ''} ${isOpen ? 'mb-3' : ''}`}
        onClick={collapsible ? (e) => { e.stopPropagation(); setOpen((o) => !o) } : undefined}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${style.label}`}>
          {title}
        </p>
        {collapsible && (
          <svg
            className={`w-3 h-3 transition-transform shrink-0 ${style.arrow} ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      {isOpen && (
        <div className={wrap ? 'grid grid-cols-4 gap-2.5' : 'flex flex-col gap-2.5'}>
          {children}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'

export default function FieldGroup({ title, children, wrap, fullWidth, collapsible }) {
  const [open, setOpen] = useState(false)

  const isOpen = !collapsible || open

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-fit'} border border-gray-200 rounded-lg p-3 ${collapsible && !isOpen ? 'cursor-pointer select-none' : ''}`}
      onClick={collapsible && !isOpen ? () => setOpen(true) : undefined}
    >
      <div
        className={`flex items-center justify-between ${collapsible ? 'cursor-pointer select-none' : ''} ${isOpen ? 'mb-3' : ''}`}
        onClick={collapsible ? (e) => { e.stopPropagation(); setOpen((o) => !o) } : undefined}
      >
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </p>
        {collapsible && (
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
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

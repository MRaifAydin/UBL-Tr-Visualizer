import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useDocument } from '../context/DocumentContext'
import { findNodeById } from '../core/treeManager'
import CheckIcon from './CheckIcon'

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
  headerExtra?: ReactNode
  validationFieldIds?: string[]
}

export default function FieldGroup({
  title,
  children,
  wrap,
  fullWidth,
  collapsible,
  defaultOpen = false,
  depth = 0,
  headerExtra,
  validationFieldIds,
}: FieldGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const { tree, validationErrors, loadedFieldIds } = useDocument()

  const errorCount = useMemo(() => {
    if (!validationFieldIds || validationFieldIds.length === 0) return 0
    const idSet = new Set(validationFieldIds)
    return validationErrors.reduce((n, e) => (idSet.has(e.fieldId) ? n + 1 : n), 0)
  }, [validationErrors, validationFieldIds])

  const loadedCount = useMemo(() => {
    if (!validationFieldIds || validationFieldIds.length === 0) return 0
    let n = 0
    for (const id of validationFieldIds) {
      if (!loadedFieldIds.has(id)) continue
      if ((findNodeById(tree, id)?.value ?? '') !== '') n += 1
    }
    return n
  }, [validationFieldIds, loadedFieldIds, tree])

  // Hata sayısı arttığında (yeni validation veya yeni eksik) grubu otomatik aç.
  // Kullanıcı sonra manuel kapatabilir; aynı sayıda tekrar açma yapılmaz.
  const prevErrorCount = useRef(0)
  useEffect(() => {
    if (errorCount > prevErrorCount.current && collapsible) {
      setOpen(true)
    }
    prevErrorCount.current = errorCount
  }, [errorCount, collapsible])

  const isOpen = !collapsible || open
  const style = DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]
  const hasError = errorCount > 0

  return (
    <div
      className={`${fullWidth ? 'w-full' : 'w-fit'} ${style.container} rounded-lg p-3 ${collapsible && !isOpen ? 'cursor-pointer select-none' : ''} ${hasError ? 'ring-1 ring-red-300' : ''}`}
      onClick={collapsible && !isOpen ? () => setOpen(true) : undefined}
    >
      <div
        className={`flex items-center justify-between ${collapsible ? 'cursor-pointer select-none' : ''} ${isOpen ? 'mb-3' : ''}`}
        onClick={collapsible ? (e) => { e.stopPropagation(); setOpen((o) => !o) } : undefined}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${hasError ? 'text-red-600' : style.label}`}>
          <span>{title}</span>
          {hasError && (
            <span className="px-1.5 py-px rounded bg-red-100 text-red-700 border border-red-200 text-[9px] font-bold normal-case tracking-normal">
              {errorCount} eksik
            </span>
          )}
          {loadedCount > 0 && (
            <span className="px-1.5 py-px rounded bg-blue-100 text-blue-700 border border-blue-200 text-[9px] font-bold normal-case tracking-normal flex items-center gap-0.5">
              <CheckIcon className="w-2.5 h-2.5" />
              {loadedCount} XML
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {headerExtra && (
            <div onClick={(e) => e.stopPropagation()}>{headerExtra}</div>
          )}
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
      </div>
      {isOpen && (
        <div className={wrap ? 'grid grid-cols-4 gap-2.5' : 'flex flex-col gap-2.5'}>
          {children}
        </div>
      )}
    </div>
  )
}

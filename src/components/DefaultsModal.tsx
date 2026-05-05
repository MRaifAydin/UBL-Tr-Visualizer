import { useEffect, useRef, useState } from 'react'
import type { FillScenario } from '../modules/invoice/defaults'

interface DefaultsModalProps {
  open: boolean
  scenario: FillScenario | null
  availableGroupTitles: string[]
  onCancel: () => void
  onConfirm: (selectedTitles: string[], overwrite: boolean) => void
}

export default function DefaultsModal({
  open,
  scenario,
  availableGroupTitles,
  onCancel,
  onConfirm,
}: DefaultsModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [overwrite, setOverwrite] = useState(false)
  const allCheckboxRef = useRef<HTMLInputElement | null>(null)

  // Modal her açıldığında: tüm gruplar seçili, overwrite kapalı.
  useEffect(() => {
    if (open) {
      setSelected(new Set(availableGroupTitles))
      setOverwrite(false)
    }
  }, [open, availableGroupTitles])

  // ESC ile kapat.
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  // "Tümünü Seç" indeterminate state'i.
  useEffect(() => {
    if (!allCheckboxRef.current) return
    const total = availableGroupTitles.length
    const count = selected.size
    allCheckboxRef.current.indeterminate = count > 0 && count < total
  }, [selected, availableGroupTitles])

  if (!open || !scenario) return null

  const allChecked =
    selected.size === availableGroupTitles.length && availableGroupTitles.length > 0

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(availableGroupTitles))
    }
  }

  function toggleOne(title: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  function handleConfirm() {
    onConfirm(Array.from(selected), overwrite)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">{scenario.label}</h2>
          <button
            type="button"
            onClick={onCancel}
            title="Kapat"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <label className="flex items-center gap-2 px-5 py-3 cursor-pointer hover:bg-gray-50 border-r border-gray-200">
              <input
                ref={allCheckboxRef}
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Tümünü Seç ({selected.size}/{availableGroupTitles.length})
              </span>
            </label>
            <label className="flex items-center gap-2 px-5 py-3 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">Mevcut değerlerin üzerine yaz</span>
            </label>
          </div>

          <ul>
            {availableGroupTitles.map((title) => (
              <li key={title}>
                <label className="flex items-center gap-2 px-5 py-2 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selected.has(title)}
                    onChange={() => toggleOne(title)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-blue-600 text-white hover:bg-blue-700
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
  )
}

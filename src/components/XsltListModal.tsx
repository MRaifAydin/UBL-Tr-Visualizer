import { useEffect } from 'react'
import type { XsltEntry } from '../core/historyDb'

export type SelectedXslt = { kind: 'default' } | { kind: 'custom'; id: number }

interface XsltListModalProps {
  open: boolean
  hasDefault: boolean
  customXslts: XsltEntry[]
  selectedXslt: SelectedXslt
  onSelect: (sel: SelectedXslt) => void
  onDelete: (id: number, name: string) => void
  onClose: () => void
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function XsltListModal({
  open,
  hasDefault,
  customXslts,
  selectedXslt,
  onSelect,
  onDelete,
  onClose,
}: XsltListModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const isDefaultSelected = selectedXslt.kind === 'default'

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">XSLT Listesi</h2>
          <button
            type="button"
            onClick={onClose}
            title="Kapat"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-1.5">
              Varsayılan
            </p>
            <button
              type="button"
              onClick={() => hasDefault && onSelect({ kind: 'default' })}
              disabled={!hasDefault}
              className={`w-full text-left border rounded-lg p-3 transition-colors flex items-center gap-3 ${
                isDefaultSelected
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:bg-blue-50 hover:border-blue-300'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isDefaultSelected ? 'border-blue-600' : 'border-gray-300'
                }`}
              >
                {isDefaultSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800">Default XSLT</span>
                <span className="block mt-0.5 text-xs text-gray-500">
                  {hasDefault
                    ? 'Projeyle birlikte gelen statik şablon'
                    : 'Bu modül için tanımlı değil'}
                </span>
              </span>
            </button>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-1.5">
              Kayıtlı Özel XSLT'ler
            </p>
            {customXslts.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-lg">
                Henüz kayıtlı özel XSLT yok.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {customXslts.map((entry) => {
                  const isSelected =
                    selectedXslt.kind === 'custom' && selectedXslt.id === entry.id
                  return (
                    <div
                      key={entry.id}
                      className={`border rounded-lg flex items-stretch overflow-hidden transition-colors ${
                        isSelected
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => entry.id !== undefined && onSelect({ kind: 'custom', id: entry.id })}
                        className="flex-1 min-w-0 text-left p-3 flex items-center gap-3"
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-gray-800 truncate">
                            {entry.name}
                          </span>
                          <span className="block mt-0.5 text-xs text-gray-500">
                            {formatDate(entry.createdAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (entry.id !== undefined) onDelete(entry.id, entry.name)
                        }}
                        title="Sil"
                        className="px-3 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border-l border-gray-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}

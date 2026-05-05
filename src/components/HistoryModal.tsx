import { useEffect, useState } from 'react'
import {
  deleteHistoryEntry,
  listHistory,
  type HistoryEntry,
} from '../core/historyDb'

interface HistoryModalProps {
  open: boolean
  docType: string
  onCancel: () => void
  onOpen: (entry: HistoryEntry) => void
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function HistoryModal({
  open,
  docType,
  onCancel,
  onOpen,
}: HistoryModalProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    listHistory(docType)
      .then((rows) => {
        if (!cancelled) setEntries(rows)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, docType])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  async function handleDelete(entry: HistoryEntry) {
    if (entry.id === undefined) return
    const ok = window.confirm(`"${entry.name}" silinsin mi?`)
    if (!ok) return
    await deleteHistoryEntry(entry.id)
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">
            Geçmiş
            {entries.length > 0 && (
              <span className="ml-2 font-normal text-gray-400">
                ({entries.length})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            title="Kapat"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
          {loading ? (
            <p className="text-xs text-gray-500 text-center py-8">Yükleniyor…</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">
              Henüz belge kaydetmediniz.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block text-sm font-medium text-gray-800 truncate">
                    {entry.name}
                  </span>
                  <span className="block mt-0.5 text-[11px] text-gray-500">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpen(entry)}
                    className="px-2.5 py-1 rounded text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Aç
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry)}
                    title="Sil"
                    className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

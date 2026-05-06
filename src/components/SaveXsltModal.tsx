import { useEffect, useRef, useState } from 'react'

interface SaveXsltModalProps {
  open: boolean
  defaultName: string
  existingNames: Set<string>
  remainingCount: number
  onSkip: () => void
  onConfirm: (name: string) => void
}

/**
 * Yüklenen XML içinde gömülü XSLT bulunduğunda IndexedDB'ye kaydetmek için
 * isim alır. Kuyrukta birden çok XSLT varsa `remainingCount` bilgisi gösterilir.
 */
export default function SaveXsltModal({
  open,
  defaultName,
  existingNames,
  remainingCount,
  onSkip,
  onConfirm,
}: SaveXsltModalProps) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [open, defaultName])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onSkip])

  if (!open) return null

  const trimmed = name.trim()
  const isEmpty = trimmed.length === 0
  const isDuplicate = !isEmpty && existingNames.has(trimmed)
  const canSave = !isEmpty && !isDuplicate

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canSave) onConfirm(trimmed)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[55] flex items-center justify-center p-4"
      onMouseDown={onSkip}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">Gömülü XSLT Bulundu</h2>
          <button
            type="button"
            onClick={onSkip}
            title="Atla"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-2">
          <p className="text-xs text-gray-600">
            Yüklenen XML içinde gömülü bir XSLT bulundu. Kayıtlı özel XSLT'lerinize eklemek
            ister misiniz?
          </p>
          {remainingCount > 1 && (
            <p className="text-xs text-amber-700">
              Bu XML'de toplam {remainingCount} XSLT bulundu; sırayla sorulacak.
            </p>
          )}
          <label htmlFor="xslt-name" className="mt-2 text-xs font-medium text-gray-700">
            XSLT adı
          </label>
          <input
            id="xslt-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 ${
              isDuplicate
                ? 'border-red-300 focus:ring-red-200'
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
            }`}
          />
          {isDuplicate && (
            <p className="text-xs text-red-600">Bu isim zaten kullanılıyor.</p>
          )}
          {isEmpty && <p className="text-xs text-gray-500">İsim boş bırakılamaz.</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Atla
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-blue-600 text-white hover:bg-blue-700
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Kaydet
          </button>
        </div>
      </form>
    </div>
  )
}

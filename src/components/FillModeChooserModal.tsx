import { useEffect } from 'react'

interface FillModeChooserModalProps {
  open: boolean
  onCancel: () => void
  onPickScenarios: () => void
  onPickManual: () => void
}

/**
 * "Varsayılanları Doldur" butonuna basıldığında çıkan ara ekran.
 * İki kart-buton sunar: "Senaryolar" (hazır profiller) ve "Kendim Seçeceğim"
 * (mevcut DefaultsModal akışı). Sonraki adıma geçişten önce başka bir
 * doldurma stili belirlenmeyecekse bu modal kapanır.
 */
export default function FillModeChooserModal({
  open,
  onCancel,
  onPickScenarios,
  onPickManual,
}: FillModeChooserModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">Doldurma Yöntemi</h2>
          <button
            type="button"
            onClick={onCancel}
            title="Kapat"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <button
            type="button"
            onClick={onPickScenarios}
            className="flex items-start gap-3 text-left border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <span className="shrink-0 w-9 h-9 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11.3 1.046a1 1 0 01.578 1.276L9.943 7H14a1 1 0 01.832 1.555l-7 10.5A1 1 0 016 18.5L8.057 13H4a1 1 0 01-.832-1.555l7-10.5a1 1 0 011.132-.4z" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">Senaryolar</span>
              <span className="text-xs text-gray-500">Hazır profillerden seç</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onPickManual}
            className="flex items-start gap-3 text-left border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <span className="shrink-0 w-9 h-9 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">Kendim Seçeceğim</span>
              <span className="text-xs text-gray-500">Hangi grupların doldurulacağını ben seçeyim</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

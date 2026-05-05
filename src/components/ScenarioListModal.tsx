import { useEffect, useState } from 'react'
import type { FillScenario } from '../modules/invoice/defaults'

interface ScenarioListModalProps {
  open: boolean
  scenarios: FillScenario[]
  onCancel: () => void
  onSelect: (scenario: FillScenario, overwrite: boolean) => void
}

/**
 * Senaryolar (hazır doldurma profilleri) listesi. Her senaryo bir kart-buton
 * olarak listelenir; tıklandığında onSelect (footer'daki "üzerine yaz"
 * tercihiyle birlikte) tetiklenir ve senaryo doğrudan uygulanır. İleride
 * yeni senaryolar invoiceFillScenarios dizisine eklendikçe otomatik olarak
 * burada görünür.
 */
export default function ScenarioListModal({
  open,
  scenarios,
  onCancel,
  onSelect,
}: ScenarioListModalProps) {
  const [overwrite, setOverwrite] = useState(false)

  // Modal her açıldığında "üzerine yaz" varsayılanı kapalı.
  useEffect(() => {
    if (open) setOverwrite(false)
  }, [open])

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
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">Senaryolar</h2>
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
          {scenarios.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">
              Tanımlı senaryo bulunmuyor.
            </p>
          ) : (
            scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelect(scenario, overwrite)}
                className="text-left border border-gray-200 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <span className="block text-sm font-medium text-gray-800">
                  {scenario.label}
                </span>
                {scenario.description && (
                  <span className="block mt-1 text-xs text-gray-500">
                    {scenario.description}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-200 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-xs text-gray-700">Mevcut değerlerin üzerine yaz</span>
          </label>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  )
}

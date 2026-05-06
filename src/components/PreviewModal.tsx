import { useEffect } from 'react'

interface PreviewModalProps {
  open: boolean
  htmlContent: string
  error: string | null
  onClose: () => void
  onDownloadHtml: () => void
  onDownloadPdf: () => void
}

/**
 * XSLT ile dönüştürülmüş HTML çıktısını sandbox'lı iframe içinde önizler.
 * Footer'daki "HTML İndir" rendered HTML'i .html dosyası olarak indirir;
 * "PDF İndir" gizli iframe + window.print() ile tarayıcının native PDF
 * çıktı diyaloğunu tetikler.
 */
export default function PreviewModal({
  open,
  htmlContent,
  error,
  onClose,
  onDownloadHtml,
  onDownloadPdf,
}: PreviewModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-[53px] border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">XSLT Önizleme</h2>
          <button
            type="button"
            onClick={onClose}
            title="Kapat"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100">
          {error ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <p className="text-sm font-medium text-red-700 mb-2">
                  Önizleme oluşturulamadı
                </p>
                <p className="text-xs text-red-600 break-words">{error}</p>
              </div>
            </div>
          ) : (
            <iframe
              title="XSLT Önizleme"
              srcDoc={htmlContent}
              sandbox="allow-same-origin"
              className="w-full h-full border-0 bg-white"
            />
          )}
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
          <button
            type="button"
            onClick={onDownloadHtml}
            disabled={!!error || !htmlContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-green-600 text-white hover:bg-green-700
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            HTML İndir
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={!!error || !htmlContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
              bg-blue-600 text-white hover:bg-blue-700
              disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2H3a2 2 0 01-2-2V8a2 2 0 012-2h2V4zm10 8H5v6h10v-6zM7 6V4h6v2H7z" clipRule="evenodd" />
            </svg>
            PDF İndir
          </button>
        </div>
      </div>
    </div>
  )
}

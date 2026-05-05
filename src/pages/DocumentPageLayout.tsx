import { useState } from 'react'
import { useDocument } from '../context/DocumentContext'
import { treeToXml } from '../core/xmlSerializer'
import FieldForm from '../components/FieldForm'
import XMLNode from '../components/XMLNode'
import type { ModuleConfig, Tree } from '../types'

function downloadXml(tree: Tree, config: ModuleConfig, docType: string) {
  const xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
  if (!xml) return

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${docType}_${date}.xml`
  a.click()
  URL.revokeObjectURL(url)
}

function scrollToFieldId(fieldId: string) {
  // Açılması gereken kapalı gruplar için iki frame bekle (FieldGroup auto-expand sonrası DOM hazır olur)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-field-id="${CSS.escape(fieldId)}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  })
}

interface DocumentPageLayoutProps {
  title: string
}

export default function DocumentPageLayout({ title }: DocumentPageLayoutProps) {
  const {
    docType,
    tree,
    config,
    activeFieldId,
    setActiveFieldId,
    safeMode,
    toggleSafeMode,
    validationErrors,
    validateRequired,
  } = useDocument()
  const [collapseSignal, setCollapseSignal] = useState(0)

  const rootNodes = tree.children ? Object.values(tree.children) : []
  const hasRoot = rootNodes.length > 0
  const hasContent = hasRoot && Object.keys(rootNodes[0]?.children || {}).length > 0

  function handleDownload() {
    if (safeMode) {
      const errors = validateRequired()
      if (errors.length > 0) {
        scrollToFieldId(errors[0].fieldId)
        return
      }
    }
    downloadXml(tree, config, docType)
  }

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">

      <aside
        className="flex-1 min-w-0 flex flex-col bg-white border-r border-gray-200"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== 'INPUT') setActiveFieldId(null)
        }}
      >
        <div className="px-5 h-[53px] border-b border-gray-200 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <button
              type="button"
              onClick={toggleSafeMode}
              title="Güvenli Mod — zorunlu alanları XSD'ye göre doğrular"
              className="flex items-center gap-1.5 group"
            >
              <span
                className={`relative w-8 h-4 rounded-full transition-colors ${
                  safeMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                    safeMode ? 'left-4' : 'left-0.5'
                  }`}
                />
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  safeMode ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              >
                Güvenli Mod
              </span>
            </button>
            {safeMode && validationErrors.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">
                {validationErrors.length} eksik alan
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FieldForm />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-5 h-[53px] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              XML Önizleme
              {hasRoot && (
                <span className="ml-2 font-normal text-gray-400">
                  — {rootNodes[0].tag}
                </span>
              )}
            </span>
            {hasContent && (
              <button
                onClick={() => {
                  setCollapseSignal((n) => n + 1)
                  setActiveFieldId(null)
                  ;(document.activeElement as HTMLElement | null)?.blur()
                }}
                title="Alt grupları kapat"
                className="flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M14.707 17.707a1 1 0 01-1.414 0L10 14.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {safeMode && validationErrors.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">
                {validationErrors.length} eksik alan
              </span>
            )}
            <button
              onClick={handleDownload}
              disabled={!hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-blue-600 text-white hover:bg-blue-700
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              XML İndir
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {!hasRoot ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">
                Form alanlarını doldurduğunuzda XML ağacı burada görünür.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 font-mono text-sm">
              {rootNodes.map((node) => (
                <XMLNode key={node.tag} node={node} activeFieldId={activeFieldId} collapseSignal={collapseSignal} />
              ))}
              {!hasContent && (
                <p className="text-gray-400 text-xs mt-3 pl-5">
                  Form alanlarını doldurduğunuzda XML ağacı burada görünür.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { useDocument } from '../context/DocumentContext.jsx'
import { treeToXml } from '../core/xmlSerializer.js'
import FieldForm from '../components/FieldForm.jsx'
import XMLNode from '../components/XMLNode.jsx'

function downloadXml(tree, config, docType) {
  const xml = treeToXml(tree, config.rootTag)
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

export default function DocumentPageLayout({ title }) {
  const { docType, tree, config, activeFieldId, setActiveFieldId } = useDocument()
  const [collapseSignal, setCollapseSignal] = useState(0)

  const rootNodes = tree.children ? Object.values(tree.children) : []
  const hasRoot = rootNodes.length > 0
  const hasContent = hasRoot && Object.keys(rootNodes[0]?.children || {}).length > 0

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">

      {/* Form kolonu */}
      <aside
        className="flex-1 min-w-0 flex flex-col bg-white border-r border-gray-200"
        onMouseDown={(e) => {
          if (e.target.tagName !== 'INPUT') setActiveFieldId(null)
        }}
      >
        <div className="px-5 h-[53px] border-b border-gray-200 shrink-0 flex items-center">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FieldForm />
        </div>
      </aside>

      {/* XML önizleme kolonu */}
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
                onClick={() => { setCollapseSignal((n) => n + 1); setActiveFieldId(null); document.activeElement?.blur() }}
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

          <button
            onClick={() => downloadXml(tree, config, docType)}
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

import { useState, useEffect, useRef } from 'react'

function containsFieldId(node, fieldId) {
  if (node.fieldId === fieldId) return true
  if (!node.children) return false
  return Object.values(node.children).some((child) => containsFieldId(child, fieldId))
}

export default function XMLNode({ node, activeFieldId, depth = 0, collapseSignal = 0 }) {
  const [manualOpen, setManualOpen] = useState(true)
  const headerRef = useRef(null)

  const hasChildren = !!node?.children && Object.keys(node.children).length > 0
  const isActive = !!activeFieldId && node?.fieldId === activeFieldId
  const isAncestor =
    !isActive && !!activeFieldId && hasChildren && !!node && containsFieldId(node, activeFieldId)
  const isHighlighted = isActive || isAncestor
  const isOpen = manualOpen

  useEffect(() => {
    if (depth >= 1) setManualOpen(false)
  }, [collapseSignal])

  // When a field is focused, open any collapsed ancestor on the path to it
  useEffect(() => {
    if (isAncestor) setManualOpen(true)
  }, [activeFieldId])

  // Scroll after ancestors have re-rendered open
  useEffect(() => {
    if (!isActive) return
    const id = setTimeout(() => {
      headerRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(id)
  }, [activeFieldId])

  if (!node || !node.tag) return null

  const xmlAttrs =
    node.attr && typeof node.attr === 'object' ? Object.entries(node.attr) : []

  return (
    <div
      className={`border-l pl-2 ${
        isActive   ? 'border-orange-500 bg-blue-100' :
        isAncestor ? 'border-green-500 bg-blue-50' :
                     'border-gray-200'
      }`}
    >
      {/* Node header */}
      <div
        ref={isActive ? headerRef : null}
        className={`flex items-center gap-1 py-0.5 flex-wrap ${hasChildren ? 'cursor-pointer select-none' : ''}`}
        onClick={() => { if (hasChildren) setManualOpen((o) => !o) }}
      >
        <span className="w-3 text-xs text-gray-400 shrink-0">
          {hasChildren ? (isOpen ? '▾' : '▸') : ''}
        </span>

        <span
          className={`font-mono text-sm ${
            isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
          }`}
        >
          &lt;{node.tag}
          {xmlAttrs.map(([k, v]) => (
            <span key={k}>
              {' '}
              <span className="text-amber-600">{k}</span>
              =
              <span className="text-emerald-600">&quot;{v}&quot;</span>
            </span>
          ))}
          &gt;
        </span>

        {/* Leaf: value + inline closing tag */}
        {!hasChildren && (
          <>
            {node.value !== undefined && node.value !== '' && (
              <span className="font-mono text-sm text-emerald-700 truncate">
                {node.value}
              </span>
            )}
            <span className={`font-mono text-sm ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              &lt;/{node.tag}&gt;
            </span>
          </>
        )}

        {/* Collapsed container: inline ellipsis + closing tag */}
        {hasChildren && !isOpen && (
          <span className="font-mono text-sm text-gray-400">
            …&lt;/{node.tag}&gt;
          </span>
        )}
      </div>

      {/* Recursive children */}
      {hasChildren && isOpen && (
        <>
          <div className="ml-6">
            {Object.entries(node.children)
              .sort(([, a], [, b]) => (a._order ?? Infinity) - (b._order ?? Infinity))
              .map(([key, child]) => (
                <XMLNode key={key} node={child} activeFieldId={activeFieldId} depth={depth + 1} collapseSignal={collapseSignal} />
              ))}
          </div>
          {/* Closing tag after children */}
          <div className="flex items-center gap-1 py-0.5 pl-4">
            <span className={`font-mono text-sm ${isHighlighted ? 'text-blue-600' : 'text-gray-500'}`}>
              &lt;/{node.tag}&gt;
            </span>
          </div>
        </>
      )}
    </div>
  )
}

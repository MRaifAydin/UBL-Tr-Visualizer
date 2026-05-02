import { createContext, useContext, useState, useCallback } from 'react'
import { findOrCreateNodeById, removeNodeById } from '../core/treeManager.js'
import { MODULES } from '../modules/index.js'

const DocumentContext = createContext(null)

const DEFAULT_DOC_TYPE = Object.keys(MODULES)[0]

// Her modül kendi tree + activeFieldId slice'ını tutar
const initialStates = Object.fromEntries(
  Object.keys(MODULES).map((key) => [key, { tree: {}, activeFieldId: null }])
)

export function DocumentProvider({ children }) {
  const [docType, setDocType] = useState(DEFAULT_DOC_TYPE)
  const [states, setStates] = useState(initialStates)

  const switchDocType = useCallback((type) => {
    if (!MODULES[type]) {
      console.warn(`Bilinmeyen belge tipi: ${type}`)
      return
    }
    setDocType(type)
    // Diğer modülün state'i dokunulmaz kalır
  }, [])

  const setActiveFieldId = useCallback((id) => {
    setStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], activeFieldId: id },
    }))
  }, [docType])

  const updateField = useCallback((fieldId, path, value, attr, order, keepEmpty = false) => {
    const fieldOrder = order !== undefined
      ? order
      : MODULES[docType].fieldDefinitions.findIndex((f) => f.fieldId === fieldId)
    setStates((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        tree:
          value === '' && !keepEmpty
            ? removeNodeById(prev[docType].tree, fieldId, path)
            : findOrCreateNodeById(prev[docType].tree, fieldId, path, value, attr, fieldOrder),
      },
    }))
  }, [docType])

  const removeField = useCallback((fieldId, path) => {
    setStates((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        tree: removeNodeById(prev[docType].tree, fieldId, path),
      },
    }))
  }, [docType])

  const { tree, activeFieldId } = states[docType]

  const value = {
    docType,
    setDocType: switchDocType,
    tree,
    updateField,
    removeField,
    activeFieldId,
    setActiveFieldId,
    config: MODULES[docType],
  }

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocument() {
  const ctx = useContext(DocumentContext)
  if (!ctx) {
    throw new Error('useDocument, DocumentProvider içinde kullanılmalıdır.')
  }
  return ctx
}

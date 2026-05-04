import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { findOrCreateNodeById, removeNodeById, removeSubtree } from '../core/treeManager'
import { MODULES } from '../modules'
import type { DocumentContextValue, FieldAttr, Tree } from '../types'

const DocumentContext = createContext<DocumentContextValue | null>(null)

const DEFAULT_DOC_TYPE = Object.keys(MODULES)[0]

interface DocSlice {
  tree: Tree
  activeFieldId: string | null
}

const initialStates: Record<string, DocSlice> = Object.fromEntries(
  Object.keys(MODULES).map((key) => [key, { tree: {}, activeFieldId: null } as DocSlice]),
)

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [docType, setDocType] = useState<string>(DEFAULT_DOC_TYPE)
  const [states, setStates] = useState<Record<string, DocSlice>>(initialStates)

  const switchDocType = useCallback((type: string) => {
    if (!MODULES[type]) {
      console.warn(`Bilinmeyen belge tipi: ${type}`)
      return
    }
    setDocType(type)
  }, [])

  const setActiveFieldId = useCallback(
    (id: string | null) => {
      setStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], activeFieldId: id },
      }))
    },
    [docType],
  )

  const updateField = useCallback(
    (
      fieldId: string,
      path: string[],
      value: string,
      attr?: FieldAttr,
      order?: number,
      keepEmpty = false,
    ) => {
      const fieldOrder =
        order !== undefined
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
    },
    [docType],
  )

  const removeField = useCallback(
    (fieldId: string, path: string[]) => {
      setStates((prev) => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          tree: removeNodeById(prev[docType].tree, fieldId, path),
        },
      }))
    },
    [docType],
  )

  const removeSubtreeAtPath = useCallback(
    (path: string[]) => {
      setStates((prev) => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          tree: removeSubtree(prev[docType].tree, path),
        },
      }))
    },
    [docType],
  )

  const { tree, activeFieldId } = states[docType]

  const value: DocumentContextValue = {
    docType,
    setDocType: switchDocType,
    tree,
    updateField,
    removeField,
    removeSubtree: removeSubtreeAtPath,
    activeFieldId,
    setActiveFieldId,
    config: MODULES[docType],
  }

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export function useDocument(): DocumentContextValue {
  const ctx = useContext(DocumentContext)
  if (!ctx) {
    throw new Error('useDocument, DocumentProvider içinde kullanılmalıdır.')
  }
  return ctx
}

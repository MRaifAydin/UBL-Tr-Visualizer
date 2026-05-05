import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { findNodeById, findOrCreateNodeById, removeNodeById, removeSubtree } from '../core/treeManager'
import { MODULES } from '../modules'
import type { DocumentContextValue, FieldAttr, ModuleConfig, Tree, ValidationError } from '../types'

const DocumentContext = createContext<DocumentContextValue | null>(null)

const DEFAULT_DOC_TYPE = Object.keys(MODULES)[0]

interface DocSlice {
  tree: Tree
  activeFieldId: string | null
  validationErrors: ValidationError[]
  validationActive: boolean
}

const initialStates: Record<string, DocSlice> = Object.fromEntries(
  Object.keys(MODULES).map((key) => [
    key,
    { tree: {}, activeFieldId: null, validationErrors: [], validationActive: false } as DocSlice,
  ]),
)

const SAFE_MODE_KEY_PREFIX = 'safeMode:'

function readSafeModeFromStorage(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const key of Object.keys(MODULES)) {
    try {
      out[key] = localStorage.getItem(SAFE_MODE_KEY_PREFIX + key) === '1'
    } catch {
      out[key] = false
    }
  }
  return out
}

function computeRequiredErrors(tree: Tree, config: ModuleConfig): ValidationError[] {
  const errors: ValidationError[] = []
  for (const field of config.fieldDefinitions) {
    if (!field.required) continue
    const node = findNodeById(tree, field.fieldId)
    const value = node?.value ?? ''
    if (value === '') {
      errors.push({ fieldId: field.fieldId, label: field.label, path: field.path })
    }
  }
  return errors
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [docType, setDocType] = useState<string>(DEFAULT_DOC_TYPE)
  const [states, setStates] = useState<Record<string, DocSlice>>(initialStates)
  const [safeModeMap, setSafeModeMap] = useState<Record<string, boolean>>(() => readSafeModeFromStorage())

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
      const fieldDef = MODULES[docType].fieldDefinitions.find((f) => f.fieldId === fieldId)
      const fieldOrder =
        order !== undefined
          ? order
          : MODULES[docType].fieldDefinitions.findIndex((f) => f.fieldId === fieldId)
      setStates((prev) => {
        const slice = prev[docType]
        const nextTree =
          value === '' && !keepEmpty
            ? removeNodeById(slice.tree, fieldId, path)
            : findOrCreateNodeById(slice.tree, fieldId, path, value, attr, fieldOrder)

        let nextErrors = slice.validationErrors
        if (slice.validationActive) {
          const exists = slice.validationErrors.some((e) => e.fieldId === fieldId)
          if (value !== '' && exists) {
            nextErrors = slice.validationErrors.filter((e) => e.fieldId !== fieldId)
          } else if (value === '' && !exists && fieldDef?.required) {
            nextErrors = [
              ...slice.validationErrors,
              { fieldId, label: fieldDef.label, path: fieldDef.path },
            ]
          }
        }

        return {
          ...prev,
          [docType]: {
            ...slice,
            tree: nextTree,
            validationErrors: nextErrors,
          },
        }
      })
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

  const toggleSafeMode = useCallback(() => {
    setSafeModeMap((prev) => {
      const next = !prev[docType]
      try {
        localStorage.setItem(SAFE_MODE_KEY_PREFIX + docType, next ? '1' : '0')
      } catch {
        // localStorage erişim hatası — sessizce yut
      }
      return { ...prev, [docType]: next }
    })
    if (safeModeMap[docType]) {
      // Safe mode kapatılıyor → hata listesini ve aktif flag'i sıfırla
      setStates((prev) => ({
        ...prev,
        [docType]: { ...prev[docType], validationErrors: [], validationActive: false },
      }))
    }
  }, [docType, safeModeMap])

  const validateRequired = useCallback((): ValidationError[] => {
    const slice = states[docType]
    const errors = computeRequiredErrors(slice.tree, MODULES[docType])
    setStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], validationErrors: errors, validationActive: true },
    }))
    return errors
  }, [docType, states])

  const clearValidationErrors = useCallback(() => {
    setStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], validationErrors: [], validationActive: false },
    }))
  }, [docType])

  // Doc type değiştiğinde validation'ı sıfırla
  useEffect(() => {
    setStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], validationErrors: [], validationActive: false },
    }))
  }, [docType])

  const { tree, activeFieldId, validationErrors } = states[docType]
  const safeMode = safeModeMap[docType] ?? false

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
    safeMode,
    toggleSafeMode,
    validationErrors,
    validateRequired,
    clearValidationErrors,
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

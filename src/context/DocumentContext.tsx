import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { collectLeafFieldIds, findNodeById, findOrCreateNodeById, removeNodeById, removeSubtree } from '../core/treeManager'
import { MODULES } from '../modules'
import { parseDocTypeFromPath, pathFromDocType, readInitialDocType } from '../lib/urlDocType'
import type { DocumentContextValue, FieldAttr, ModuleConfig, SelectOption, Tree, ValidationError } from '../types'

const DocumentContext = createContext<DocumentContextValue | null>(null)

const DEFAULT_DOC_TYPE = Object.keys(MODULES)[0]

interface DocSlice {
  tree: Tree
  activeFieldId: string | null
  focusRequest: { fieldId: string; nonce: number } | null
  validationErrors: ValidationError[]
  validationActive: boolean
  loadCounter: number
  extraOptions: Record<string, SelectOption[]>
  loadedFieldIds: Set<string>
}

const initialStates: Record<string, DocSlice> = Object.fromEntries(
  Object.keys(MODULES).map((key) => [
    key,
    {
      tree: {},
      activeFieldId: null,
      focusRequest: null,
      validationErrors: [],
      validationActive: false,
      loadCounter: 0,
      extraOptions: {},
      loadedFieldIds: new Set<string>(),
    } as DocSlice,
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
  const [docType, setDocType] = useState<string>(() => readInitialDocType())
  const [states, setStates] = useState<Record<string, DocSlice>>(initialStates)
  const [safeModeMap, setSafeModeMap] = useState<Record<string, boolean>>(() => readSafeModeFromStorage())

  const switchDocType = useCallback((type: string) => {
    if (!MODULES[type]) {
      console.warn(`Bilinmeyen belge tipi: ${type}`)
      return
    }
    const nextPath = pathFromDocType(type)
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
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

  const requestFieldFocus = useCallback(
    (id: string) => {
      setStates((prev) => {
        const slice = prev[docType]
        const nextNonce = (slice.focusRequest?.nonce ?? 0) + 1
        return {
          ...prev,
          [docType]: {
            ...slice,
            activeFieldId: id,
            focusRequest: { fieldId: id, nonce: nextNonce },
          },
        }
      })
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
      if (!next) {
        // Safe mode kapatılıyor → hata listesini ve aktif flag'i sıfırla
        setStates((s) => ({
          ...s,
          [docType]: { ...s[docType], validationErrors: [], validationActive: false },
        }))
      }
      return { ...prev, [docType]: next }
    })
  }, [docType])

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

  const loadTree = useCallback(
    (newTree: Tree, newExtraOptions: Record<string, SelectOption[]> = {}) => {
      const loaded = new Set<string>()
      for (const { fieldId, value } of collectLeafFieldIds(newTree)) {
        if (value !== '') loaded.add(fieldId)
      }
      setStates((prev) => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          tree: newTree,
          activeFieldId: null,
          focusRequest: null,
          validationErrors: [],
          validationActive: false,
          loadCounter: prev[docType].loadCounter + 1,
          extraOptions: newExtraOptions,
          loadedFieldIds: loaded,
        },
      }))
    },
    [docType],
  )

  // Doc type değiştiğinde validation'ı sıfırla
  useEffect(() => {
    setStates((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], validationErrors: [], validationActive: false },
    }))
  }, [docType])

  // Tarayıcı geri/ileri butonları için URL → docType senkronizasyonu
  useEffect(() => {
    function handlePopState() {
      const next = parseDocTypeFromPath(window.location.pathname) ?? DEFAULT_DOC_TYPE
      setDocType(next)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // İlk mount'ta URL geçersizse (örn. /foo) düzelt — replaceState history'yi kirletmez
  useEffect(() => {
    const expected = pathFromDocType(docType)
    if (window.location.pathname !== expected) {
      window.history.replaceState({}, '', expected)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { tree, activeFieldId, focusRequest, validationErrors, loadCounter, extraOptions, loadedFieldIds } = states[docType]
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
    focusRequest,
    requestFieldFocus,
    config: MODULES[docType],
    safeMode,
    toggleSafeMode,
    validationErrors,
    validateRequired,
    clearValidationErrors,
    loadTree,
    loadCounter,
    extraOptions,
    loadedFieldIds,
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

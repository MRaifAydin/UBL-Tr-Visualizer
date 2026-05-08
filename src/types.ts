export interface TreeNode {
  tag?: string
  fieldId?: string
  value?: string
  attr?: Record<string, string>
  children?: Record<string, TreeNode>
  _order?: number
}

export interface Tree {
  children?: Record<string, TreeNode>
}

export interface SelectOption {
  value: string
  label: string
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'duration-measure'
  | 'notes-list'

/**
 * Alanın XML'de nasıl yazılacağını belirler:
 * - `'value'` → element text'i olarak yazılır (örn. `<cbc:ID>123</cbc:ID>`).
 * - `Record<string, string>` → element üzerinde attribute olarak yazılır
 *   (anahtar = attribute adı, değer = attribute değeri; örn.
 *   `{ currencyID: 'TRY' }` → `<cbc:PayableAmount currencyID="TRY">100</cbc:PayableAmount>`).
 */
export type FieldAttr = 'value' | Record<string, string>

export interface FieldDefinition {
  fieldId: string
  label: string
  path: string[]
  attr: FieldAttr
  type?: FieldType
  options?: SelectOption[]
  attrKey?: string
  disabled?: boolean
  required?: boolean
  _order?: number
}

export interface ValidationError {
  fieldId: string
  label: string
  path: string[]
}

export type GroupItem = FieldDefinition | FieldGroupConfig

export interface FieldGroupConfig {
  title: string
  fields?: FieldDefinition[]
  subgroups?: FieldGroupConfig[]
  items?: GroupItem[]
  wide?: boolean
  fullWidth?: boolean
  wrap?: boolean
  defaultOpen?: boolean
  newRow?: boolean
  repeatable?: boolean
  instanceMarker?: string
  addLabel?: string
}

export interface ModuleConfig {
  rootTag: string
  rootAttributes?: Record<string, string>
  rootStaticPrefix?: string
  fieldGroups: FieldGroupConfig[]
  fieldDefinitions: FieldDefinition[]
  xsltPath?: string
}

export interface DocumentContextValue {
  docType: string
  setDocType: (type: string) => void
  tree: Tree
  updateField: (
    fieldId: string,
    path: string[],
    value: string,
    attr?: FieldAttr,
    order?: number,
    keepEmpty?: boolean,
  ) => void
  removeField: (fieldId: string, path: string[]) => void
  removeSubtree: (path: string[]) => void
  activeFieldId: string | null
  setActiveFieldId: (id: string | null) => void
  focusRequest: { fieldId: string; nonce: number } | null
  requestFieldFocus: (fieldId: string) => void
  config: ModuleConfig
  safeMode: boolean
  toggleSafeMode: () => void
  validationErrors: ValidationError[]
  validateRequired: () => ValidationError[]
  clearValidationErrors: () => void
  loadTree: (tree: Tree, extraOptions?: Record<string, SelectOption[]>) => void
  loadCounter: number
  extraOptions: Record<string, SelectOption[]>
  loadedFieldIds: Set<string>
}

export function isFieldDefinition(item: GroupItem): item is FieldDefinition {
  return 'fieldId' in item
}

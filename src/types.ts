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
}

export interface ModuleConfig {
  rootTag: string
  fieldGroups: FieldGroupConfig[]
  fieldDefinitions: FieldDefinition[]
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
  activeFieldId: string | null
  setActiveFieldId: (id: string | null) => void
  config: ModuleConfig
}

export function isFieldDefinition(item: GroupItem): item is FieldDefinition {
  return 'fieldId' in item
}

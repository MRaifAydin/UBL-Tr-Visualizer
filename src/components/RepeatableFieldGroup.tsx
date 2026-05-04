import { useEffect, useRef, useState } from 'react'
import { useDocument } from '../context/DocumentContext'
import FieldGroup from './FieldGroup'
import { renderGroupChildren } from './FieldForm'
import type {
  FieldDefinition,
  FieldGroupConfig,
  GroupItem,
  Tree,
  TreeNode,
} from '../types'
import { isFieldDefinition } from '../types'

interface RepeatableFieldGroupProps {
  group: FieldGroupConfig
  depth: number
}

const INSTANCE_STEP = 0.01
const FIELD_STEP = 0.0001

export default function RepeatableFieldGroup({ group, depth }: RepeatableFieldGroupProps) {
  const { tree, docType, config, removeSubtree } = useDocument()
  const marker = group.instanceMarker ?? ''
  const markerPathPrefix = findMarkerPathPrefix(group, marker)

  const [instances, setInstances] = useState<number[]>([])
  const nextIdx = useRef(0)

  useEffect(() => {
    const found = findExistingInstanceIndices(tree, markerPathPrefix, marker)
    setInstances(found)
    nextIdx.current = found.length === 0 ? 0 : Math.max(...found) + 1
  }, [docType])

  const groupIdx = config.fieldGroups.findIndex((g) => g.title === group.title)
  const anchorOrder = (groupIdx >= 0 ? groupIdx : config.fieldGroups.length) * 1000

  function addInstance() {
    const idx = nextIdx.current
    nextIdx.current += 1
    setInstances((prev) => [...prev, idx])
  }

  function removeInstance(idx: number) {
    if (markerPathPrefix.length > 0) {
      const subtreePath = [
        ...markerPathPrefix.slice(0, -1),
        `${marker}#${idx}`,
      ]
      removeSubtree(subtreePath)
    }
    setInstances((prev) => prev.filter((i) => i !== idx))
  }

  return (
    <FieldGroup
      title={group.title}
      wrap={group.wrap}
      fullWidth={group.fullWidth}
      collapsible
      defaultOpen={!!group.defaultOpen}
      depth={depth}
    >
      <div className="col-span-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={addInstance}
          className="self-start flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-400 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
        >
          <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5">
            <path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z" />
          </svg>
          {group.addLabel ?? 'Yeni Ekle'}
        </button>

        {instances.length === 0 && (
          <p className="text-xs text-gray-400 italic">Henüz eklenmiş kayıt yok.</p>
        )}

        {instances.map((idx, position) => {
          const transformed = transformGroup(
            group,
            marker,
            idx,
            anchorOrder + position * INSTANCE_STEP,
            { offset: 0 },
          )
          return (
            <FieldGroup
              key={idx}
              title={`${group.title} #${position + 1}`}
              wrap={transformed.wrap}
              fullWidth
              collapsible
              defaultOpen
              depth={depth + 1}
              headerExtra={
                <button
                  type="button"
                  onClick={() => removeInstance(idx)}
                  title="Kaldır"
                  className="px-2 py-0.5 rounded text-[10px] text-rose-500 hover:bg-rose-50 border border-rose-200"
                >
                  ✕ Kaldır
                </button>
              }
            >
              {renderGroupChildren(transformed, depth + 1)}
            </FieldGroup>
          )
        })}
      </div>
    </FieldGroup>
  )
}

interface FieldOffsetCounter {
  offset: number
}

function transformGroup(
  group: FieldGroupConfig,
  marker: string,
  idx: number,
  baseOrder: number,
  counter: FieldOffsetCounter,
): FieldGroupConfig {
  const next: FieldGroupConfig = { ...group }
  delete next.repeatable
  delete next.instanceMarker
  delete next.addLabel

  if (group.items) {
    next.items = group.items.map((item) => transformItem(item, marker, idx, baseOrder, counter))
  } else {
    if (group.fields) {
      next.fields = group.fields.map((f) => rewriteField(f, marker, idx, baseOrder, counter))
    }
    if (group.subgroups) {
      next.subgroups = group.subgroups.map((sub) => transformGroup(sub, marker, idx, baseOrder, counter))
    }
  }

  return next
}

function transformItem(
  item: GroupItem,
  marker: string,
  idx: number,
  baseOrder: number,
  counter: FieldOffsetCounter,
): GroupItem {
  if (isFieldDefinition(item)) {
    return rewriteField(item, marker, idx, baseOrder, counter)
  }
  return transformGroup(item, marker, idx, baseOrder, counter)
}

function rewriteField(
  field: FieldDefinition,
  marker: string,
  idx: number,
  baseOrder: number,
  counter: FieldOffsetCounter,
): FieldDefinition {
  const newPath = field.path.map((seg) => (seg === marker ? `${marker}#${idx}` : seg))
  const order = baseOrder + counter.offset * FIELD_STEP
  counter.offset += 1
  return {
    ...field,
    fieldId: `${field.fieldId}--${idx}`,
    path: newPath,
    _order: order,
  }
}

function findMarkerPathPrefix(group: FieldGroupConfig, marker: string): string[] {
  if (!marker) return []
  const firstField = findFirstField(group)
  if (!firstField) return []
  const idx = firstField.path.indexOf(marker)
  if (idx < 0) return []
  return firstField.path.slice(0, idx + 1)
}

function findFirstField(group: FieldGroupConfig): FieldDefinition | null {
  const items: GroupItem[] = group.items ?? [
    ...(group.fields ?? []),
    ...((group.subgroups as GroupItem[]) ?? []),
  ]
  for (const item of items) {
    if (isFieldDefinition(item)) return item
    const child = findFirstField(item)
    if (child) return child
  }
  return null
}

function findExistingInstanceIndices(
  tree: Tree,
  markerPathPrefix: string[],
  marker: string,
): number[] {
  if (markerPathPrefix.length === 0) return []
  let node: TreeNode | undefined = tree as TreeNode
  for (let i = 0; i < markerPathPrefix.length - 1; i++) {
    const seg = markerPathPrefix[i]
    if (!node?.children?.[seg]) return []
    node = node.children[seg]
  }
  if (!node?.children) return []
  const prefix = `${marker}#`
  const result: number[] = []
  for (const key of Object.keys(node.children)) {
    if (!key.startsWith(prefix)) continue
    const n = Number(key.slice(prefix.length))
    if (!Number.isNaN(n)) result.push(n)
  }
  return result.sort((a, b) => a - b)
}

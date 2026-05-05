import type {
  FieldAttr,
  FieldDefinition,
  FieldGroupConfig,
  ModuleConfig,
  SelectOption,
  Tree,
} from '../types'
import { isFieldDefinition } from '../types'
import { findOrCreateNodeById } from './treeManager'

export interface XmlImportResult {
  tree: Tree
  unknownPaths: string[]
  extraOptions: Record<string, SelectOption[]>
}

interface PathMapEntry {
  fieldDef: FieldDefinition
  repeatable: {
    anchorOrder: number
    fieldOffset: number
  } | null
}

const IGNORED_ROOT_CHILDREN = new Set([
  'ext:UBLExtensions',
  'cbc:UBLVersionID',
  'cbc:CustomizationID',
])

export function parseXmlToTree(xmlString: string, config: ModuleConfig): XmlImportResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const parseErr = doc.getElementsByTagName('parsererror')[0]
  if (parseErr) {
    throw new Error('XML dosyası geçersiz biçimde — yapı çözümlenemedi.')
  }

  const rootEl = doc.documentElement
  if (!rootEl) {
    throw new Error('XML belgesi boş.')
  }
  if (rootEl.localName !== config.rootTag) {
    throw new Error(
      `Beklenen kök öğe <${config.rootTag}> bulunamadı. Yüklenen belgenin kök öğesi: <${rootEl.localName}>.`,
    )
  }

  const nsMap = buildNsPrefixMap(config.rootAttributes ?? {})
  const pathMap = buildPathMap(config.fieldGroups)
  const markerSet = buildRepeatableMarkerSet(config.fieldGroups)

  const ctx: ParseContext = {
    config,
    nsMap,
    pathMap,
    markerSet,
    tree: {},
    unknownPaths: [],
    extraOptions: {},
    notesCounters: new Map(),
  }

  const rootCanonical = [config.rootTag]
  const rootActual = [config.rootTag]
  // First, ensure the root tree node exists with the right tag — even if XML has no
  // dynamic children, downstream code expects tree.children[rootTag] to exist after a
  // successful import. The simplest way is to traverse children; if none, tree stays {}.
  traverseChildren(rootEl, rootCanonical, rootActual, [], ctx)

  return {
    tree: ctx.tree,
    unknownPaths: ctx.unknownPaths,
    extraOptions: ctx.extraOptions,
  }
}

interface ParseContext {
  config: ModuleConfig
  nsMap: Map<string, string>
  pathMap: Map<string, PathMapEntry>
  markerSet: Set<string>
  tree: Tree
  unknownPaths: string[]
  extraOptions: Record<string, SelectOption[]>
  notesCounters: Map<string, number>
}

function traverseChildren(
  parent: Element,
  canonicalPath: string[],
  actualPath: string[],
  markerIds: number[],
  ctx: ParseContext,
): void {
  const children = Array.from(parent.children)
  const sameLevelMarkerCounts = new Map<string, number>()

  for (const child of children) {
    const tag = getCanonicalTag(child, ctx.nsMap)

    if (canonicalPath.length === 1 && IGNORED_ROOT_CHILDREN.has(tag)) continue

    let nextCanonical: string[]
    let nextActual: string[]
    let nextMarkerIds: number[]

    if (ctx.markerSet.has(tag)) {
      const count = sameLevelMarkerCounts.get(tag) ?? 0
      sameLevelMarkerCounts.set(tag, count + 1)
      nextCanonical = [...canonicalPath, tag]
      nextActual = [...actualPath, `${tag}#${count}`]
      nextMarkerIds = [...markerIds, count]
    } else {
      nextCanonical = [...canonicalPath, tag]
      nextActual = [...actualPath, tag]
      nextMarkerIds = markerIds
    }

    const grandchildren = Array.from(child.children)
    if (grandchildren.length === 0) {
      processLeaf(child, nextCanonical, nextActual, nextMarkerIds, ctx)
    } else {
      traverseChildren(child, nextCanonical, nextActual, nextMarkerIds, ctx)
    }
  }
}

function processLeaf(
  el: Element,
  canonicalPath: string[],
  actualPath: string[],
  markerIds: number[],
  ctx: ParseContext,
): void {
  const value = (el.textContent ?? '').trim()

  const attrEntries: [string, string][] = []
  for (const a of Array.from(el.attributes)) {
    if (a.name === 'xmlns' || a.name.startsWith('xmlns:')) continue
    attrEntries.push([a.name, a.value])
  }
  const hasValue = value !== ''
  const hasAttr = attrEntries.length > 0
  if (!hasValue && !hasAttr) return

  const canonicalKey = canonicalPath.join('/')
  const entry = ctx.pathMap.get(canonicalKey)
  if (!entry) {
    if (!ctx.unknownPaths.includes(canonicalKey)) ctx.unknownPaths.push(canonicalKey)
    return
  }

  const { fieldDef, repeatable } = entry

  let fieldId = fieldDef.fieldId
  for (const idx of markerIds) fieldId += `--${idx}`

  if (fieldDef.type === 'notes-list') {
    const counterKey = `${canonicalKey}|${markerIds.join(',')}`
    const seen = ctx.notesCounters.get(counterKey) ?? 0
    ctx.notesCounters.set(counterKey, seen + 1)
    fieldId = `${fieldId}-${seen + 1}`
  }

  const attrObj: Record<string, string> | undefined = hasAttr
    ? Object.fromEntries(attrEntries)
    : undefined

  if (fieldDef.type === 'select' || fieldDef.type === 'duration-measure') {
    const options = fieldDef.options ?? []
    let checkValue = ''
    if (fieldDef.type === 'select') {
      checkValue = value
    } else {
      const key = fieldDef.attrKey ?? 'unitCode'
      checkValue = attrObj?.[key] ?? ''
    }
    if (checkValue && !options.some((o) => o.value === checkValue)) {
      const list = ctx.extraOptions[fieldId] ?? []
      if (!list.some((o) => o.value === checkValue)) {
        ctx.extraOptions[fieldId] = [...list, { value: checkValue, label: checkValue }]
      }
    }
  }

  let order = 0
  if (repeatable === null) {
    const idx = ctx.config.fieldDefinitions.findIndex((f) => f.fieldId === fieldDef.fieldId)
    order = idx >= 0 ? idx : 0
  } else {
    const position = markerIds[0] ?? 0
    order = repeatable.anchorOrder + position * 0.01 + repeatable.fieldOffset * 0.0001
  }

  const attrParam: FieldAttr | undefined = attrObj
  ctx.tree = findOrCreateNodeById(ctx.tree, fieldId, actualPath, value, attrParam, order)
}

function getCanonicalTag(el: Element, nsMap: Map<string, string>): string {
  const localName = el.localName
  const ns = el.namespaceURI
  if (!ns) return el.prefix ? `${el.prefix}:${localName}` : localName
  const prefix = nsMap.get(ns)
  if (prefix === undefined) {
    return el.prefix ? `${el.prefix}:${localName}` : localName
  }
  return prefix === '' ? localName : `${prefix}:${localName}`
}

function buildNsPrefixMap(rootAttrs: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>()
  for (const [attr, uri] of Object.entries(rootAttrs)) {
    if (attr === 'xmlns') {
      map.set(uri, '')
    } else if (attr.startsWith('xmlns:')) {
      map.set(uri, attr.slice(6))
    }
  }
  return map
}

function buildPathMap(groups: FieldGroupConfig[]): Map<string, PathMapEntry> {
  const map = new Map<string, PathMapEntry>()

  function visit(group: FieldGroupConfig, topGroups: FieldGroupConfig[]) {
    if (group.repeatable && group.instanceMarker) {
      const groupIdx = topGroups.findIndex((g) => g.title === group.title)
      const anchorOrder = (groupIdx >= 0 ? groupIdx : topGroups.length) * 1000
      const counter = { offset: 0 }
      visitRepeatable(group, anchorOrder, counter, map)
      return
    }
    if (group.fields) {
      for (const f of group.fields) addToMap(map, f, null)
    }
    if (group.items) {
      for (const item of group.items) {
        if (isFieldDefinition(item)) addToMap(map, item, null)
        else visit(item, topGroups)
      }
    }
    if (group.subgroups) {
      for (const sub of group.subgroups) visit(sub, topGroups)
    }
  }

  for (const g of groups) visit(g, groups)
  return map
}

function visitRepeatable(
  group: FieldGroupConfig,
  anchorOrder: number,
  counter: { offset: number },
  map: Map<string, PathMapEntry>,
): void {
  if (group.fields) {
    for (const f of group.fields) {
      addToMap(map, f, { anchorOrder, fieldOffset: counter.offset })
      counter.offset += 1
    }
  }
  if (group.items) {
    for (const item of group.items) {
      if (isFieldDefinition(item)) {
        addToMap(map, item, { anchorOrder, fieldOffset: counter.offset })
        counter.offset += 1
      } else {
        visitRepeatable(item, anchorOrder, counter, map)
      }
    }
  }
  if (group.subgroups) {
    for (const sub of group.subgroups) visitRepeatable(sub, anchorOrder, counter, map)
  }
}

function addToMap(
  map: Map<string, PathMapEntry>,
  field: FieldDefinition,
  repeatable: PathMapEntry['repeatable'],
): void {
  const key = field.path.join('/')
  if (map.has(key)) {
    console.warn(`[xmlParser] Yol çakışması: ${key} — ilk eşleşme tutuluyor.`)
    return
  }
  map.set(key, { fieldDef: field, repeatable })
}

function buildRepeatableMarkerSet(groups: FieldGroupConfig[]): Set<string> {
  const set = new Set<string>()
  function visit(group: FieldGroupConfig) {
    if (group.repeatable && group.instanceMarker) set.add(group.instanceMarker)
    if (group.items) {
      for (const item of group.items) if (!isFieldDefinition(item)) visit(item)
    }
    if (group.subgroups) for (const sub of group.subgroups) visit(sub)
  }
  for (const g of groups) visit(g)
  return set
}

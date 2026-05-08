/**
 * Rigorous sample-vs-scenario audit (value-level).
 * For each sample XML:
 *   1. Parse XML and extract all leaf path → (text, attrs) tuples.
 *   2. Build fieldId↔path map from invoice config.
 *   3. For each scenario, check that every sample leaf has a matching fieldOverride.
 *   4. Report MISSING (sample has, scenario lacks) and EXTRA (scenario has, sample doesn't).
 */
import { readFileSync } from 'node:fs'
import { DOMParser } from '@xmldom/xmldom'
import type { FieldDefinition } from '../src/types'
import { isFieldDefinition } from '../src/types'
import { fieldGroups, fieldDefinitions } from '../src/modules/invoice/config'

const invoiceConfig = { fieldGroups, fieldDefinitions }

type LeafEntry = { path: string; value: string; attrs: Record<string, string> }

function flattenFields(group: any, out: FieldDefinition[] = []): FieldDefinition[] {
  if (!group) return out
  if (Array.isArray(group.fields)) {
    for (const item of group.fields) {
      if (isFieldDefinition(item)) out.push(item)
      else flattenFields(item, out)
    }
  }
  if (Array.isArray(group.subgroups)) {
    for (const sg of group.subgroups) flattenFields(sg, out)
  }
  if (Array.isArray(group.items)) {
    for (const item of group.items) {
      if (isFieldDefinition(item)) out.push(item)
      else flattenFields(item, out)
    }
  }
  return out
}

const allFields: FieldDefinition[] = []
for (const g of invoiceConfig.fieldGroups) flattenFields(g, allFields)

// fieldId → key (path string)
function fieldKey(f: FieldDefinition): string {
  return f.path.join('/')
}

// path string → fieldId(s)
const pathToFieldIds = new Map<string, FieldDefinition[]>()
for (const f of allFields) {
  const k = fieldKey(f)
  const list = pathToFieldIds.get(k) ?? []
  list.push(f)
  pathToFieldIds.set(k, list)
}

// Parse sample XML
function extractLeaves(xml: string): LeafEntry[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const root = doc.documentElement
  const leaves: LeafEntry[] = []
  function walk(el: Element, path: string[]) {
    const tag = el.nodeName // already prefixed (e.g., cbc:ID)
    const newPath = [...path, tag]
    const children = Array.from(el.childNodes).filter(n => n.nodeType === 1) as Element[]
    const attrs: Record<string, string> = {}
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes.item(i)!
      // Skip xmlns and xsi:* attributes
      if (a.name.startsWith('xmlns') || a.name.startsWith('xsi:')) continue
      attrs[a.name] = a.value
    }
    if (children.length === 0) {
      const text = (el.textContent || '').trim()
      if (text || Object.keys(attrs).length) {
        leaves.push({ path: newPath.join('/'), value: text, attrs })
      }
    } else {
      // If element has both text and children, ignore text
      for (const c of children) walk(c, newPath)
    }
  }
  walk(root, [])
  return leaves
}

const SAMPLES_DIR = 'references/invoice/samples'
const SCENARIOS_PATH = 'src/modules/invoice/scenarios.generated.json'

const SAMPLES: Record<string, string> = {
  temelfatura: 'TemelFaturaOrnegi.xml',
  ticarifatura: 'TicariFaturaOrnegi.xml',
  yolcuberaberfatura: 'YOLCUBERABER.xml',
  ihracat: 'IHRACAT.xml',
  'enerji-sarj': 'SARJ.xml',
  'enerji-sarjanlik': 'SARJANLIK.xml',
}

const scenariosFile = JSON.parse(readFileSync(SCENARIOS_PATH, 'utf-8'))
const byId: Record<string, any> = {}
for (const s of scenariosFile.scenarios) byId[s.id] = s

// Tags to skip (static prefix)
const SKIP_TAGS = new Set(['cbc:UBLVersionID', 'cbc:CustomizationID'])
const SKIP_ROOTS = new Set(['ext:UBLExtensions'])

let totalMissing = 0
let totalExtra = 0

for (const [sid, fname] of Object.entries(SAMPLES)) {
  const xml = readFileSync(`${SAMPLES_DIR}/${fname}`, 'utf-8')
  const leaves = extractLeaves(xml).filter(l => {
    return !SKIP_TAGS.has(l.path.split('/').pop()!) &&
           !l.path.split('/').some(p => SKIP_ROOTS.has(p))
  })

  const scenario = byId[sid]
  const fo: Record<string, string> = scenario.fieldOverrides ?? {}
  const fao: Record<string, Record<string, string>> = scenario.fieldAttrOverrides ?? {}
  const groupTitles: string[] = scenario.groupTitles ?? []

  // Pre-build set of fieldIds available in active groups
  const activeGroupFields = new Set<string>()
  for (const title of groupTitles) {
    const grp = invoiceConfig.fieldGroups.find(g => g.title === title)
    if (!grp) continue
    const f: FieldDefinition[] = []
    flattenFields(grp, f)
    for (const fd of f) activeGroupFields.add(fd.fieldId)
  }

  // Collect leaves grouped by config-path-key, then by occurrence index per parent
  // Sample may have multiple instances of same path (PartyIdentification × N).
  // Track instance counters per (parent prefix + leaf tag).
  const sampleInstances: Record<string, Array<{ value: string; attrs: Record<string, string> }>> = {}
  for (const leaf of leaves) {
    const parts = leaf.path.split('/')
    const rootStripped = parts[0] === 'Invoice' || parts[0].endsWith(':Invoice') ? parts.slice(1) : parts
    const key = ['Invoice', ...rootStripped].join('/')
    if (!sampleInstances[key]) sampleInstances[key] = []
    sampleInstances[key].push({ value: leaf.value, attrs: leaf.attrs })
  }

  const missing: string[] = []
  const checkedKeys = new Set<string>()
  for (const leaf of leaves) {
    const parts = leaf.path.split('/')
    const rootStripped = parts[0] === 'Invoice' || parts[0].endsWith(':Invoice') ? parts.slice(1) : parts
    const key = ['Invoice', ...rootStripped].join('/')
    if (checkedKeys.has(key)) continue
    checkedKeys.add(key)

    const candidates = pathToFieldIds.get(key) ?? []
    if (candidates.length === 0) {
      missing.push(`UNMAPPED: ${key} = "${leaf.value}" attrs=${JSON.stringify(leaf.attrs)}`)
      continue
    }

    // Active candidate: first config field whose group is active
    const activeCandidate = candidates.find(c => activeGroupFields.has(c.fieldId)) ?? null
    if (!activeCandidate) {
      if (leaf.value) {
        missing.push(`NO_GROUP: ${key} = "${leaf.value}" (no active group covers this field)`)
      }
      continue
    }

    const fid = activeCandidate.fieldId
    const overrideRaw = fo[fid]
    const attrRaw = fao[fid]
    const sampleEntries = sampleInstances[key] ?? []

    // Normalize override to array of values
    const overrideValues: string[] = Array.isArray(overrideRaw)
      ? overrideRaw.map(v => String(v))
      : overrideRaw !== undefined ? [String(overrideRaw)] : []
    // Normalize attr to array
    const attrInstances: Array<Record<string, string>> = Array.isArray(attrRaw)
      ? attrRaw as Record<string, string>[]
      : attrRaw ? [attrRaw as Record<string, string>] : []

    // Compare each sample instance with override at same index
    for (let i = 0; i < sampleEntries.length; i++) {
      const sample = sampleEntries[i]
      const expectedVal = overrideValues[i]
      if (sample.value && expectedVal === undefined) {
        missing.push(`MISSING_INSTANCE[${i}]: ${fid} (${key}) — sample="${sample.value}", scenario instance ${i} undefined`)
      } else if (sample.value && expectedVal !== sample.value) {
        missing.push(`VALUE_MISMATCH[${i}]: ${fid} (${key}) — sample="${sample.value}", scenario="${expectedVal}"`)
      }
      // Check attrs for this instance
      for (const [attrName, attrVal] of Object.entries(sample.attrs)) {
        const overrideAttr = attrInstances[i]?.[attrName]
        const fieldDefault = activeCandidate.attrKey === attrName && Array.isArray(activeCandidate.options) && activeCandidate.options.length > 0
          ? activeCandidate.options[0].value
          : undefined
        const effective = overrideAttr ?? fieldDefault
        if (effective !== attrVal) {
          missing.push(`ATTR_MISMATCH[${i}]: ${fid} @${attrName} — sample="${attrVal}", effective=${effective ?? 'undefined'}`)
        }
      }
    }
  }

  // For each scenario fieldOverride, check it has corresponding sample leaf
  const sampleFieldIds = new Set<string>()
  for (const leaf of leaves) {
    const parts = leaf.path.split('/')
    const rootStripped = parts[0] === 'Invoice' || parts[0].endsWith(':Invoice') ? parts.slice(1) : parts
    const key = ['Invoice', ...rootStripped].join('/')
    const cands = pathToFieldIds.get(key) ?? []
    for (const c of cands) sampleFieldIds.add(c.fieldId)
  }

  const extra: string[] = []
  for (const fid of Object.keys(fo)) {
    if (!activeGroupFields.has(fid)) {
      extra.push(`ORPHAN_FIELD: ${fid} (in fieldOverrides but no active group covers it)`)
    } else if (!sampleFieldIds.has(fid)) {
      extra.push(`EXTRA_FIELD: ${fid}="${fo[fid]}" (in scenario, no corresponding leaf in sample)`)
    }
  }

  console.log(`\n=== ${sid} (${fname}) ===`)
  console.log(`  Sample leaves: ${leaves.length}, scenario fieldOverrides: ${Object.keys(fo).length}`)
  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✓ TAM EŞLEŞME`)
  } else {
    if (missing.length > 0) {
      console.log(`  ❌ MISSING/MISMATCH (${missing.length}):`)
      for (const m of missing.slice(0, 30)) console.log(`     ${m}`)
      if (missing.length > 30) console.log(`     ... +${missing.length - 30} more`)
      totalMissing += missing.length
    }
    if (extra.length > 0) {
      console.log(`  ⚠️  EXTRA (${extra.length}):`)
      for (const e of extra.slice(0, 30)) console.log(`     ${e}`)
      if (extra.length > 30) console.log(`     ... +${extra.length - 30} more`)
      totalExtra += extra.length
    }
  }
}

console.log(`\n${'='.repeat(70)}`)
console.log(`Toplam: ${totalMissing} missing/mismatch, ${totalExtra} extra`)

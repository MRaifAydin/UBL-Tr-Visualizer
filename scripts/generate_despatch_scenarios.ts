/**
 * Despatch (irsaliye) için sample XML'lerden scenarios.generated.json üretir.
 *
 * Çalıştır: npx tsx scripts/generate_despatch_scenarios.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { DOMParser } from '@xmldom/xmldom'
import { fieldGroups } from '../src/modules/despatch/config'
import type { FieldDefinition, FieldGroupConfig } from '../src/types'
import { isFieldDefinition } from '../src/types'

const SAMPLES_DIR = 'references/despatch/samples'
const OUT_PATH = 'src/modules/despatch/scenarios.generated.json'

interface ScenarioSpec {
  id: string
  label: string
  description: string
  sampleFile: string
  profileId: string
}

const SCENARIOS: ScenarioSpec[] = [
  {
    id: 'temelirsaliye-matbu',
    label: 'Temel İrsaliye - Matbu Fatura',
    description: 'Matbu fatura referansı taşıyan temel irsaliye örneği',
    sampleFile: 'Irsaliye-Matbudan.xml',
    profileId: 'TEMELIRSALIYE',
  },
  {
    id: 'temelirsaliye-katalog-kontrat',
    label: 'Temel İrsaliye - Katalog ve Kontrat Referanslı',
    description: 'Katalog ve kontrat döküman referanslarıyla zenginleştirilmiş sevk irsaliyesi',
    sampleFile: 'Irsaliye-Ornek1.xml',
    profileId: 'TEMELIRSALIYE',
  },
  {
    id: 'temelirsaliye-kismi-teslim',
    label: 'Temel İrsaliye - Kısmi Teslimat',
    description: 'Bekleyen miktar ve neden alanları içeren kısmi teslimat irsaliyesi',
    sampleFile: 'Irsaliye-Ornek2.xml',
    profileId: 'TEMELIRSALIYE',
  },
  {
    id: 'temelirsaliye-cok-taraf',
    label: 'Temel İrsaliye - Çok Taraflı',
    description: 'Asıl satıcı, asıl alıcı ve sevk eden müşteri tarafları içeren çok-taraflı irsaliye',
    sampleFile: 'Irsaliye-Ornek3.xml',
    profileId: 'TEMELIRSALIYE',
  },
]

function flattenAllFields(group: FieldGroupConfig, out: FieldDefinition[] = []): FieldDefinition[] {
  if (Array.isArray(group.fields)) {
    for (const f of group.fields) out.push(f)
  }
  if (Array.isArray(group.subgroups)) {
    for (const sg of group.subgroups) flattenAllFields(sg, out)
  }
  if (Array.isArray(group.items)) {
    for (const item of group.items) {
      if (isFieldDefinition(item)) out.push(item)
      else flattenAllFields(item, out)
    }
  }
  return out
}

function fieldsForTopGroup(group: FieldGroupConfig): FieldDefinition[] {
  return flattenAllFields(group)
}

const allFields: FieldDefinition[] = []
const fieldsByTopGroup = new Map<string, Set<string>>() // group title → fieldIds
for (const g of fieldGroups) {
  const fields = fieldsForTopGroup(g)
  const ids = new Set<string>()
  for (const f of fields) {
    allFields.push(f)
    ids.add(f.fieldId)
  }
  fieldsByTopGroup.set(g.title, ids)
}

const pathToFieldId = new Map<string, FieldDefinition>()
for (const f of allFields) {
  const key = f.path.join('/')
  if (!pathToFieldId.has(key)) pathToFieldId.set(key, f)
}

type Leaf = { path: string; value: string; attrs: Record<string, string> }

function extractLeaves(xml: string): Leaf[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const root = doc.documentElement
  const leaves: Leaf[] = []
  function walk(el: Element, path: string[]) {
    const tag = el.nodeName
    const newPath = [...path, tag]
    const children = Array.from(el.childNodes).filter(n => n.nodeType === 1) as Element[]
    const attrs: Record<string, string> = {}
    for (let i = 0; i < el.attributes.length; i++) {
      const a = el.attributes.item(i)!
      if (a.name.startsWith('xmlns') || a.name.startsWith('xsi:')) continue
      attrs[a.name] = a.value
    }
    if (children.length === 0) {
      const text = (el.textContent || '').trim()
      if (text || Object.keys(attrs).length) {
        leaves.push({ path: newPath.join('/'), value: text, attrs })
      }
    } else {
      for (const c of children) walk(c, newPath)
    }
  }
  walk(root, [])
  return leaves
}

const SKIP_PATH_TAGS = new Set(['cbc:UBLVersionID', 'cbc:CustomizationID'])
const SKIP_ROOT_PARTS = new Set(['ext:UBLExtensions'])

interface Scenario {
  id: string
  label: string
  description: string
  fieldOverrides: Record<string, string | string[]>
  fieldAttrOverrides: Record<string, Record<string, string> | Record<string, string>[]>
  groupTitles: string[]
  strictMode: true
}

const _meta = {
  generatedAt: new Date().toISOString().slice(0, 10),
  schematronFiles: ['UBL-TR_Common_Schematron.xml', 'UBL-TR_Main_Schematron.xml'],
  sampleFiles: SCENARIOS.map(s => s.sampleFile),
  unmappedPaths: new Set<string>(),
  skippedAsserts: [] as string[],
}

function buildScenario(spec: ScenarioSpec): Scenario {
  const xml = readFileSync(`${SAMPLES_DIR}/${spec.sampleFile}`, 'utf-8')
  const leaves = extractLeaves(xml).filter(l => {
    if (SKIP_PATH_TAGS.has(l.path.split('/').pop()!)) return false
    if (l.path.split('/').some(p => SKIP_ROOT_PARTS.has(p))) return false
    return true
  })

  // Group by canonical path key (root-stripped: convert "DespatchAdvice/..." → "DespatchAdvice/...")
  // Actually config paths START with 'DespatchAdvice' (see ROOT in config.ts), and sample root tag is 'DespatchAdvice'.
  // So extracted path == config path key directly.
  const sampleByPath: Record<string, Array<{ value: string; attrs: Record<string, string> }>> = {}
  for (const l of leaves) {
    if (!sampleByPath[l.path]) sampleByPath[l.path] = []
    sampleByPath[l.path].push({ value: l.value, attrs: l.attrs })
  }

  const fo: Record<string, string | string[]> = {}
  const fao: Record<string, Record<string, string> | Record<string, string>[]> = {}
  const usedFieldIds = new Set<string>()

  // ProfileID always explicit
  fo['desp-profile-id'] = spec.profileId
  usedFieldIds.add('desp-profile-id')

  for (const [path, instances] of Object.entries(sampleByPath)) {
    const field = pathToFieldId.get(path)
    if (!field) {
      _meta.unmappedPaths.add(path)
      continue
    }

    // Filter out instances with no value AND no useful attrs (empty <cbc:ID/> elements)
    const filtered = instances.filter(i => i.value || Object.keys(i.attrs).length > 0)
    if (filtered.length === 0) continue

    if (filtered.length === 1) {
      const inst = filtered[0]
      if (inst.value) fo[field.fieldId] = inst.value
      if (Object.keys(inst.attrs).length > 0) fao[field.fieldId] = inst.attrs
    } else {
      const values = filtered.map(i => i.value)
      const attrs = filtered.map(i => i.attrs)
      // Even if one value is empty, keep array shape so applyScenario builds N instances
      fo[field.fieldId] = values
      if (attrs.some(a => Object.keys(a).length > 0)) {
        fao[field.fieldId] = attrs
      }
    }
    usedFieldIds.add(field.fieldId)
  }

  // Determine active group titles: top-level groups whose any field appears in usedFieldIds.
  // Skip 'UBL Eklentileri' always.
  const groupTitles: string[] = []
  for (const g of fieldGroups) {
    if (g.title === 'UBL Eklentileri') continue
    const fieldsOfGroup = fieldsByTopGroup.get(g.title)!
    let hit = false
    for (const fid of fieldsOfGroup) {
      if (usedFieldIds.has(fid)) { hit = true; break }
    }
    if (hit) groupTitles.push(g.title)
  }

  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    fieldOverrides: fo,
    fieldAttrOverrides: fao,
    groupTitles,
    strictMode: true,
  }
}

const scenarios = SCENARIOS.map(buildScenario)

const output = {
  scenarios,
  _meta: {
    ..._meta,
    unmappedPaths: Array.from(_meta.unmappedPaths).sort(),
  },
}

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf-8')

console.log(`✓ ${scenarios.length} senaryo yazıldı: ${OUT_PATH}`)
console.log(`  unmappedPaths: ${output._meta.unmappedPaths.length}`)
for (const p of output._meta.unmappedPaths.slice(0, 30)) console.log(`    - ${p}`)
if (output._meta.unmappedPaths.length > 30) {
  console.log(`    ... +${output._meta.unmappedPaths.length - 30} more`)
}
for (const s of scenarios) {
  console.log(`  • ${s.id}: ${Object.keys(s.fieldOverrides).length} fieldOverrides, ${Object.keys(s.fieldAttrOverrides).length} fieldAttrOverrides, ${s.groupTitles.length} groups`)
}

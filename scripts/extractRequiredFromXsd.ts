/**
 * UBL-TR XSD'lerinden zorunlu element path'lerini çıkarır.
 *
 * Çalıştırma:
 *   npm run extract-required             # invoice (geriye dönük uyum)
 *   npm run extract-required:invoice
 *   npm run extract-required:despatch
 *   npm run extract-required:all
 *
 * Çıktı: src/modules/<modül>/required.generated.json
 *   {
 *     "requiredPaths": ["Invoice/cbc:ID", "Invoice/cac:AccountingSupplierParty", ...]
 *   }
 *
 * Bu dosya git'e commit edilir; diğer cihazlarda script çalıştırılmaz.
 * XSD güncellenirse manuel olarak yeniden çalıştırılır.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'

const __dirname = dirname(fileURLToPath(import.meta.url))

interface ModuleExtractConfig {
  xsdDir: string
  outputPath: string
  rootElement: string
  filePrefixMap: Record<string, string>
  excludePathPrefixes: string[]
}

const MODULE_CONFIGS: Record<string, ModuleExtractConfig> = {
  invoice: {
    xsdDir: resolve(__dirname, '../references/invoice/xsd'),
    outputPath: resolve(__dirname, '../src/modules/invoice/required.generated.json'),
    rootElement: 'Invoice',
    filePrefixMap: {
      'UBL-Invoice-2.1.xsd': '',
      'UBL-CommonAggregateComponents-2.1.xsd': 'cac:',
      'UBL-CommonBasicComponents-2.1.xsd': 'cbc:',
      'UBL-CommonExtensionComponents-2.1.xsd': 'ext:',
    },
    excludePathPrefixes: [
      'Invoice/cac:Signature',
      'Invoice/ext:UBLExtensions',
      'Invoice/cbc:UBLVersionID',
      'Invoice/cbc:CustomizationID',
    ],
  },
  // Modül adı 'despatch' (src/modules/despatch) — XSD dizini Türkçe (references/irsaliye)
  despatch: {
    xsdDir: resolve(__dirname, '../references/irsaliye/xsd'),
    outputPath: resolve(__dirname, '../src/modules/despatch/required.generated.json'),
    rootElement: 'DespatchAdvice',
    filePrefixMap: {
      'UBL-DespatchAdvice-2.1.xsd': '',
      'UBL-CommonAggregateComponents-2.1.xsd': 'cac:',
      'UBL-CommonBasicComponents-2.1.xsd': 'cbc:',
      'UBL-CommonExtensionComponents-2.1.xsd': 'ext:',
    },
    excludePathPrefixes: [
      'DespatchAdvice/cac:Signature',
      'DespatchAdvice/ext:UBLExtensions',
      'DespatchAdvice/cbc:UBLVersionID',
      'DespatchAdvice/cbc:CustomizationID',
    ],
  },
}

const MAX_DEPTH = 12

interface ChildRef {
  ref: string
  minOccurs: number
  inChoice: boolean
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  preserveOrder: true,
})

function isExcluded(path: string, excludePrefixes: string[]): boolean {
  return excludePrefixes.some(
    (prefix) => path === prefix || path.startsWith(prefix + '/'),
  )
}

function stripXsdPrefix(name: string): string {
  return name.replace(/^xsd:/, '')
}

function collectChildrenFromBlock(
  blockChildren: any[],
  prefix: string,
  inChoice: boolean,
): ChildRef[] {
  const out: ChildRef[] = []
  for (const child of blockChildren) {
    const tag = stripXsdPrefix(Object.keys(child).find((k) => k !== ':@') ?? '')
    const attrs = child[':@'] ?? {}
    const inner = child[tag] ?? child[`xsd:${tag}`] ?? []

    if (tag === 'element') {
      const ref: string | undefined = attrs['@_ref']
      const name: string | undefined = attrs['@_name']
      const minOccursAttr = attrs['@_minOccurs']
      const minOccurs = minOccursAttr === undefined ? 1 : parseInt(minOccursAttr, 10)

      let refName: string | undefined
      if (ref) {
        refName = ref.includes(':') ? ref : `${prefix}${ref}`
      } else if (name) {
        refName = `${prefix}${name}`
      }
      if (refName) {
        out.push({ ref: refName, minOccurs, inChoice })
      }
    } else if (tag === 'sequence') {
      out.push(...collectChildrenFromBlock(inner, prefix, inChoice))
    } else if (tag === 'choice') {
      const choiceMinOccurs =
        attrs['@_minOccurs'] === undefined ? 1 : parseInt(attrs['@_minOccurs'], 10)
      // Choice içindeki elemanlar: choice'un kendisi opsiyonelse hepsi opsiyonel,
      // zorunluysa "biri zorunlu" — hangisi belli olmadığı için hepsini opsiyonel say.
      const childInChoice = inChoice || choiceMinOccurs >= 1
      out.push(...collectChildrenFromBlock(inner, prefix, childInChoice))
    } else if (tag === 'group') {
      // xsd:group ref — derinlemesine takip etmiyoruz; UBL'de nadir
    } else if (tag === 'complexContent' || tag === 'extension' || tag === 'restriction') {
      out.push(...collectChildrenFromBlock(inner, prefix, inChoice))
    }
  }
  return out
}

function processSchemaTree(
  nodes: any[],
  prefix: string,
  elementToType: Map<string, string>,
  typeToChildren: Map<string, ChildRef[]>,
) {
  for (const node of nodes) {
    const tag = stripXsdPrefix(Object.keys(node).find((k) => k !== ':@') ?? '')
    const attrs = node[':@'] ?? {}
    const inner = node[tag] ?? node[`xsd:${tag}`] ?? []

    if (tag === 'element') {
      const name: string | undefined = attrs['@_name']
      if (!name) continue
      const fullName = `${prefix}${name}`
      const typeAttr: string | undefined = attrs['@_type']

      if (typeAttr) {
        const typeName = typeAttr.includes(':')
          ? typeAttr
          : `${prefix}${typeAttr}`
        elementToType.set(fullName, typeName)
      } else if (Array.isArray(inner)) {
        // Inline complexType
        for (const sub of inner) {
          const subTag = stripXsdPrefix(Object.keys(sub).find((k) => k !== ':@') ?? '')
          if (subTag === 'complexType') {
            const anonType = `__anon__${fullName}`
            elementToType.set(fullName, anonType)
            const subInner = sub[subTag] ?? sub[`xsd:${subTag}`] ?? []
            const children = collectChildrenFromBlock(subInner, prefix, false)
            typeToChildren.set(anonType, children)
          }
        }
      }
    } else if (tag === 'complexType') {
      const name: string | undefined = attrs['@_name']
      if (!name) continue
      const typeName = `${prefix}${name}`
      const children = collectChildrenFromBlock(inner, prefix, false)
      typeToChildren.set(typeName, children)
    }
  }
}

function loadXsd(
  filename: string,
  config: ModuleExtractConfig,
  elementToType: Map<string, string>,
  typeToChildren: Map<string, ChildRef[]>,
) {
  const filePath = resolve(config.xsdDir, filename)
  const xml = readFileSync(filePath, 'utf-8')
  const parsed = parser.parse(xml)
  const prefix = config.filePrefixMap[filename]
  if (prefix === undefined) {
    throw new Error(`Bilinmeyen XSD dosyası: ${filename}`)
  }
  // preserveOrder: top-level array → ilk eleman <?xml?>, sonra <xsd:schema> ...
  for (const top of parsed) {
    const tag = Object.keys(top).find((k) => k !== ':@')
    if (!tag) continue
    if (stripXsdPrefix(tag) === 'schema') {
      const schemaInner = top[tag]
      processSchemaTree(schemaInner, prefix, elementToType, typeToChildren)
    }
  }
}

function dfsRequired(
  rootElement: string,
  elementToType: Map<string, string>,
  typeToChildren: Map<string, ChildRef[]>,
): string[] {
  const required: string[] = []
  const visited = new Set<string>() // type bazlı cycle guard

  function walk(elementName: string, pathSoFar: string[], depth: number) {
    if (depth > MAX_DEPTH) return
    const fullPath = pathSoFar.join('/')
    if (fullPath) required.push(fullPath)

    const typeName = elementToType.get(elementName)
    if (!typeName) return
    const cycleKey = `${typeName}@${depth}`
    if (visited.has(cycleKey)) return
    visited.add(cycleKey)

    const children = typeToChildren.get(typeName) ?? []
    for (const child of children) {
      if (child.minOccurs < 1 || child.inChoice) continue
      walk(child.ref, [...pathSoFar, child.ref], depth + 1)
    }
    visited.delete(cycleKey)
  }

  walk(rootElement, [rootElement], 0)
  return required
}

function runExtraction(config: ModuleExtractConfig, key: string) {
  const elementToType = new Map<string, string>()
  const typeToChildren = new Map<string, ChildRef[]>()

  for (const filename of Object.keys(config.filePrefixMap)) {
    loadXsd(filename, config, elementToType, typeToChildren)
  }

  console.log(`[${key}] Toplam element tanımı: ${elementToType.size}`)
  console.log(`[${key}] Toplam tip tanımı: ${typeToChildren.size}`)

  const required = dfsRequired(config.rootElement, elementToType, typeToChildren)
  // Ana root'u (tek segment) atla — alan path'i en az 2 segment olur
  const filtered = required.filter(
    (p) => p.includes('/') && !isExcluded(p, config.excludePathPrefixes),
  )
  const unique = Array.from(new Set(filtered)).sort()

  const output = { requiredPaths: unique }
  writeFileSync(config.outputPath, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  console.log(`Yazıldı (${key}): ${config.outputPath}`)
  console.log(`[${key}] Toplam zorunlu path: ${unique.length}`)
  console.log(`[${key}] Örnek path'ler:`)
  unique.slice(0, 10).forEach((p) => console.log(`  - ${p}`))
}

function main() {
  const arg = process.argv[2] ?? 'invoice'

  let targets: string[]
  if (arg === 'all') {
    targets = Object.keys(MODULE_CONFIGS)
  } else if (MODULE_CONFIGS[arg]) {
    targets = [arg]
  } else {
    console.error(`Bilinmeyen modül: ${arg}`)
    console.error(
      `Geçerli modüller: ${Object.keys(MODULE_CONFIGS).join(', ')}, all`,
    )
    process.exit(1)
  }

  for (const key of targets) {
    runExtraction(MODULE_CONFIGS[key], key)
  }
}

main()

import { useMemo, useRef, useState } from 'react'
import { useDocument } from '../context/DocumentContext'
import { treeToXml } from '../core/xmlSerializer'
import { parseXmlToTree } from '../core/xmlParser'
import { applyFieldUpdate } from '../core/treeManager'
import FieldForm from '../components/FieldForm'
import XMLNode from '../components/XMLNode'
import DefaultsModal from '../components/DefaultsModal'
import FillModeChooserModal from '../components/FillModeChooserModal'
import ScenarioListModal from '../components/ScenarioListModal'
import type {
  FieldAttr,
  FieldDefinition,
  FieldGroupConfig,
  GroupItem,
  ModuleConfig,
  Tree,
} from '../types'
import { isFieldDefinition } from '../types'
import type { FillScenario, GroupDefaults } from '../modules/invoice/defaults'
import { autoFieldDefault } from '../modules/invoice/defaults'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function downloadXml(tree: Tree, config: ModuleConfig, docType: string) {
  const xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
  if (!xml) return

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${docType}_${date}.xml`
  a.click()
  URL.revokeObjectURL(url)
}

function scrollToFieldId(fieldId: string) {
  // Açılması gereken kapalı gruplar için iki frame bekle (FieldGroup auto-expand sonrası DOM hazır olur)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-field-id="${CSS.escape(fieldId)}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  })
}

interface DocumentPageLayoutProps {
  title: string
  /** Field-level override haritaları (override katmanı). Eksik field'lar autoFieldDefault ile dolar. */
  groupDefaults?: GroupDefaults[]
  /** "Tümünü Doldur" listesinde gösterilmeyecek üst-seviye grup başlıkları (teknik bloklar). */
  excludedGroups?: string[]
  fillScenarios?: FillScenario[]
}

/**
 * Senaryo doldurma için hazırlanmış field. `field` tree'ye yazılırken
 * kullanılacak hâlidir (path'te `marker#0`, fieldId'de marker sayısı kadar
 * `--0` suffix). `originalFieldId` ise override haritalarında lookup için
 * orijinal fieldId'dir.
 *
 * Suffix gerekçesi: `RepeatableFieldGroup` runtime'da input'ların fieldId'sine
 * her geçtiği repeatable için bir `--idx` ekliyor (rewriteField). Input değeri
 * `findNodeById(tree, suffix'li fieldId)` ile aranıyor — tree'ye orijinal
 * fieldId ile yazarsak input boş kalır.
 */
interface PreparedField {
  field: FieldDefinition
  originalFieldId: string
}

function collectGroupFields(
  group: FieldGroupConfig,
  activeMarkers: string[] = [],
): PreparedField[] {
  const markers =
    group.repeatable && group.instanceMarker
      ? [...activeMarkers, group.instanceMarker]
      : activeMarkers

  const markerSet = new Set(markers)
  const suffix = '--0'.repeat(markers.length)
  const out: PreparedField[] = []

  function pushField(field: FieldDefinition) {
    if (markers.length === 0) {
      out.push({ field, originalFieldId: field.fieldId })
      return
    }
    const newPath = field.path.map((seg) => (markerSet.has(seg) ? `${seg}#0` : seg))
    out.push({
      field: { ...field, path: newPath, fieldId: field.fieldId + suffix },
      originalFieldId: field.fieldId,
    })
  }

  function walkItems(items: GroupItem[]) {
    for (const item of items) {
      if (isFieldDefinition(item)) pushField(item)
      else out.push(...collectGroupFields(item, markers))
    }
  }

  if (group.fields) {
    for (const f of group.fields) pushField(f)
  }
  if (group.subgroups) {
    for (const sub of group.subgroups) {
      out.push(...collectGroupFields(sub, markers))
    }
  }
  if (group.items) walkItems(group.items)

  return out
}

export default function DocumentPageLayout({
  title,
  groupDefaults,
  excludedGroups,
  fillScenarios,
}: DocumentPageLayoutProps) {
  const {
    docType,
    tree,
    config,
    activeFieldId,
    setActiveFieldId,
    safeMode,
    toggleSafeMode,
    validationErrors,
    validateRequired,
    loadTree,
    loadCounter,
    extraOptions,
  } = useDocument()
  const [activeScenario, setActiveScenario] = useState<FillScenario | null>(null)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [scenarioListOpen, setScenarioListOpen] = useState(false)
  const [filling, setFilling] = useState(false)
  const treeRef = useRef(tree)
  treeRef.current = tree

  // Modal listesinde gösterilecek başlıklar: tüm config grupları, excluded hariç.
  const availableGroupTitles = useMemo(
    () =>
      config.fieldGroups
        .map((g) => g.title)
        .filter((t) => !excludedGroups?.includes(t)),
    [config, excludedGroups],
  )
  const [collapseSignal, setCollapseSignal] = useState(0)
  const [unknownPaths, setUnknownPaths] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const rootNodes = tree.children ? Object.values(tree.children) : []
  const hasRoot = rootNodes.length > 0
  const hasContent = hasRoot && Object.keys(rootNodes[0]?.children || {}).length > 0

  function handleDownload() {
    if (safeMode) {
      const errors = validateRequired()
      if (errors.length > 0) {
        scrollToFieldId(errors[0].fieldId)
        return
      }
    }
    downloadXml(tree, config, docType)
  }

  async function handleUpload(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      window.alert('Dosya çok büyük. En fazla 5 MB boyutunda bir XML yükleyebilirsiniz.')
      return
    }
    if (hasContent) {
      const ok = window.confirm(
        'Mevcut form verileri yüklenen XML ile değiştirilecek. Devam edilsin mi?',
      )
      if (!ok) return
    }
    let xmlString: string
    try {
      xmlString = await file.text()
    } catch {
      window.alert('Dosya okunamadı.')
      return
    }
    try {
      const result = parseXmlToTree(xmlString, config)
      loadTree(result.tree, result.extraOptions)
      setUnknownPaths(result.unknownPaths)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`XML yüklenemedi: ${message}`)
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click()
  }

  function readValueAtPath(path: string[], fieldId: string): string {
    let node = treeRef.current as { children?: Record<string, { value?: string; children?: Record<string, unknown> }> } | undefined
    for (let i = 0; i < path.length; i++) {
      const segment = path[i]
      const isLeaf = i === path.length - 1
      const children = node?.children
      if (!children) return ''
      const key = isLeaf ? `${segment}__${fieldId}` : segment
      node = children[key] as typeof node
      if (!node) return ''
    }
    return (node as { value?: string } | undefined)?.value ?? ''
  }

  /**
   * Senaryoyu tek bir tree klonu üzerinde sıralı `applyFieldUpdate` çağrılarıyla
   * uygular ve sonunda `loadTree` ile atomik olarak commit'ler. Bu sayede her
   * field için ayrı `structuredClone` + setState yapılmaz (O(N²) → O(N)).
   */
  function applyScenario(
    scenario: FillScenario,
    selectedTitles: string[],
    overwrite: boolean,
  ) {
    const workingTree: Tree = structuredClone(treeRef.current)

    for (const title of selectedTitles) {
      const groupDefault = groupDefaults?.find((g) => g.groupTitle === title)
      const groupConfig = config.fieldGroups.find((g) => g.title === title)
      if (!groupConfig) continue

      const prepared = collectGroupFields(groupConfig)
      const topGroupIdx = config.fieldGroups.findIndex((g) => g.title === title)
      // RepeatableFieldGroup ile aynı _order taban hesabı: top-level group index'i × 1000.
      // Yer bulunamazsa diziden sonraya at (groups.length × 1000).
      const anchorOrder =
        (topGroupIdx >= 0 ? topGroupIdx : config.fieldGroups.length) * 1000

      prepared.forEach(({ field, originalFieldId }, idx) => {
        // requiredOnly senaryolarda yalnızca XSD'ye göre zorunlu alanlar yazılır.
        if (scenario.requiredOnly && !field.required) return

        // Override haritalarında orijinal fieldId ile lookup; auto fallback.
        const entry =
          scenario.fieldOverrides?.[originalFieldId] ??
          groupDefault?.values[originalFieldId]

        const value =
          entry !== undefined
            ? typeof entry === 'function'
              ? entry()
              : entry
            : autoFieldDefault(field)

        if (value === '') return // disabled field veya hesaplanamadı
        if (!overwrite && readValueAtPath(field.path, field.fieldId) !== '') return

        // _order: doğal fieldDefinitions index'i varsa onu kullan; repeatable
        // içindeki field'lar fieldDefinitions'ta olmadığı için anchor + offset.
        const naturalIdx = config.fieldDefinitions.findIndex(
          (f) => f.fieldId === originalFieldId,
        )
        const order = naturalIdx >= 0 ? naturalIdx : anchorOrder + idx * 0.0001

        // duration-measure: amount + unit attribute; field.attr config'de 'value'
        // diye gözükse de runtime'da unit'i attr olarak yazmak gerek (FieldForm
        // de aynısını yapıyor). İlk option default unit olur.
        let attr: FieldAttr = field.attr
        if (
          field.type === 'duration-measure' &&
          field.attrKey &&
          field.options?.[0]
        ) {
          attr = { [field.attrKey]: field.options[0].value }
        }

        // Tree'ye render-tarafı (suffix'li) fieldId ile yaz — input bu fieldId
        // üzerinden findNodeById yaptığı için aksi halde değer ekrana basılmaz.
        applyFieldUpdate(workingTree, field.fieldId, field.path, value, attr, order)
      })
    }

    loadTree(workingTree, extraOptions)
  }

  /**
   * Onayla → modal'ı hemen kapat, tam ekran yükleme overlay'ini aç, bir frame
   * bekleyerek React'e overlay'i çizmesi için fırsat ver, sonra senaryoyu
   * uygula. Spinner kapanır.
   */
  async function handleConfirmFill(titles: string[], overwrite: boolean) {
    const scenario = activeScenario
    if (!scenario) return
    setActiveScenario(null)
    setFilling(true)
    // İki rAF: ilki overlay'in DOM'a basılması, ikincisi paint sonrası.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    try {
      applyScenario(scenario, titles, overwrite)
    } finally {
      setFilling(false)
    }
  }

  function runScenario(scenario: FillScenario) {
    if (scenario.promptUser) {
      // promptUser olan tek tip artık 'manual' (Kendim Seçeceğim) — DefaultsModal aç.
      // 'scenario' kind, ScenarioListModal'dan zaten doğrudan handleScenarioSelect ile uygulanır.
      setActiveScenario(scenario)
      return
    }
    // Sabit senaryo: kendi groupTitles'ı varsa onları, yoksa tüm available'ı kullan.
    const titles = scenario.groupTitles ?? availableGroupTitles
    void (async () => {
      setFilling(true)
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
      try {
        applyScenario(scenario, titles, false)
      } finally {
        setFilling(false)
      }
    })()
  }

  function getAvailableTitlesFor(scenario: FillScenario): string[] {
    if (!scenario.groupTitles) return availableGroupTitles
    return availableGroupTitles.filter((t) => scenario.groupTitles!.includes(t))
  }

  // Ara ekrandan "Senaryolar" seçilince listeye geç.
  function handlePickScenarios() {
    setChooserOpen(false)
    setScenarioListOpen(true)
  }

  // Ara ekrandan "Kendim Seçeceğim" seçilince mevcut DefaultsModal akışını başlat.
  function handlePickManual() {
    setChooserOpen(false)
    if (manualScenario) runScenario(manualScenario)
  }

  // Senaryo kartına tıklanınca doğrudan uygula — ek onay ekranı yok.
  async function handleScenarioSelect(scenario: FillScenario, overwrite: boolean) {
    setScenarioListOpen(false)
    setFilling(true)
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    try {
      applyScenario(scenario, getAvailableTitlesFor(scenario), overwrite)
    } finally {
      setFilling(false)
    }
  }

  // Ara ekran açılırken "Kendim Seçeceğim"i tetikleyecek manual senaryo.
  const manualScenario =
    fillScenarios?.find((s) => s.kind === 'manual' && s.promptUser) ?? null
  // Senaryolar listesinde gösterilecek kayıtlar.
  const scenarioList = fillScenarios?.filter((s) => s.kind === 'scenario') ?? []
  // "Varsayılanları Doldur" butonu — en az bir interaktif senaryo varsa görünür.
  const showFillButton = !!groupDefaults && (manualScenario !== null || scenarioList.length > 0)

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">

      <aside
        className="flex-1 min-w-0 flex flex-col bg-white border-r border-gray-200"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== 'INPUT') setActiveFieldId(null)
        }}
      >
        <div className="px-5 h-[53px] border-b border-gray-200 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <button
              type="button"
              onClick={toggleSafeMode}
              title="Güvenli Mod — zorunlu alanları XSD'ye göre doğrular"
              className="flex items-center gap-1.5 group"
            >
              <span
                className={`relative w-8 h-4 rounded-full transition-colors ${
                  safeMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${
                    safeMode ? 'left-4' : 'left-0.5'
                  }`}
                />
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  safeMode ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              >
                Güvenli Mod
              </span>
            </button>
            {safeMode && validationErrors.length > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700 border border-red-200">
                {validationErrors.length} eksik alan
              </span>
            )}
          </div>
          {showFillButton && (
            <button
              onClick={() => setChooserOpen(true)}
              title="Form alanlarını örnek değerlerle doldurur"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
              </svg>
              Varsayılanları Doldur
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <FieldForm key={loadCounter} />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-5 h-[53px] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              XML Önizleme
              {hasRoot && (
                <span className="ml-2 font-normal text-gray-400">
                  — {rootNodes[0].tag}
                </span>
              )}
            </span>
            {hasContent && (
              <button
                onClick={() => {
                  setCollapseSignal((n) => n + 1)
                  setActiveFieldId(null)
                  ;(document.activeElement as HTMLElement | null)?.blur()
                }}
                title="Alt grupları kapat"
                className="flex items-center justify-center w-5 h-5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M14.707 17.707a1 1 0 01-1.414 0L10 14.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,application/xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUpload(file)
                }
                e.target.value = ''
              }}
            />
            <button
              onClick={triggerFileSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-green-600 text-white hover:bg-green-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm10.707-7.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V17a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              XML Yükle
            </button>
            <button
              onClick={handleDownload}
              disabled={!hasContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-blue-600 text-white hover:bg-blue-700
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              XML İndir
            </button>
          </div>
        </header>

        {unknownPaths.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium mb-0.5">
                Yüklenen XML'de tanınmayan {unknownPaths.length} öğe atlandı:
              </p>
              <p className="font-mono text-[11px] text-amber-700 break-all">
                {unknownPaths.join(', ')}
              </p>
            </div>
            <button
              onClick={() => setUnknownPaths([])}
              title="Kapat"
              className="shrink-0 text-amber-600 hover:text-amber-900 leading-none px-1"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {!hasRoot ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">
                Form alanlarını doldurduğunuzda XML ağacı burada görünür.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4 font-mono text-sm">
              {rootNodes.map((node) => (
                <XMLNode key={node.tag} node={node} activeFieldId={activeFieldId} collapseSignal={collapseSignal} />
              ))}
              {!hasContent && (
                <p className="text-gray-400 text-xs mt-3 pl-5">
                  Form alanlarını doldurduğunuzda XML ağacı burada görünür.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <FillModeChooserModal
        open={chooserOpen}
        onCancel={() => setChooserOpen(false)}
        onPickScenarios={handlePickScenarios}
        onPickManual={handlePickManual}
      />

      <ScenarioListModal
        open={scenarioListOpen}
        scenarios={scenarioList}
        onCancel={() => setScenarioListOpen(false)}
        onSelect={(scenario, overwrite) => {
          void handleScenarioSelect(scenario, overwrite)
        }}
      />

      <DefaultsModal
        open={activeScenario !== null}
        scenario={activeScenario}
        availableGroupTitles={activeScenario ? getAvailableTitlesFor(activeScenario) : []}
        onCancel={() => setActiveScenario(null)}
        onConfirm={(titles, overwrite) => {
          void handleConfirmFill(titles, overwrite)
        }}
      />

      {filling && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center"
          // pointer event'leri yutulur — ana sayfa bloklanır
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-busy="true"
          role="alert"
        >
          <div className="bg-white rounded-lg shadow-2xl px-6 py-5 flex items-center gap-3">
            <svg
              className="animate-spin w-5 h-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="text-sm text-gray-700">Form alanları dolduruluyor…</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDocument } from '../context/DocumentContext'
import { treeToXml } from '../core/xmlSerializer'
import { parseXmlToTree } from '../core/xmlParser'
import { applyFieldUpdate, findNodeById } from '../core/treeManager'
import CheckIcon from '../components/CheckIcon'
import {
  findUniqueName,
  listExistingNames,
  saveHistoryEntry,
  type HistoryEntry,
  listXslts,
  getXsltEntry,
  deleteXsltEntry,
  findUniqueXsltName,
  listExistingXsltNames,
  saveXsltEntry,
  MAX_CUSTOM_XSLTS_PER_DOCTYPE,
  type XsltEntry,
} from '../core/historyDb'
import { extractEmbeddedXslts, hasEmbeddedXslt, type ExtractedXslt } from '../core/xsltExtractor'
import { injectXsltIntoXml } from '../core/xsltInjector'
import { generateHistoryName } from '../core/historyName'
import FieldForm from '../components/FieldForm'
import XMLNode from '../components/XMLNode'
import DefaultsModal from '../components/DefaultsModal'
import FillModeChooserModal from '../components/FillModeChooserModal'
import ScenarioListModal from '../components/ScenarioListModal'
import SaveHistoryModal from '../components/SaveHistoryModal'
import HistoryModal from '../components/HistoryModal'
import PreviewModal from '../components/PreviewModal'
import XsltListModal, { type SelectedXslt } from '../components/XsltListModal'
import SaveXsltModal from '../components/SaveXsltModal'
import { transformXmlWithXslt, loadXsltFromUrl } from '../core/xsltTransform'
import type {
  FieldAttr,
  FieldDefinition,
  FieldGroupConfig,
  GroupItem,
  Tree,
} from '../types'
import { isFieldDefinition } from '../types'
import type { FillScenario, GroupDefaults } from '../modules/invoice/defaults'
import { autoFieldDefault } from '../modules/invoice/defaults'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function triggerXmlDownload(xml: string, docType: string) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const blob = new Blob([xml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${docType}_${date}.xml`
  a.click()
  URL.revokeObjectURL(url)
}

function readInvoiceMetaFromXml(xml: string): { id: string; issueDate: string } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const root = doc.documentElement
  let id = ''
  let issueDate = ''
  if (root) {
    for (const child of Array.from(root.children)) {
      if (!id && child.localName === 'ID') id = (child.textContent || '').trim()
      if (!issueDate && child.localName === 'IssueDate') issueDate = (child.textContent || '').trim()
      if (id && issueDate) break
    }
  }
  return { id, issueDate }
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
    loadedFieldIds,
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

  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveModalDefaultName, setSaveModalDefaultName] = useState('')
  const [saveModalExistingNames, setSaveModalExistingNames] = useState<Set<string>>(new Set())
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [selectedXslt, setSelectedXslt] = useState<SelectedXslt>({ kind: 'default' })
  const [originalEmbeddedXslt, setOriginalEmbeddedXslt] = useState<string | null>(null)
  const [xsltListOpen, setXsltListOpen] = useState(false)
  const [customXslts, setCustomXslts] = useState<XsltEntry[]>([])
  const [pendingXslts, setPendingXslts] = useState<ExtractedXslt[]>([])
  const [savingXsltDefaultName, setSavingXsltDefaultName] = useState('')
  const [savingXsltExistingNames, setSavingXsltExistingNames] = useState<Set<string>>(new Set())
  const [xsltLimitBanner, setXsltLimitBanner] = useState<string | null>(null)

  // Modül başına seçili XSLT'yi localStorage'da hatırla
  useEffect(() => {
    const raw = localStorage.getItem(`xslt:selected:${docType}`)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SelectedXslt
        setSelectedXslt(parsed)
        return
      } catch {
        /* ignore */
      }
    }
    setSelectedXslt({ kind: 'default' })
  }, [docType])

  useEffect(() => {
    localStorage.setItem(`xslt:selected:${docType}`, JSON.stringify(selectedXslt))
  }, [docType, selectedXslt])

  useEffect(() => {
    if (!xsltLimitBanner) return
    const t = setTimeout(() => setXsltLimitBanner(null), 4000)
    return () => clearTimeout(t)
  }, [xsltLimitBanner])

  async function refreshCustomXslts(): Promise<XsltEntry[]> {
    const list = await listXslts(docType)
    setCustomXslts(list)
    return list
  }

  /** Seçili XSLT'nin metnini döndür. Custom silinmişse default'a düşer. */
  async function loadSelectedXsltText(): Promise<string | null> {
    if (selectedXslt.kind === 'custom') {
      const entry = await getXsltEntry(selectedXslt.id)
      if (entry) return entry.xsltText
      setSelectedXslt({ kind: 'default' })
    }
    if (!config.xsltPath) return null
    return loadXsltFromUrl(config.xsltPath)
  }

  /** Yüklenen XML'den XSLT'leri çıkartıp DB'de olmayanları kuyruğa ekle. */
  async function queuePendingXsltsFromXml(xmlString: string) {
    const extracted = extractEmbeddedXslts(xmlString)
    setOriginalEmbeddedXslt(extracted[0]?.xsltText ?? null)
    if (extracted.length === 0) return
    const existing = await listXslts(docType)
    const existingTexts = new Set(existing.map((e) => e.xsltText))
    const newOnes = extracted.filter((e) => !existingTexts.has(e.xsltText))
    if (newOnes.length === 0) return
    setPendingXslts(newOnes)
    void prepareSaveModalForFirst(newOnes[0])
  }

  async function prepareSaveModalForFirst(item: ExtractedXslt) {
    const baseFromFilename = item.filename
      ? item.filename.replace(/\.[^.]+$/, '')
      : `xslt_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
    const [unique, existing] = await Promise.all([
      findUniqueXsltName(docType, baseFromFilename),
      listExistingXsltNames(docType),
    ])
    setSavingXsltDefaultName(unique)
    setSavingXsltExistingNames(existing)
  }

  useEffect(() => {
    if (!savedBanner) return
    const t = setTimeout(() => setSavedBanner(null), 2000)
    return () => clearTimeout(t)
  }, [savedBanner])

  const rootNodes = tree.children ? Object.values(tree.children) : []
  const hasRoot = rootNodes.length > 0
  const hasContent = hasRoot && Object.keys(rootNodes[0]?.children || {}).length > 0

  const loadedTotal = useMemo(() => {
    let n = 0
    for (const id of loadedFieldIds) {
      if ((findNodeById(tree, id)?.value ?? '') !== '') n += 1
    }
    return n
  }, [loadedFieldIds, tree])

  function handleDownload() {
    if (safeMode) {
      const errors = validateRequired()
      if (errors.length > 0) {
        scrollToFieldId(errors[0].fieldId)
        return
      }
    }
    void (async () => {
      let xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
      if (!xml) return
      // Yüklenen XML'in XSLT'si varsa elleme (kullanıcı kuralı), aksi halde seçili XSLT'yi inject et.
      const xsltToEmbed = originalEmbeddedXslt ?? (await loadSelectedXsltText())
      if (xsltToEmbed && !hasEmbeddedXslt(xml)) {
        const meta = readInvoiceMetaFromXml(xml)
        const fallbackId = meta.id || `${docType}_${Date.now()}`
        const fallbackDate = meta.issueDate || new Date().toISOString().slice(0, 10)
        xml = injectXsltIntoXml(xml, xsltToEmbed, fallbackId, fallbackDate, config.rootTag)
      }
      triggerXmlDownload(xml, docType)
    })()
  }

  async function handlePreview() {
    const xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
    if (!xml) return
    setPreviewError(null)
    setPreviewHtml('')
    setPreviewOpen(true)
    try {
      const xsltText = originalEmbeddedXslt ?? (await loadSelectedXsltText())
      if (!xsltText) throw new Error('Aktif XSLT bulunamadı')
      const html = transformXmlWithXslt(xml, xsltText)
      setPreviewHtml(html)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Önizleme oluşturulamadı')
    }
  }

  function downloadHtmlPreview() {
    if (!previewHtml) return
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType}_onizleme_${date}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPdfPreview() {
    if (!previewHtml) return
    // Gizli iframe + window.print() — tarayıcının native "PDF olarak kaydet" özelliği.
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    iframe.srcdoc = previewHtml
    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe)
      }, 1000)
    }
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
      void queuePendingXsltsFromXml(xmlString)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`XML yüklenemedi: ${message}`)
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click()
  }

  async function handleOpenSaveModal() {
    const xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
    if (!xml) return
    const baseName = generateHistoryName(tree, config.rootTag)
    try {
      const [unique, existing] = await Promise.all([
        findUniqueName(docType, baseName),
        listExistingNames(docType),
      ])
      setSaveModalDefaultName(unique)
      setSaveModalExistingNames(existing)
      setSaveModalOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`Geçmiş okunamadı: ${message}`)
    }
  }

  async function handleOpenXsltList() {
    await refreshCustomXslts()
    setXsltListOpen(true)
  }

  function handleSelectXslt(sel: SelectedXslt) {
    setSelectedXslt(sel)
    setXsltListOpen(false)
  }

  async function handleDeleteXslt(id: number, name: string) {
    const ok = window.confirm(`"${name}" XSLT'si silinsin mi?`)
    if (!ok) return
    await deleteXsltEntry(id)
    if (selectedXslt.kind === 'custom' && selectedXslt.id === id) {
      setSelectedXslt({ kind: 'default' })
    }
    await refreshCustomXslts()
  }

  async function handleSaveXsltConfirm(name: string) {
    const item = pendingXslts[0]
    if (!item) return
    try {
      const result = await saveXsltEntry({
        docType,
        name,
        xsltText: item.xsltText,
        createdAt: Date.now(),
      })
      if (result.removedOldestId !== null) {
        setXsltLimitBanner(
          `${MAX_CUSTOM_XSLTS_PER_DOCTYPE} özel XSLT sınırı aşıldı, en eski kayıt silindi.`,
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`XSLT kaydedilemedi: ${message}`)
    }
    await advancePendingXsltQueue()
  }

  async function handleSaveXsltSkip() {
    await advancePendingXsltQueue()
  }

  async function advancePendingXsltQueue() {
    setPendingXslts((prev) => {
      const next = prev.slice(1)
      if (next.length > 0) void prepareSaveModalForFirst(next[0])
      return next
    })
  }

  async function handleConfirmSave(name: string) {
    const xml = treeToXml(tree, config.rootTag, config.rootAttributes, config.rootStaticPrefix)
    if (!xml) {
      setSaveModalOpen(false)
      return
    }
    try {
      await saveHistoryEntry({
        docType,
        name,
        xml,
        createdAt: Date.now(),
      })
      setSaveModalOpen(false)
      setSavedBanner(name)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`Geçmişe kaydedilemedi: ${message}`)
    }
  }

  async function handleOpenHistoryEntry(entry: HistoryEntry) {
    if (hasContent) {
      const ok = window.confirm(
        'Mevcut form verileri seçilen kayıt ile değiştirilecek. Devam edilsin mi?',
      )
      if (!ok) return
    }
    setHistoryModalOpen(false)
    setFilling(true)
    // İki rAF: overlay'in DOM'a basılması için handleConfirmFill ile aynı pattern.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    try {
      const result = parseXmlToTree(entry.xml, config)
      loadTree(result.tree, result.extraOptions)
      setUnknownPaths(result.unknownPaths)
      void queuePendingXsltsFromXml(entry.xml)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.'
      window.alert(`Belge yüklenemedi: ${message}`)
    } finally {
      setFilling(false)
    }
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
            {loadedTotal > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                {loadedTotal} XML'den geldi
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryModalOpen(true)}
              title="Tarayıcıda kayıtlı belgeleri aç"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .2.08.39.22.53l3 3a.75.75 0 101.06-1.06L10.75 9.69V5z" clipRule="evenodd" />
              </svg>
              Geçmiş
            </button>
            <button
              onClick={() => void handleOpenXsltList()}
              title="XSLT Listesi (kayıtlı + default)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
              XSLT Listesi
            </button>
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
              onClick={() => void handleOpenSaveModal()}
              disabled={!hasContent}
              title="Mevcut belgeyi tarayıcı geçmişine kaydet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-amber-500 text-white hover:bg-amber-600
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3-5 3V4z" />
              </svg>
              Geçmişe Kaydet
            </button>
            <button
              onClick={() => void handlePreview()}
              disabled={!hasContent || (!config.xsltPath && selectedXslt.kind === 'default')}
              title={
                !config.xsltPath && selectedXslt.kind === 'default'
                  ? 'Bu modül için default XSLT tanımlı değil'
                  : 'Seçili XSLT ile önizle'
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors
                bg-purple-600 text-white hover:bg-purple-700
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Önizle
            </button>
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

        {savedBanner && (
          <div className="bg-green-50 border-b border-green-200 px-5 py-2 text-xs text-green-800 flex items-center justify-between gap-3">
            <p>
              <span className="font-medium">"{savedBanner}"</span> geçmişe kaydedildi.
            </p>
            <button
              onClick={() => setSavedBanner(null)}
              title="Kapat"
              className="shrink-0 text-green-600 hover:text-green-900 leading-none px-1"
            >
              ✕
            </button>
          </div>
        )}

        {xsltLimitBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-xs text-amber-800 flex items-center justify-between gap-3">
            <p>{xsltLimitBanner}</p>
            <button
              onClick={() => setXsltLimitBanner(null)}
              title="Kapat"
              className="shrink-0 text-amber-600 hover:text-amber-900 leading-none px-1"
            >
              ✕
            </button>
          </div>
        )}

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

      <PreviewModal
        open={previewOpen}
        htmlContent={previewHtml}
        error={previewError}
        onClose={() => setPreviewOpen(false)}
        onDownloadHtml={downloadHtmlPreview}
        onDownloadPdf={downloadPdfPreview}
      />

      <XsltListModal
        open={xsltListOpen}
        hasDefault={!!config.xsltPath}
        customXslts={customXslts}
        selectedXslt={selectedXslt}
        onSelect={handleSelectXslt}
        onDelete={(id, name) => void handleDeleteXslt(id, name)}
        onClose={() => setXsltListOpen(false)}
      />

      <SaveXsltModal
        open={pendingXslts.length > 0}
        defaultName={savingXsltDefaultName}
        existingNames={savingXsltExistingNames}
        remainingCount={pendingXslts.length}
        onSkip={() => void handleSaveXsltSkip()}
        onConfirm={(name) => void handleSaveXsltConfirm(name)}
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

      <SaveHistoryModal
        open={saveModalOpen}
        defaultName={saveModalDefaultName}
        existingNames={saveModalExistingNames}
        onCancel={() => setSaveModalOpen(false)}
        onConfirm={(name) => {
          void handleConfirmSave(name)
        }}
      />

      <HistoryModal
        open={historyModalOpen}
        docType={docType}
        onCancel={() => setHistoryModalOpen(false)}
        onOpen={(entry) => {
          void handleOpenHistoryEntry(entry)
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

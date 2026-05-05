/**
 * Form alanları için varsayılan değerleri ve doldurma senaryolarını tanımlar.
 *
 * - `GroupDefaults`: bir grubun fieldId -> default eşlemesi (override katmanı).
 * - `autoFieldDefault`: override yoksa field'ın tipine göre üretilen jenerik değer.
 *   Bu sayede grup seçildiğinde içindeki TÜM alanlar doldurulur — sadece
 *   `GroupDefaults.values`'ta listelenenler değil.
 * - `FillScenario`: bir doldurma davranışı (hangi gruplar, etkileşimli mi, override var mı).
 *   `promptUser: true` → kullanıcıya modal'da grup seçtirir (bkz. "Tümünü Doldur").
 *   `promptUser: false` → modal açmadan doğrudan uygular (ileride YTB gibi senaryolar için).
 */
import type { FieldDefinition } from '../../types'
import scenariosData from './scenarios.generated.json'

export type FieldDefaultValue = string | (() => string)

export interface GroupDefaults {
  groupTitle: string
  values: Record<string, FieldDefaultValue>
}

export interface FillScenario {
  id: string
  label: string
  /** Senaryo listesinde ve onay modalında gösterilen kısa açıklama. */
  description?: string
  promptUser: boolean
  /** İçerilecek grup başlıkları. undefined → tüm groupDefaults girdileri. */
  groupTitles?: string[]
  /** groupDefaults değerlerinin üzerine binen field-level override'lar. */
  fieldOverrides?: Record<string, FieldDefaultValue>
  /**
   * true → applyScenario yalnızca `field.required === true` alanları yazar;
   * isteğe bağlı kardeşler (aynı grupta olsalar bile) atlanır.
   */
  requiredOnly?: boolean
  /**
   * Ara ekrandaki ayrımı belirler:
   *  - 'manual'   → Kendim Seçeceğim → DefaultsModal (grup checkbox listesi)
   *  - 'scenario' → Senaryolar listesinde gösterilir → ScenarioConfirmModal
   */
  kind?: 'manual' | 'scenario'
}

const today = (): string => new Date().toISOString().slice(0, 10)
const nowTime = (): string => new Date().toTimeString().slice(0, 8)
const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().toUpperCase()
    : 'AAAAAAAA-AAAA-AAAA-AAAA-' + Date.now().toString().padStart(12, '0')

/**
 * Fatura No formatı: 3 karakter seri + 4 karakter yıl + 9 karakter sıra numarası = 16 karakter.
 * Sıra numarası yıl başına localStorage'da tutulur, her çağrıda 1 artar (0'dan başlayıp +1).
 * Örn: "INV2026000000001", "INV2026000000002".
 */
const INVOICE_SERIES = 'INV'
const newInvoiceId = (): string => {
  const year = new Date().getFullYear()
  const key = `invoiceCounter:${INVOICE_SERIES}:${year}`
  let n = 0
  try {
    n = parseInt(localStorage.getItem(key) ?? '0', 10) || 0
  } catch {
    // localStorage erişilemiyorsa sayaç sıfırdan başlar
  }
  n += 1
  try {
    localStorage.setItem(key, String(n))
  } catch {
    // Yazılamıyorsa sessizce yut — bir sonraki çağrı yine 1 üretir
  }
  return INVOICE_SERIES + year + String(n).padStart(9, '0')
}

/**
 * Bir tarafın (Satıcı/Alıcı vb.) örnek alanlarını üreten yardımcı.
 * makePartyItems'taki fieldId pattern'iyle uyumludur (`${prefix}-website`, `${prefix}-party-id`, ...).
 */
function partyDefaults(prefix: string, suffix: string): Record<string, FieldDefaultValue> {
  return {
    [`${prefix}-website`]:               'https://example.com',
    [`${prefix}-party-id`]:              `1234567890`,
    [`${prefix}-party-name`]:            `Örnek ${suffix} A.Ş.`,
    [`${prefix}-postal-street`]:         'Atatürk Caddesi',
    [`${prefix}-postal-building`]:       'No 12',
    [`${prefix}-postal-bnum`]:           '12',
    [`${prefix}-postal-room`]:           '5',
    [`${prefix}-postal-citysub`]:        'Kadıköy',
    [`${prefix}-postal-city`]:           'İSTANBUL',
    [`${prefix}-postal-postal`]:         '34000',
    [`${prefix}-postal-region`]:         'Marmara',
    [`${prefix}-postal-district`]:       'Caferağa',
    [`${prefix}-postal-country-code`]:   'TR',
    [`${prefix}-postal-country-name`]:   'Türkiye',
    [`${prefix}-tax-scheme-name`]:       'Kadıköy V.D.',
    [`${prefix}-contact-name`]:          `${suffix} İletişim`,
    [`${prefix}-contact-tel`]:           '+902161234567',
    [`${prefix}-contact-email`]:         'info@example.com',
    [`${prefix}-person-first`]:          'Ahmet',
    [`${prefix}-person-family`]:         'Yılmaz',
  }
}

export const invoiceGroupDefaults: GroupDefaults[] = [
  {
    groupTitle: 'Belge Genel Bilgileri',
    values: {
      'invoice-profile-id':     'TEMELFATURA',
      'invoice-id':             newInvoiceId,
      'invoice-copy-indicator': 'false',
      'invoice-uuid':           newUuid,
      'invoice-issue-date':     today,
      'invoice-issue-time':     nowTime,
      'invoice-type-code':      'SATIS',
      'invoice-currency':       'TRY',
      'invoice-line-count':     '1',
    },
  },
  {
    groupTitle: 'Fatura Dönemi',
    values: {
      'period-start-date':  today,
      'period-end-date':    today,
      'period-description': 'Aylık dönem',
    },
  },
  {
    groupTitle: 'Sipariş Bilgisi',
    values: {
      'order-id':         'SIP-2025-001',
      'order-issue-date': today,
    },
  },
  {
    groupTitle: 'Satıcı',
    values: partyDefaults('supplier-party', 'Satıcı'),
  },
  {
    groupTitle: 'Alıcı',
    values: partyDefaults('customer-party', 'Alıcı'),
  },
  {
    groupTitle: 'Mal/Hizmet Alıcı',
    values: partyDefaults('buyer-party', 'Mal/Hizmet Alıcı'),
  },
  {
    groupTitle: 'Ödeme Şekli',
    values: {
      'payment-means-code':         '10',
      'payment-means-due-date':     today,
      'payment-means-payee-acc-id': 'TR000000000000000000000000',
    },
  },
  {
    groupTitle: 'Ödeme Koşulları',
    values: {
      'payment-terms-note':     'Faturanın düzenleme tarihinde ödenir.',
      'payment-terms-due-date': today,
    },
  },
  {
    groupTitle: 'Iskonto/Artırım',
    values: {
      'invoice-allowance-charge-indicator': '-',
      'invoice-allowance-reason':           'Genel iskonto',
      'invoice-allowance-multiplier':       '0.10',
      'invoice-allowance-amount':           '10.00',
      'invoice-allowance-base-amount':      '100.00',
    },
  },
  {
    groupTitle: 'Parasal Toplamlar',
    values: {
      'lmt-line-ext':        '100.00',
      'lmt-tax-excl':        '100.00',
      'lmt-tax-incl':        '118.00',
      'lmt-allowance-total': '0.00',
      'lmt-charge-total':    '0.00',
      'lmt-payable':         '118.00',
    },
  },
  {
    groupTitle: 'Mal/Hizmet Kalemleri',
    values: {
      'iline-id':       '1',
      'iline-quantity': '1',
      'iline-line-ext': '100.00',
    },
  },
]

/**
 * "Tümünü Doldur" senaryosunda modal listesinde gösterilmeyecek üst-seviye
 * gruplar. Teknik bloklar (UBL extension'ları, dijital imza içerikleri) demo
 * doldurulmaz; kullanıcının manuel müdahalesini bekler.
 */
export const invoiceExcludedGroups: string[] = ['UBL Eklentileri', 'Mali Mühür-İmza']

/**
 * `/senaryo-ekle` skill'inin ürettiği profil bazlı senaryolar.
 * Schematron + örnek XML'den çıkarılan profil-özgü zorunlu alanlar ve tipik
 * değerler `scenarios.generated.json` üzerinden okunur ve FillScenario'ya
 * dönüştürülür. ProfileID otomatik olarak fieldOverrides'a eklenir.
 */
interface GeneratedProfile {
  profileId: string
  label: string
  description?: string
  fieldOverrides: Record<string, string>
  groupTitles?: string[] | null
}

const profileScenarios: FillScenario[] = (
  (scenariosData.profiles ?? []) as GeneratedProfile[]
).map((p) => ({
  id: `profile-${p.profileId.toLowerCase()}`,
  label: p.label,
  description: p.description ?? `${p.label} profili için tipik değerlerle örnek belge.`,
  promptUser: false,
  kind: 'scenario',
  groupTitles: p.groupTitles ?? undefined,
  fieldOverrides: { 'invoice-profile-id': p.profileId, ...p.fieldOverrides },
}))

export const invoiceFillScenarios: FillScenario[] = [
  {
    id: 'all',
    label: 'Tümünü Doldur',
    promptUser: true,
    kind: 'manual',
    // groupTitles undefined → tüm config grupları (excluded hariç)
  },
  {
    id: 'required-only',
    label: 'Sadece zorunlu alanlar',
    description:
      "XSD'ye göre zorunlu olarak işaretlenmiş alanları örnek değerlerle doldurur. İsteğe bağlı alanlar boş kalır.",
    promptUser: true,
    kind: 'scenario',
    requiredOnly: true,
  },
  ...profileScenarios,
]

/**
 * Override (groupDefaults / scenario.fieldOverrides) verilmemişse field'ın
 * tipine ve etiketine göre jenerik bir demo değer üretir. `disabled` alanlar
 * boş döner → updateField boş yazıp atlar.
 */
export function autoFieldDefault(field: FieldDefinition): string {
  if (field.disabled) return ''

  switch (field.type) {
    case 'date':
      return today()
    case 'time':
      return nowTime()
    case 'number':
      return '1'
    case 'select':
      return field.options?.[0]?.value ?? ''
    case 'duration-measure':
      return '1'
    case 'notes-list':
      return 'Örnek not'
  }

  // type undefined veya 'text' → label'a göre tahmin et, yoksa generic.
  const label = field.label.toLowerCase()
  if (/e-?posta|email/.test(label)) return 'ornek@example.com'
  if (/web|url|adres.*site/.test(label)) return 'https://example.com'
  if (/telefon|tel\.?|fax/.test(label)) return '+902161234567'
  if (/iban|hesap.*no/.test(label)) return 'TR000000000000000000000000'
  if (/posta kodu|postal/.test(label)) return '34000'
  if (/ülke kodu|country code/.test(label)) return 'TR'
  if (/ülke|country/.test(label)) return 'Türkiye'
  if (/i̇l adı|il adı|^il$|şehir/.test(label)) return 'İSTANBUL'
  if (/^id$|kimlik|numara/.test(label)) return '0000000001'
  if (/ad|isim|name/.test(label)) return 'Örnek'

  return 'Örnek değer'
}

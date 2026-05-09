/**
 * Müstahsil Makbuzu (E-MM, CreditNote) modülü için form alanı varsayılan değerleri ve doldurma senaryoları.
 * invoice/defaults.ts ve despatch/defaults.ts ile aynı şemayı paylaşır; sadece modül-spesifik değerler farklıdır.
 */
import type { FieldDefinition } from '../../types'

export type FieldDefaultValue = string | (() => string)

export interface GroupDefaults {
  groupTitle: string
  values: Record<string, FieldDefaultValue>
}

export interface FillScenario {
  id: string
  label: string
  description?: string
  promptUser: boolean
  groupTitles?: string[]
  fieldOverrides?: Record<string, FieldDefaultValue | FieldDefaultValue[]>
  fieldAttrOverrides?: Record<
    string,
    Record<string, string> | Record<string, string>[]
  >
  requiredOnly?: boolean
  strictMode?: boolean
  kind?: 'manual' | 'scenario'
}

const today = (): string => new Date().toISOString().slice(0, 10)
const nowTime = (): string => new Date().toTimeString().slice(0, 8)
const newUuid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().toUpperCase()
    : 'AAAAAAAA-AAAA-AAAA-AAAA-' + Date.now().toString().padStart(12, '0')

/**
 * Müstahsil Makbuzu Numarası formatı (kılavuz §2.3.5):
 * 3 haneli alfa-numerik birim kod + 4 haneli yıl + 9 haneli müteselsil sıra numarası = 16 hane.
 * Örn: "GIB2026000000001".
 */
const MM_SERIES = 'GIB'
const newCreditNoteId = (): string => {
  const year = new Date().getFullYear()
  const key = `creditNoteCounter:${MM_SERIES}:${year}`
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
    // sessizce yut
  }
  return MM_SERIES + year + String(n).padStart(9, '0')
}

/** Tüccar (Makbuz Düzenleyen) — kurumsal taraf varsayılanları */
function tuccarDefaults(prefix: string): Record<string, FieldDefaultValue> {
  return {
    [`${prefix}-website`]:               'https://example.com',
    [`${prefix}-party-id`]:              '1234567890',
    [`${prefix}-party-name`]:            'Örnek Tüccar A.Ş.',
    [`${prefix}-postal-street`]:         'Şenlikköy Mah. Florya Cad. No:7',
    [`${prefix}-postal-bnum`]:           '7',
    [`${prefix}-postal-citysub`]:        'Bakırköy',
    [`${prefix}-postal-city`]:           'İstanbul',
    [`${prefix}-postal-postal`]:         '34000',
    [`${prefix}-postal-region`]:         'Bakırköy',
    [`${prefix}-postal-country-code`]:   'TR',
    [`${prefix}-postal-country-name`]:   'Türkiye',
    [`${prefix}-tax-scheme-name`]:       'Küçükçekmece V.D.',
    [`${prefix}-contact-name`]:          'Tüccar İletişim',
    [`${prefix}-contact-tel`]:           '+902121234567',
    [`${prefix}-contact-email`]:         'info@example.com',
  }
}

/** Üretici/Çiftçi — şahıs taraf varsayılanları */
function ciftciDefaults(prefix: string): Record<string, FieldDefaultValue> {
  return {
    [`${prefix}-party-id`]:              '14604153088',
    [`${prefix}-postal-street`]:         'AAA Mah. BBB Cad. No:67',
    [`${prefix}-postal-bnum`]:           '67',
    [`${prefix}-postal-citysub`]:        'Merkez',
    [`${prefix}-postal-city`]:           'Niğde',
    [`${prefix}-postal-region`]:         'Sazlıca',
    [`${prefix}-postal-country-code`]:   'TR',
    [`${prefix}-postal-country-name`]:   'Türkiye',
    [`${prefix}-person-first`]:          'Çiftçi Ad',
    [`${prefix}-person-family`]:         'Çiftçi Soyad',
  }
}

export const creditNoteGroupDefaults: GroupDefaults[] = [
  {
    groupTitle: 'Belge Genel Bilgileri',
    values: {
      'cn-profile-id':     'EARSIVBELGE',
      'cn-id':             newCreditNoteId,
      'cn-copy-indicator': 'false',
      'cn-uuid':           newUuid,
      'cn-issue-date':     today,
      'cn-issue-time':     nowTime,
      'cn-type-code':      'MUSTAHSILMAKBUZU',
    },
  },
  {
    groupTitle: 'Mali Mühür-İmza',
    values: {
      'cn-signature-id': '1288331521',
    },
  },
  {
    groupTitle: 'Makbuz Düzenleyen (Tüccar)',
    values: tuccarDefaults('cn-supplier-party'),
  },
  {
    groupTitle: 'Üretici/Çiftçi',
    values: ciftciDefaults('cn-customer-party'),
  },
  {
    groupTitle: 'Gönderim, Taşıma, Sevkiyat Bilgileri',
    values: {
      'cn-delivery-actual-date': today,
    },
  },
  {
    groupTitle: 'Toplam Vergi',
    values: {
      'cn-tax-amount': '350',
    },
  },
  {
    groupTitle: 'Parasal Toplamlar',
    values: {
      'cn-lmt-line-ext': '17500',
      'cn-lmt-tax-excl': '17500',
      'cn-lmt-tax-incl': '17150',
      'cn-lmt-payable':  '17150',
    },
  },
  {
    groupTitle: 'Müstahsil Makbuzu Kalemleri',
    values: {
      'cnline-id':        '1',
      'cnline-quantity':  '5',
      'cnline-line-ext':  '17500',
      'cnline-item-name': 'Büyükbaş hayvan',
      'cnline-price-amount': '3500',
    },
  },
]

export const creditNoteExcludedGroups: string[] = ['UBL Eklentileri']

export const creditNoteFillScenarios: FillScenario[] = [
  {
    id: 'all',
    label: 'Tümünü Doldur',
    promptUser: true,
    kind: 'manual',
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
]

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

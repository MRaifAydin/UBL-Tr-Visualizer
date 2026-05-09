/**
 * İrsaliye modülü için form alanı varsayılan değerleri ve doldurma senaryoları.
 * invoice/defaults.ts ile aynı şemayı paylaşır; sadece mod
ül-spesifik değerler farklıdır.
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
 * İrsaliye No formatı: 3 karakter seri + 4 karakter yıl + 9 karakter sıra numarası = 16 karakter.
 * Örn: "IRS2026000000001".
 */
const DESPATCH_SERIES = 'IRS'
const newDespatchId = (): string => {
  const year = new Date().getFullYear()
  const key = `despatchCounter:${DESPATCH_SERIES}:${year}`
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
  return DESPATCH_SERIES + year + String(n).padStart(9, '0')
}

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

export const despatchGroupDefaults: GroupDefaults[] = [
  {
    groupTitle: 'Belge Genel Bilgileri',
    values: {
      'desp-profile-id':     'TEMELIRSALIYE',
      'desp-id':             newDespatchId,
      'desp-copy-indicator': 'false',
      'desp-uuid':           newUuid,
      'desp-issue-date':     today,
      'desp-issue-time':     nowTime,
      'desp-type-code':      'SEVK',
      'desp-line-count':     '1',
    },
  },
  {
    groupTitle: 'Sipariş Bilgileri',
    values: {
      'desp-order-ref-id':         'SIP-2025-001',
      'desp-order-ref-issue-date': today,
    },
  },
  {
    groupTitle: 'Gönderen (Satıcı)',
    values: partyDefaults('desp-supplier', 'Gönderen'),
  },
  {
    groupTitle: 'Alıcı',
    values: partyDefaults('desp-customer', 'Alıcı'),
  },
  {
    groupTitle: 'Asıl Alıcı (Müşteri)',
    values: partyDefaults('desp-buyer', 'Müşteri'),
  },
  {
    groupTitle: 'Gönderi/Sevkiyat',
    values: {
      'desp-shipment-id':              'SVK-001',
      'desp-shipment-gross-weight':    '100',
      'desp-shipment-net-weight':      '95',
      'desp-shipment-total-goods-qty': '1',
    },
  },
  {
    groupTitle: 'Teslimat',
    values: {
      'desp-delivery-id':          '1',
      'desp-delivery-actual-date': today,
      'desp-delivery-actual-time': nowTime,
    },
  },
  {
    groupTitle: 'İrsaliye Satırı',
    values: {
      'desp-line-id':                 '1',
      'desp-line-delivered-qty':      '1',
      'desp-line-item-name':          'Örnek Mal',
    },
  },
]

export const despatchExcludedGroups: string[] = ['UBL Eklentileri']

interface GeneratedScenario {
  id: string
  label: string
  description?: string
  fieldOverrides: Record<string, string | string[]>
  fieldAttrOverrides?: Record<
    string,
    Record<string, string> | Record<string, string>[]
  >
  groupTitles?: string[] | null
  strictMode?: boolean
}

const profileScenarios: FillScenario[] = (
  (scenariosData.scenarios ?? []) as unknown as GeneratedScenario[]
).map((s) => ({
  id: `scenario-${s.id}`,
  label: s.label,
  description: s.description,
  promptUser: false,
  kind: 'scenario',
  groupTitles: s.groupTitles ?? undefined,
  fieldOverrides: s.fieldOverrides,
  fieldAttrOverrides: s.fieldAttrOverrides,
  strictMode: s.strictMode,
}))

export const despatchFillScenarios: FillScenario[] = [
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
  ...profileScenarios,
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

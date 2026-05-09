import type {
  FieldDefinition,
  FieldGroupConfig,
} from '../../types'
import { isFieldDefinition } from '../../types'
import {
  CURRENCY_OPTIONS,
  QUANTITY_UNIT_OPTIONS,
  makeAllowanceChargeGroup,
  makeDeliveryGroup,
  makeDocumentReferenceGroup,
  makePartyGroup,
  makeTaxTotalGroup,
} from '../shared/factories'
import requiredJson from './required.generated.json'

const REQUIRED_PATHS = new Set<string>(requiredJson.requiredPaths)

function isPathRequired(path: string[]): boolean {
  return REQUIRED_PATHS.has(path.join('/'))
}

function markRequiredInGroups(groups: FieldGroupConfig[]): void {
  for (const group of groups) {
    if (group.fields) {
      for (const field of group.fields) {
        if (isPathRequired(field.path)) field.required = true
      }
    }
    if (group.items) {
      for (const item of group.items) {
        if (isFieldDefinition(item)) {
          if (isPathRequired(item.path)) item.required = true
        } else {
          markRequiredInGroups([item])
        }
      }
    }
    if (group.subgroups) markRequiredInGroups(group.subgroups)
  }
}

export const rootTag = 'CreditNote'

export const xsltPath = '/xslt/creditnote.xslt'

export const rootAttributes: Record<string, string> = {
  'xmlns':       'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
  'xmlns:cac':   'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  'xmlns:cbc':   'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  'xmlns:ext':   'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  'xmlns:ds':    'http://www.w3.org/2000/09/xmldsig#',
  'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
  'xmlns:xsi':   'http://www.w3.org/2001/XMLSchema-instance',
  'xmlns:udt':   'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
  'xmlns:ccts':  'urn:un:unece:uncefact:documentation:2',
  'xmlns:qdt':   'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
  'xmlns:ubltr': 'urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents',
}

// Müstahsil Makbuzu kılavuzu (V1.0, Ocak 2018) §2.3.3: CustomizationID = "TR1.2.1"
export const rootStaticPrefix =
  '  <ext:UBLExtensions>\n' +
  '    <ext:UBLExtension><ext:ExtensionContent /></ext:UBLExtension>\n' +
  '  </ext:UBLExtensions>\n' +
  '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n' +
  '  <cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>'

const PROFILE_OPTIONS = [
  { value: 'EARSIVBELGE', label: 'e-Arşiv Belge' },
]

const CREDITNOTE_TYPE_OPTIONS = [
  { value: 'MUSTAHSILMAKBUZU', label: 'Müstahsil Makbuzu' },
]

const ROOT = ['CreditNote'] as const

export const fieldGroups: FieldGroupConfig[] = [
  {
    title: 'UBL Eklentileri',
    fullWidth: true,
    wrap: true,
    fields: [
      {
        fieldId: 'cn-ubl-extensions-info',
        label: 'ext:UBLExtensions',
        path: [],
        attr: 'value',
        disabled: true,
      },
    ],
  },
  {
    title: 'Belge Genel Bilgileri',
    wide: true,
    fullWidth: true,
    wrap: true,
    defaultOpen: true,
    fields: [
      {
        fieldId: 'cn-profile-id',
        label: 'Senaryo',
        path: [...ROOT, 'cbc:ProfileID'],
        attr: 'value',
        type: 'select',
        options: PROFILE_OPTIONS,
      },
      {
        fieldId: 'cn-id',
        label: 'Müstahsil Makbuzu Numarası',
        path: [...ROOT, 'cbc:ID'],
        attr: 'value',
      },
      {
        fieldId: 'cn-copy-indicator',
        label: 'Asıl/Suret',
        path: [...ROOT, 'cbc:CopyIndicator'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'false', label: 'Asıl' },
          { value: 'true',  label: 'Suret' },
        ],
      },
      {
        fieldId: 'cn-uuid',
        label: 'Ettn',
        path: [...ROOT, 'cbc:UUID'],
        attr: 'value',
      },
      {
        fieldId: 'cn-issue-date',
        label: 'Düzenleme Tarihi',
        path: [...ROOT, 'cbc:IssueDate'],
        attr: 'value',
        type: 'date',
      },
      {
        fieldId: 'cn-issue-time',
        label: 'Düzenleme Zamanı',
        path: [...ROOT, 'cbc:IssueTime'],
        attr: 'value',
        type: 'time',
      },
      {
        fieldId: 'cn-type-code',
        label: 'Tip Kodu',
        path: [...ROOT, 'cbc:CreditNoteTypeCode'],
        attr: 'value',
        type: 'select',
        options: CREDITNOTE_TYPE_OPTIONS,
      },
      {
        fieldId: 'cn-notes',
        label: 'Notlar',
        path: [...ROOT, 'cbc:Note'],
        attr: 'value',
        type: 'notes-list',
      },
    ],
  },
  {
    ...makeDocumentReferenceGroup('İlave Doküman', 'cn-additional-docref', [...ROOT, 'cac:AdditionalDocumentReference']),
    fullWidth: true,
  },
  {
    title: 'Mali Mühür-İmza',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'cn-signature-id', label: 'Referans Numarası', path: [...ROOT, 'cac:Signature', 'cbc:ID'], attr: 'value' },
    ],
    subgroups: [
      makePartyGroup('İmza Sahibi', 'cn-signature-party', [...ROOT, 'cac:Signature', 'cac:SignatoryParty']),
      {
        title: 'Dijital İmza',
        wrap: true,
        fields: [
          { fieldId: 'cn-signature-dig-embedded', label: 'Belge Eki', path: [...ROOT, 'cac:Signature', 'cac:DigitalSignatureAttachment', 'cbc:EmbeddedDocumentBinaryObject'], attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Dış Referans Eki',
            wrap: true,
            fields: [
              { fieldId: 'cn-signature-dig-ext-uri', label: 'Adres', path: [...ROOT, 'cac:Signature', 'cac:DigitalSignatureAttachment', 'cac:ExternalReference', 'cbc:URI'], attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Makbuz Düzenleyen (Tüccar)',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'cn-supplier-party',
        [...ROOT, 'cac:AccountingSupplierParty', 'cac:Party'],
      ),
    ],
  },
  {
    title: 'Üretici/Çiftçi',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'cn-customer-party',
        [...ROOT, 'cac:AccountingCustomerParty', 'cac:Party'],
      ),
    ],
  },
  { ...makeDeliveryGroup('Gönderim, Taşıma, Sevkiyat Bilgileri', 'cn-delivery', [...ROOT, 'cac:Delivery']), fullWidth: true },
  {
    title: 'Iskonto/Artırım',
    fullWidth: true,
    repeatable: true,
    instanceMarker: 'cac:AllowanceCharge',
    addLabel: 'Yeni İskonto/Artırım Ekle',
    items: [
      makeAllowanceChargeGroup('cn-allowance', [...ROOT, 'cac:AllowanceCharge']),
    ],
  },
  makeTaxTotalGroup(
    'Toplam Vergi',
    'cn-tax',
    'cac:TaxTotal',
    [...ROOT, 'cac:TaxTotal'],
    'Yeni Toplam Vergi Ekle',
  ),
  {
    title: 'Parasal Toplamlar',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'cn-lmt-line-ext',        label: 'Mal/Hizmet Toplam Tutarı', path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:LineExtensionAmount'],   attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-tax-excl',        label: 'Vergiler Hariç Tutar',     path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:TaxExclusiveAmount'],    attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-tax-incl',        label: 'Vergiler Dahil Tutar',     path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:TaxInclusiveAmount'],    attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-allowance-total', label: 'Toplam Iskonto Tutarı',    path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:AllowanceTotalAmount'],  attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-charge-total',    label: 'Toplam Artırım Tutarı',    path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:ChargeTotalAmount'],     attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-rounding',        label: 'Yuvarlama Tutarı',         path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:PayableRoundingAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'cn-lmt-payable',         label: 'Ödenecek Tutar',           path: [...ROOT, 'cac:LegalMonetaryTotal', 'cbc:PayableAmount'],         attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
    ],
  },
  {
    title: 'Müstahsil Makbuzu Kalemleri',
    fullWidth: true,
    repeatable: true,
    instanceMarker: 'cac:CreditNoteLine',
    addLabel: 'Yeni Kalem Ekle',
    items: [
      { fieldId: 'cnline-id',       label: 'Sıra Numarası', path: [...ROOT, 'cac:CreditNoteLine', 'cbc:ID'],                  attr: 'value' },
      { fieldId: 'cnline-quantity', label: 'Miktar',        path: [...ROOT, 'cac:CreditNoteLine', 'cbc:CreditedQuantity'],    attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
      { fieldId: 'cnline-line-ext', label: 'Mal/Hizmet Tutarı', path: [...ROOT, 'cac:CreditNoteLine', 'cbc:LineExtensionAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      makeTaxTotalGroup(
        'Kalem Vergisi',
        'cnline-tax',
        'cac:TaxTotal',
        [...ROOT, 'cac:CreditNoteLine', 'cac:TaxTotal'],
        'Yeni Kalem Vergisi Ekle',
        false,
      ),
      {
        title: 'Kalem İskonto/Artırım',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:AllowanceCharge',
        addLabel: 'Yeni Kalem İskonto/Artırım Ekle',
        items: [
          makeAllowanceChargeGroup('cnline-ac', [...ROOT, 'cac:CreditNoteLine', 'cac:AllowanceCharge']),
        ],
      },
      {
        title: 'Mal/Hizmet',
        wrap: true,
        fields: [
          { fieldId: 'cnline-item-name', label: 'Adı',      path: [...ROOT, 'cac:CreditNoteLine', 'cac:Item', 'cbc:Name'],        attr: 'value' },
          { fieldId: 'cnline-item-desc', label: 'Açıklama', path: [...ROOT, 'cac:CreditNoteLine', 'cac:Item', 'cbc:Description'], attr: 'value' },
        ],
      },
      {
        title: 'Fiyat',
        wrap: true,
        fields: [
          { fieldId: 'cnline-price-amount', label: 'Birim Fiyat', path: [...ROOT, 'cac:CreditNoteLine', 'cac:Price', 'cbc:PriceAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
        ],
      },
    ],
  },
]

function collectFields(groups: FieldGroupConfig[]): FieldDefinition[] {
  return groups.flatMap((g) => {
    if (g.repeatable) return []
    if (g.items) {
      const fields = g.items.filter(isFieldDefinition)
      const subs = g.items.filter((i): i is FieldGroupConfig => !isFieldDefinition(i))
      return [...fields, ...collectFields(subs)]
    }
    return [
      ...(g.fields ?? []),
      ...(g.subgroups ? collectFields(g.subgroups) : []),
    ]
  })
}

markRequiredInGroups(fieldGroups)

export const fieldDefinitions: FieldDefinition[] = collectFields(fieldGroups)

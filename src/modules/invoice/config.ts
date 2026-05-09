import type {
  FieldDefinition,
  FieldGroupConfig,
} from '../../types'
import { isFieldDefinition } from '../../types'
import {
  CURRENCY_OPTIONS,
  DURATION_MEASURE_OPTIONS,
  QUANTITY_UNIT_OPTIONS,
  makeAllowanceChargeGroup,
  makeDeliveryGroup,
  makeDocumentReferenceGroup,
  makePartyGroup,
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

export const rootTag = 'Invoice'

export const xsltPath = '/xslt/invoice.xslt'

export const rootAttributes: Record<string, string> = {
  'xmlns':       'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
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

export const rootStaticPrefix =
  '  <ext:UBLExtensions>\n' +
  '    <ext:UBLExtension><ext:ExtensionContent /></ext:UBLExtension>\n' +
  '  </ext:UBLExtensions>\n' +
  '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n' +
  '  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>'

const PAYMENT_MEANS_CODE_OPTIONS = [
  { value: '1',   label: 'Akreditif' },
  { value: '10',  label: 'Nakit' },
  { value: '20',  label: 'Çek' },
  { value: '30',  label: 'Banka Havalesi' },
  { value: '42',  label: 'Hesaba Havale' },
  { value: '48',  label: 'Kredi Kartı' },
  { value: '49',  label: 'Banka Kartı' },
  { value: 'ZZZ', label: 'Diğer' },
]

function makeExchangeRateGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title,
    wrap: true,
    fields: [
      { fieldId: `${prefix}-source`, label: 'Kaynak Para Birimi Kodu', path: [...pathBase, 'cbc:SourceCurrencyCode'], attr: 'value', type: 'select', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-target`, label: 'Hedef Para Birimi Kodu',  path: [...pathBase, 'cbc:TargetCurrencyCode'], attr: 'value', type: 'select', options: CURRENCY_OPTIONS },
      { fieldId: `${prefix}-rate`,   label: 'Döviz Kuru',              path: [...pathBase, 'cbc:CalculationRate'],    attr: 'value', type: 'number' },
      { fieldId: `${prefix}-date`,   label: 'Kur Tarihi',              path: [...pathBase, 'cbc:Date'],               attr: 'value', type: 'date' },
    ],
  }
}

function makeTaxTotalGroup(
  title: string,
  prefix: string,
  instanceMarker: string,
  basePath: string[],
  addLabel: string,
  repeatable: boolean = true,
): FieldGroupConfig {
  const base: FieldGroupConfig = {
    title,
    fullWidth: true,
    items: [
      {
        fieldId: `${prefix}-amount`,
        label: 'Vergi Tutarı',
        path: [...basePath, 'cbc:TaxAmount'],
        attr: 'value',
        type: 'duration-measure',
        attrKey: 'currencyID',
        options: CURRENCY_OPTIONS,
      },
      {
        title: 'Vergi Ara Toplamı',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:TaxSubtotal',
        addLabel: 'Yeni Vergi Ara Toplamı Ekle',
        items: [
          { fieldId: `${prefix}-sub-taxable`,    label: 'Matrah',                         path: [...basePath, 'cac:TaxSubtotal', 'cbc:TaxableAmount'],                attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-sub-amount`,     label: 'Vergi Tutarı',                   path: [...basePath, 'cac:TaxSubtotal', 'cbc:TaxAmount'],                    attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-sub-calc-seq`,   label: 'Hesaplama Sırası',               path: [...basePath, 'cac:TaxSubtotal', 'cbc:CalculationSequenceNumeric'],   attr: 'value', type: 'number' },
          { fieldId: `${prefix}-sub-trx-amount`, label: 'İşlem Para Birimi Vergi Tutarı', path: [...basePath, 'cac:TaxSubtotal', 'cbc:TransactionCurrencyTaxAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-sub-percent`,    label: 'Vergi Oranı',                    path: [...basePath, 'cac:TaxSubtotal', 'cbc:Percent'],                     attr: 'value', type: 'number' },
          { fieldId: `${prefix}-sub-base-unit`,  label: 'Birim Ölçü',                     path: [...basePath, 'cac:TaxSubtotal', 'cbc:BaseUnitMeasure'],             attr: 'value', disabled: true },
          { fieldId: `${prefix}-sub-perunit`,    label: 'Birim Başına Tutar',             path: [...basePath, 'cac:TaxSubtotal', 'cbc:PerUnitAmount'],               attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          {
            title: 'Vergi Türü',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-cat-name`,          label: 'Adı',                        path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cbc:Name'],                    attr: 'value' },
              { fieldId: `${prefix}-cat-exempt-code`,   label: 'Vergi Muafiyet Nedeni Kodu', path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cbc:TaxExemptionReasonCode'], attr: 'value' },
              { fieldId: `${prefix}-cat-exempt-reason`, label: 'Vergi Muafiyet Nedeni',      path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cbc:TaxExemptionReason'],     attr: 'value' },
            ],
            subgroups: [
              {
                title: 'Vergi Bilgileri',
                wrap: true,
                fields: [
                  { fieldId: `${prefix}-scheme-id`,   label: 'Sıra Numarası',   path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cac:TaxScheme', 'cbc:ID'],          attr: 'value' },
                  { fieldId: `${prefix}-scheme-name`, label: 'Vergi Adı',       path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cac:TaxScheme', 'cbc:Name'],        attr: 'value' },
                  { fieldId: `${prefix}-scheme-type`, label: 'Vergi Tipi Kodu', path: [...basePath, 'cac:TaxSubtotal', 'cac:TaxCategory', 'cac:TaxScheme', 'cbc:TaxTypeCode'], attr: 'value', disabled: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  }
  return repeatable
    ? { ...base, repeatable: true, instanceMarker, addLabel }
    : base
}

export const fieldGroups: FieldGroupConfig[] = [
  {
    title: 'UBL Eklentileri',
    fullWidth: true,
    wrap: true,
    fields: [
      {
        fieldId: 'invoice-ubl-extensions-info',
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
        fieldId: 'invoice-profile-id',
        label: 'Senaryo',
        path: ['Invoice', 'cbc:ProfileID'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TEMELFATURA',       label: 'Temel Fatura' },
          { value: 'TICARIFATURA',      label: 'Ticari Fatura' },
          { value: 'YOLCUBERABERFATURA',label: 'Yolcu Beraber Fatura' },
          { value: 'EARSIVFATURA',      label: 'e-Arşiv Fatura' },
          { value: 'IHRACAT',           label: 'İhracat' },
          { value: 'OZELFATURA',        label: 'Özel Fatura' },
          { value: 'KAMU',              label: 'Kamu' },
          { value: 'HKS',               label: 'HKS (Hal Kayıt)' },
          { value: 'ENERJI',            label: 'Enerji (Elektrikli Araç)' },
          { value: 'ILAC_TIBBICIHAZ',   label: 'İlaç / Tıbbi Cihaz' },
          { value: 'YATIRIMTESVIK',     label: 'Yatırım Teşvik' },
          { value: 'IDIS',              label: 'İDİS (İnşaat Demiri)' },
        ],
      },
      {
        fieldId: 'invoice-id',
        label: 'Fatura No',
        path: ['Invoice', 'cbc:ID'],
        attr: 'value',
      },
      {
        fieldId: 'invoice-copy-indicator',
        label: 'Kopya/Asıl',
        path: ['Invoice', 'cbc:CopyIndicator'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'false', label: 'Asıl' },
          { value: 'true',  label: 'Kopya' },
        ],
      },
      {
        fieldId: 'invoice-uuid',
        label: 'Ettn',
        path: ['Invoice', 'cbc:UUID'],
        attr: 'value',
      },
      {
        fieldId: 'invoice-issue-date',
        label: 'Düzenleme Tarihi',
        path: ['Invoice', 'cbc:IssueDate'],
        attr: 'value',
        type: 'date',
      },
      {
        fieldId: 'invoice-issue-time',
        label: 'Düzenleme Saati',
        path: ['Invoice', 'cbc:IssueTime'],
        attr: 'value',
        type: 'time',
      },
      {
        fieldId: 'invoice-type-code',
        label: 'Fatura Tipi',
        path: ['Invoice', 'cbc:InvoiceTypeCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'SATIS',            label: 'Satış' },
          { value: 'IADE',             label: 'İade' },
          { value: 'TEVKIFAT',         label: 'Tevkifat' },
          { value: 'TEVKIFATIADE',     label: 'Tevkifat İade' },
          { value: 'ISTISNA',          label: 'İstisna' },
          { value: 'OZELMATRAH',       label: 'Özel Matrah' },
          { value: 'IHRACKAYITLI',     label: 'İhraç Kayıtlı' },
          { value: 'SGK',              label: 'SGK' },
          { value: 'KOMISYONCU',       label: 'Komisyoncu (Hal Kayıt)' },
          { value: 'KONAKLAMAVERGISI', label: 'Konaklama Vergisi' },
          { value: 'SARJANLIK',        label: 'Şarjanlık (Anlık)' },
          { value: 'SARJ',             label: 'Şarj (Haftalık)' },
          { value: 'TEKNOLOJIDESTEK',  label: 'Teknoloji Desteği' },
          { value: 'YTBSATIS',         label: 'YTB Satış' },
          { value: 'YTBISTISNA',       label: 'YTB İstisna' },
          { value: 'YTBIADE',          label: 'YTB İade' },
          { value: 'YTBTEVKIFAT',      label: 'YTB Tevkifat' },
          { value: 'YTBTEVKIFATIADE',  label: 'YTB Tevkifat İade' },
        ],
      },
      {
        fieldId: 'invoice-notes',
        label: 'Notlar',
        path: ['Invoice', 'cbc:Note'],
        attr: 'value',
        type: 'notes-list',
      },
      {
        fieldId: 'invoice-currency',
        label: 'Belge Para Birimi',
        path: ['Invoice', 'cbc:DocumentCurrencyCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TRY', label: 'Türk Lirası' },
          { value: 'USD', label: 'Dolar' },
          { value: 'EUR', label: 'Euro' },
        ],
      },
      {
        fieldId: 'invoice-tax-currency',
        label: 'Vergi Para Birimi',
        path: ['Invoice', 'cbc:TaxCurrencyCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TRY', label: 'Türk Lirası' },
          { value: 'USD', label: 'Dolar' },
          { value: 'EUR', label: 'Euro' },
        ],
      },
      {
        fieldId: 'invoice-pricing-currency',
        label: 'Fiyatlandırma Para Birimi',
        path: ['Invoice', 'cbc:PricingCurrencyCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TRY', label: 'Türk Lirası' },
          { value: 'USD', label: 'Dolar' },
          { value: 'EUR', label: 'Euro' },
        ],
      },
      {
        fieldId: 'invoice-payment-currency',
        label: 'Ödeme Para Birimi',
        path: ['Invoice', 'cbc:PaymentCurrencyCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TRY', label: 'Türk Lirası' },
          { value: 'USD', label: 'Dolar' },
          { value: 'EUR', label: 'Euro' },
        ],
      },
      {
        fieldId: 'invoice-alt-payment-currency',
        label: 'Alternatif Ödeme Para Birimi',
        path: ['Invoice', 'cbc:PaymentAlternativeCurrencyCode'],
        attr: 'value',
        type: 'select',
        options: [
          { value: 'TRY', label: 'Türk Lirası' },
          { value: 'USD', label: 'Dolar' },
          { value: 'EUR', label: 'Euro' },
        ],
      },
      {
        fieldId: 'invoice-accounting-cost',
        label: 'Hesap Kodu',
        path: ['Invoice', 'cbc:AccountingCost'],
        attr: 'value',
      },
      {
        fieldId: 'invoice-line-count',
        label: 'Kalem Sayısı',
        path: ['Invoice', 'cbc:LineCountNumeric'],
        attr: 'value',
        type: 'number',
      },
    ],
  },
  {
    title: 'Fatura Dönemi',
    fullWidth: true,
    wrap: true,
    fields: [
      {
        fieldId: 'period-start-date',
        label: 'Başlangıç Tarihi',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:StartDate'],
        attr: 'value',
        type: 'date',
      },
      {
        fieldId: 'period-start-time',
        label: 'Başlangıç Saati',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:StartTime'],
        attr: 'value',
        type: 'time',
      },
      {
        fieldId: 'period-end-date',
        label: 'Bitiş Tarihi',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:EndDate'],
        attr: 'value',
        type: 'date',
      },
      {
        fieldId: 'period-end-time',
        label: 'Bitiş Saati',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:EndTime'],
        attr: 'value',
        type: 'time',
      },
      {
        fieldId: 'period-duration',
        label: 'Dönem Süresi',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:DurationMeasure'],
        attr: 'value',
        type: 'duration-measure',
        options: DURATION_MEASURE_OPTIONS,
      },
      {
        fieldId: 'period-description',
        label: 'Açıklama',
        path: ['Invoice', 'cac:InvoicePeriod', 'cbc:Description'],
        attr: 'value',
      },
    ],
  },
  {
    title: 'Sipariş Bilgisi',
    fullWidth: true,
    wrap: true,
    fields: [
      {
        fieldId: 'order-id',
        label: 'Sipariş Numarası',
        path: ['Invoice', 'cac:OrderReference', 'cbc:ID'],
        attr: 'value',
      },
      {
        fieldId: 'order-sales-id',
        label: 'Satıcı Sipariş Numarası',
        path: ['Invoice', 'cac:OrderReference', 'cbc:SalesOrderID'],
        attr: 'value',
      },
      {
        fieldId: 'order-issue-date',
        label: 'Sipariş Tarihi',
        path: ['Invoice', 'cac:OrderReference', 'cbc:IssueDate'],
        attr: 'value',
        type: 'date',
      },
      {
        fieldId: 'order-type-code',
        label: 'Sipariş Tipi',
        path: ['Invoice', 'cac:OrderReference', 'cbc:OrderTypeCode'],
        attr: 'value',
      },
    ],
    subgroups: [
      makeDocumentReferenceGroup(
        'Döküman Referansı',
        'order-docref',
        ['Invoice', 'cac:OrderReference', 'cac:DocumentReference']
      ),
    ],
  },
  {
    title: 'Diğer İlişkili Belgeler',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makeDocumentReferenceGroup('İlişkili Fatura',             'billing-inv',          ['Invoice', 'cac:BillingReference', 'cac:InvoiceDocumentReference']),
      makeDocumentReferenceGroup('Yurtdışı İlişkili Fatura',    'billing-selfbill-inv', ['Invoice', 'cac:BillingReference', 'cac:SelfBilledInvoiceDocumentReference']),
      makeDocumentReferenceGroup('CreditNote Belgesi',          'billing-cn',           ['Invoice', 'cac:BillingReference', 'cac:CreditNoteDocumentReference']),
      makeDocumentReferenceGroup('Yurtdışı CreditNote Belgesi', 'billing-selfbill-cn',  ['Invoice', 'cac:BillingReference', 'cac:SelfBilledCreditNoteDocumentReference']),
      makeDocumentReferenceGroup('DebitNote Belgesi',           'billing-dn',           ['Invoice', 'cac:BillingReference', 'cac:DebitNoteDocumentReference']),
      makeDocumentReferenceGroup('Hatırlatma Belgesi',          'billing-rem',          ['Invoice', 'cac:BillingReference', 'cac:ReminderDocumentReference']),
      makeDocumentReferenceGroup('Ek Belge Referansı',          'billing-add',          ['Invoice', 'cac:BillingReference', 'cac:AdditionalDocumentReference']),
      {
        title: 'İlişkili Kalem',
        wrap: true,
        fields: [
          { fieldId: 'billing-line-id',     label: 'ID',    path: ['Invoice', 'cac:BillingReference', 'cac:BillingReferenceLine', 'cbc:ID'],     attr: 'value' },
          { fieldId: 'billing-line-amount', label: 'Tutar', path: ['Invoice', 'cac:BillingReference', 'cac:BillingReferenceLine', 'cbc:Amount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: [{ value: 'TRY', label: 'Türk Lirası' }, { value: 'USD', label: 'Dolar' }, { value: 'EUR', label: 'Euro' }] },
        ],
        subgroups: [
          makeAllowanceChargeGroup('billing-line-ac', ['Invoice', 'cac:BillingReference', 'cac:BillingReferenceLine', 'cac:AllowanceCharge']),
        ],
      },
    ],
  },
  {
    ...makeDocumentReferenceGroup('İrsaliye Bilgileri', 'despatch-docref', ['Invoice', 'cac:DespatchDocumentReference']),
    fullWidth: true,
  },
  {
    ...makeDocumentReferenceGroup('Alındı Bilgileri', 'receipt-docref', ['Invoice', 'cac:ReceiptDocumentReference']),
    fullWidth: true,
  },
  {
    ...makeDocumentReferenceGroup('Başlangıç Dokümanı Bilgileri', 'originator-docref', ['Invoice', 'cac:OriginatorDocumentReference']),
    fullWidth: true,
  },
  {
    ...makeDocumentReferenceGroup('Kontrat Dokümanı Bilgileri', 'contract-docref', ['Invoice', 'cac:ContractDocumentReference']),
    fullWidth: true,
  },
  {
    ...makeDocumentReferenceGroup('İlave Doküman', 'additional-docref', ['Invoice', 'cac:AdditionalDocumentReference']),
    fullWidth: true,
  },
  {
    title: 'Mali Mühür-İmza',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'signature-id', label: 'Referans Numarası', path: ['Invoice', 'cac:Signature', 'cbc:ID'], attr: 'value' },
    ],
    subgroups: [
      makePartyGroup('İmza Sahibi', 'signature-party', ['Invoice', 'cac:Signature', 'cac:SignatoryParty']),
      {
        title: 'Dijital İmza',
        wrap: true,
        fields: [
          { fieldId: 'signature-dig-embedded', label: 'Belge Eki', path: ['Invoice', 'cac:Signature', 'cac:DigitalSignatureAttachment', 'cbc:EmbeddedDocumentBinaryObject'], attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Dış Referans Eki',
            wrap: true,
            fields: [
              { fieldId: 'signature-dig-ext-uri', label: 'Adres', path: ['Invoice', 'cac:Signature', 'cac:DigitalSignatureAttachment', 'cac:ExternalReference', 'cbc:URI'], attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Satıcı',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'supplier-party',
        ['Invoice', 'cac:AccountingSupplierParty', 'cac:Party'],
      ),
      {
        title: 'Sevkiyat İrtibatı',
        wrap: true,
        fields: [
          { fieldId: 'supplier-despatch-id',    label: 'Id',               path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:ID'],             attr: 'value' },
          { fieldId: 'supplier-despatch-name',  label: 'İsim',             path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:Name'],           attr: 'value' },
          { fieldId: 'supplier-despatch-tel',   label: 'Telefon Numarası', path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:Telephone'],      attr: 'value' },
          { fieldId: 'supplier-despatch-fax',   label: 'Fax Numarası',     path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:Telefax'],        attr: 'value' },
          { fieldId: 'supplier-despatch-email', label: 'E-Posta Adresi',   path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:ElectronicMail'], attr: 'value' },
          { fieldId: 'supplier-despatch-note',  label: 'Not',              path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cbc:Note'],           attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Diğer Bilgiler',
            wrap: true,
            fields: [
              { fieldId: 'supplier-despatch-other-ch-code', label: 'İletişim Numarası Kodu', path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
              { fieldId: 'supplier-despatch-other-ch',      label: 'İletişim Kanal Adı',     path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
              { fieldId: 'supplier-despatch-other-value',   label: 'Değer',                  path: ['Invoice', 'cac:AccountingSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Alıcı',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'customer-party',
        ['Invoice', 'cac:AccountingCustomerParty', 'cac:Party'],
      ),
      {
        title: 'Teslimat İrtibatı',
        wrap: true,
        fields: [
          { fieldId: 'customer-delivery-id',    label: 'Id',               path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:ID'],             attr: 'value' },
          { fieldId: 'customer-delivery-name',  label: 'İsim',             path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:Name'],           attr: 'value' },
          { fieldId: 'customer-delivery-tel',   label: 'Telefon Numarası', path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:Telephone'],      attr: 'value' },
          { fieldId: 'customer-delivery-fax',   label: 'Fax Numarası',     path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:Telefax'],        attr: 'value' },
          { fieldId: 'customer-delivery-email', label: 'E-Posta Adresi',   path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:ElectronicMail'], attr: 'value' },
          { fieldId: 'customer-delivery-note',  label: 'Not',              path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cbc:Note'],           attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Diğer Bilgiler',
            wrap: true,
            fields: [
              { fieldId: 'customer-delivery-other-ch-code', label: 'İletişim Numarası Kodu', path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
              { fieldId: 'customer-delivery-other-ch',      label: 'İletişim Kanal Adı',     path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
              { fieldId: 'customer-delivery-other-value',   label: 'Değer',                  path: ['Invoice', 'cac:AccountingCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Mal/Hizmet Alıcı',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'buyer-party',
        ['Invoice', 'cac:BuyerCustomerParty', 'cac:Party'],
      ),
      {
        title: 'Teslimat İrtibatı',
        wrap: true,
        fields: [
          { fieldId: 'buyer-delivery-id',    label: 'Id',               path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:ID'],             attr: 'value' },
          { fieldId: 'buyer-delivery-name',  label: 'İsim',             path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:Name'],           attr: 'value' },
          { fieldId: 'buyer-delivery-tel',   label: 'Telefon Numarası', path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:Telephone'],      attr: 'value' },
          { fieldId: 'buyer-delivery-fax',   label: 'Fax Numarası',     path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:Telefax'],        attr: 'value' },
          { fieldId: 'buyer-delivery-email', label: 'E-Posta Adresi',   path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:ElectronicMail'], attr: 'value' },
          { fieldId: 'buyer-delivery-note',  label: 'Not',              path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cbc:Note'],           attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Diğer Bilgiler',
            wrap: true,
            fields: [
              { fieldId: 'buyer-delivery-other-ch-code', label: 'İletişim Numarası Kodu', path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
              { fieldId: 'buyer-delivery-other-ch',      label: 'İletişim Kanal Adı',     path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
              { fieldId: 'buyer-delivery-other-value',   label: 'Değer',                  path: ['Invoice', 'cac:BuyerCustomerParty', 'cac:DeliveryContact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Mal/Hizmet Sağlayan',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'seller-party',
        ['Invoice', 'cac:SellerSupplierParty', 'cac:Party'],
      ),
      {
        title: 'Sevkiyat İrtibatı',
        wrap: true,
        fields: [
          { fieldId: 'seller-despatch-id',    label: 'Id',               path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:ID'],             attr: 'value' },
          { fieldId: 'seller-despatch-name',  label: 'İsim',             path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:Name'],           attr: 'value' },
          { fieldId: 'seller-despatch-tel',   label: 'Telefon Numarası', path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:Telephone'],      attr: 'value' },
          { fieldId: 'seller-despatch-fax',   label: 'Fax Numarası',     path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:Telefax'],        attr: 'value' },
          { fieldId: 'seller-despatch-email', label: 'E-Posta Adresi',   path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:ElectronicMail'], attr: 'value' },
          { fieldId: 'seller-despatch-note',  label: 'Not',              path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cbc:Note'],           attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Diğer Bilgiler',
            wrap: true,
            fields: [
              { fieldId: 'seller-despatch-other-ch-code', label: 'İletişim Numarası Kodu', path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
              { fieldId: 'seller-despatch-other-ch',      label: 'İletişim Kanal Adı',     path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
              { fieldId: 'seller-despatch-other-value',   label: 'Değer',                  path: ['Invoice', 'cac:SellerSupplierParty', 'cac:DespatchContact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Vergi Temsilcisi',
    fullWidth: true,
    wrap: true,
    fields: [],
    subgroups: [
      makePartyGroup(
        'Taraf',
        'tax-rep-party',
        ['Invoice', 'cac:TaxRepresentativeParty'],
      ),
    ],
  },
  { ...makeDeliveryGroup('Gönderim, Taşıma, Sevkiyat Bilgileri', 'delivery', ['Invoice', 'cac:Delivery']), fullWidth: true },
  {
    title: 'Ödeme Şekli',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'payment-means-code',         label: 'Ödeme Şekli Kodu',  path: ['Invoice', 'cac:PaymentMeans', 'cbc:PaymentMeansCode'],    attr: 'value', type: 'select', options: PAYMENT_MEANS_CODE_OPTIONS },
      { fieldId: 'payment-means-due-date',     label: 'Son Ödeme Günü',    path: ['Invoice', 'cac:PaymentMeans', 'cbc:PaymentDueDate'],      attr: 'value', type: 'date' },
      { fieldId: 'payment-means-channel-code', label: 'Ödeme Kanalı Kodu', path: ['Invoice', 'cac:PaymentMeans', 'cbc:PaymentChannelCode'], attr: 'value' },
      { fieldId: 'payment-means-instruction',  label: 'Ödeme Açıklaması',  path: ['Invoice', 'cac:PaymentMeans', 'cbc:InstructionNote'],    attr: 'value' },
    ],
    subgroups: [
      {
        title: 'Ödeme Yapan Taraf Hesabı',
        wrap: true,
        fields: [
          { fieldId: 'payment-means-payer-acc-id',   label: 'Hesap Numarası', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayerFinancialAccount', 'cbc:ID'],           attr: 'value' },
          { fieldId: 'payment-means-payer-acc-cur',  label: 'Para Birimi',    path: ['Invoice', 'cac:PaymentMeans', 'cac:PayerFinancialAccount', 'cbc:CurrencyCode'], attr: 'value', type: 'select', options: CURRENCY_OPTIONS },
          { fieldId: 'payment-means-payer-acc-note', label: 'Not',            path: ['Invoice', 'cac:PaymentMeans', 'cac:PayerFinancialAccount', 'cbc:PaymentNote'],  attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Banka-Şube Bilgileri',
            wrap: true,
            fields: [
              { fieldId: 'payment-means-payer-branch-name', label: 'Adı', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayerFinancialAccount', 'cac:FinancialInstitutionBranch', 'cbc:Name'], attr: 'value' },
            ],
            subgroups: [
              {
                title: 'Banka Bilgileri',
                wrap: true,
                fields: [
                  { fieldId: 'payment-means-payer-bank-name', label: 'Adı', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayerFinancialAccount', 'cac:FinancialInstitutionBranch', 'cac:FinancialInstitution', 'cbc:Name'], attr: 'value' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Ödeme Yapılacak Hesap',
        wrap: true,
        fields: [
          { fieldId: 'payment-means-payee-acc-id',   label: 'Hesap Numarası', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayeeFinancialAccount', 'cbc:ID'],           attr: 'value' },
          { fieldId: 'payment-means-payee-acc-cur',  label: 'Para Birimi',    path: ['Invoice', 'cac:PaymentMeans', 'cac:PayeeFinancialAccount', 'cbc:CurrencyCode'], attr: 'value', type: 'select', options: CURRENCY_OPTIONS },
          { fieldId: 'payment-means-payee-acc-note', label: 'Not',            path: ['Invoice', 'cac:PaymentMeans', 'cac:PayeeFinancialAccount', 'cbc:PaymentNote'],  attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Banka-Şube Bilgileri',
            wrap: true,
            fields: [
              { fieldId: 'payment-means-payee-branch-name', label: 'Adı', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayeeFinancialAccount', 'cac:FinancialInstitutionBranch', 'cbc:Name'], attr: 'value' },
            ],
            subgroups: [
              {
                title: 'Banka Bilgileri',
                wrap: true,
                fields: [
                  { fieldId: 'payment-means-payee-bank-name', label: 'Adı', path: ['Invoice', 'cac:PaymentMeans', 'cac:PayeeFinancialAccount', 'cac:FinancialInstitutionBranch', 'cac:FinancialInstitution', 'cbc:Name'], attr: 'value' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Ödeme Koşulları',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'payment-terms-note',           label: 'Açıklama',              path: ['Invoice', 'cac:PaymentTerms', 'cbc:Note'],                    attr: 'value' },
      { fieldId: 'payment-terms-penalty-pct',    label: 'Gecikme Cezası Oranı', path: ['Invoice', 'cac:PaymentTerms', 'cbc:PenaltySurchargePercent'], attr: 'value', type: 'number' },
      { fieldId: 'payment-terms-amount',         label: 'Ödeme Tutarı',         path: ['Invoice', 'cac:PaymentTerms', 'cbc:Amount'],                  attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'payment-terms-penalty-amount', label: 'Ceza Tutarı',          path: ['Invoice', 'cac:PaymentTerms', 'cbc:PenaltyAmount'],           attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'payment-terms-due-date',       label: 'Son Ödeme Günü',       path: ['Invoice', 'cac:PaymentTerms', 'cbc:PaymentDueDate'],          attr: 'value', type: 'date' },
    ],
    subgroups: [
      {
        title: 'Ödeme Dönemi',
        wrap: true,
        fields: [
          { fieldId: 'payment-terms-period-start-date',  label: 'Başlangıç Tarihi', path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:StartDate'],       attr: 'value', type: 'date' },
          { fieldId: 'payment-terms-period-start-time',  label: 'Başlangıç Saati',  path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:StartTime'],       attr: 'value', type: 'time' },
          { fieldId: 'payment-terms-period-end-date',    label: 'Bitiş Tarihi',     path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:EndDate'],         attr: 'value', type: 'date' },
          { fieldId: 'payment-terms-period-end-time',    label: 'Bitiş Saati',      path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:EndTime'],         attr: 'value', type: 'time' },
          { fieldId: 'payment-terms-period-duration',    label: 'Dönem Süresi',     path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:DurationMeasure'], attr: 'value', type: 'duration-measure', options: DURATION_MEASURE_OPTIONS },
          { fieldId: 'payment-terms-period-description', label: 'Açıklama',         path: ['Invoice', 'cac:PaymentTerms', 'cac:SettlementPeriod', 'cbc:Description'],     attr: 'value' },
        ],
      },
    ],
  },
  {
    title: 'Iskonto/Artırım',
    fullWidth: true,
    repeatable: true,
    instanceMarker: 'cac:AllowanceCharge',
    addLabel: 'Yeni İskonto/Artırım Ekle',
    items: [
      makeAllowanceChargeGroup('invoice-allowance', ['Invoice', 'cac:AllowanceCharge']),
    ],
  },
  { ...makeExchangeRateGroup('Vergi Döviz Kuru',            'tax-exchange',         ['Invoice', 'cac:TaxExchangeRate']),                fullWidth: true },
  { ...makeExchangeRateGroup('Fiyatlandırma Döviz Kuru',    'pricing-exchange',     ['Invoice', 'cac:PricingExchangeRate']),            fullWidth: true },
  { ...makeExchangeRateGroup('Ödeme Döviz Kuru',            'payment-exchange',     ['Invoice', 'cac:PaymentExchangeRate']),            fullWidth: true },
  { ...makeExchangeRateGroup('Alternatif Ödeme Döviz Kuru', 'alt-payment-exchange', ['Invoice', 'cac:PaymentAlternativeExchangeRate']), fullWidth: true },
  makeTaxTotalGroup(
    'Toplam Vergi',
    'tax',
    'cac:TaxTotal',
    ['Invoice', 'cac:TaxTotal'],
    'Yeni Toplam Vergi Ekle',
  ),
  makeTaxTotalGroup(
    'Tevkifat Bilgileri',
    'wtax',
    'cac:WithholdingTaxTotal',
    ['Invoice', 'cac:WithholdingTaxTotal'],
    'Yeni Tevkifat Ekle',
  ),
  {
    title: 'Parasal Toplamlar',
    fullWidth: true,
    wrap: true,
    fields: [
      { fieldId: 'lmt-line-ext',        label: 'Mal/Hizmet Toplam Tutarı', path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:LineExtensionAmount'],   attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-tax-excl',        label: 'Vergiler Hariç Tutar',     path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:TaxExclusiveAmount'],    attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-tax-incl',        label: 'Vergiler Dahil Tutar',     path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:TaxInclusiveAmount'],    attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-allowance-total', label: 'Toplam Iskonto Tutarı',    path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:AllowanceTotalAmount'],  attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-charge-total',    label: 'Toplam Artırım Tutarı',    path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:ChargeTotalAmount'],     attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-rounding',        label: 'Yuvarlama Tutarı',         path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:PayableRoundingAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      { fieldId: 'lmt-payable',         label: 'Ödenecek Tutar',           path: ['Invoice', 'cac:LegalMonetaryTotal', 'cbc:PayableAmount'],         attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
    ],
  },
  {
    title: 'Mal/Hizmet Kalemleri',
    fullWidth: true,
    repeatable: true,
    instanceMarker: 'cac:InvoiceLine',
    addLabel: 'Yeni Kalem Ekle',
    items: [
      { fieldId: 'iline-id',       label: 'Sıra Numarası',     path: ['Invoice', 'cac:InvoiceLine', 'cbc:ID'],                  attr: 'value' },
      { fieldId: 'iline-note',     label: 'Açıklama',          path: ['Invoice', 'cac:InvoiceLine', 'cbc:Note'],                attr: 'value', type: 'notes-list' },
      { fieldId: 'iline-quantity', label: 'Miktar',            path: ['Invoice', 'cac:InvoiceLine', 'cbc:InvoicedQuantity'],    attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
      { fieldId: 'iline-line-ext', label: 'Mal/Hizmet Tutarı', path: ['Invoice', 'cac:InvoiceLine', 'cbc:LineExtensionAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
      {
        title: 'Sipariş Kalemi Referansı',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:OrderLineReference',
        addLabel: 'Yeni Sipariş Kalemi Ekle',
        items: [
          { fieldId: 'iline-order-lineid',       label: 'Kalem Numarası',         path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cbc:LineID'],          attr: 'value' },
          { fieldId: 'iline-order-sales-lineid', label: 'Satıcı Kalem Numarası',  path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cbc:SalesOrderLineID'], attr: 'value' },
          { fieldId: 'iline-order-uuid',         label: 'Ettn',                   path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cbc:UUID'],            attr: 'value' },
          { fieldId: 'iline-order-status',       label: 'Kalem Durumu',           path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cbc:LineStatusCode'],  attr: 'value' },
          {
            title: 'Sipariş Bilgisi',
            wrap: true,
            fields: [
              { fieldId: 'iline-order-ref-id',        label: 'Sipariş Numarası',        path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:ID'],            attr: 'value' },
              { fieldId: 'iline-order-ref-sales-id',  label: 'Satıcı Sipariş Numarası', path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:SalesOrderID'], attr: 'value' },
              { fieldId: 'iline-order-ref-issue',     label: 'Sipariş Tarihi',          path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:IssueDate'],     attr: 'value', type: 'date' },
              { fieldId: 'iline-order-ref-type-code', label: 'Sipariş Tipi',            path: ['Invoice', 'cac:InvoiceLine', 'cac:OrderLineReference', 'cac:OrderReference', 'cbc:OrderTypeCode'], attr: 'value' },
            ],
          },
        ],
      },
      {
        title: 'İrsaliye Kalemi Referansı',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:DespatchLineReference',
        addLabel: 'Yeni İrsaliye Kalemi Ekle',
        items: [
          { fieldId: 'iline-desp-lineid', label: 'Kalem Numarası', path: ['Invoice', 'cac:InvoiceLine', 'cac:DespatchLineReference', 'cbc:LineID'],         attr: 'value' },
          { fieldId: 'iline-desp-status', label: 'Kalem Durumu',   path: ['Invoice', 'cac:InvoiceLine', 'cac:DespatchLineReference', 'cbc:LineStatusCode'], attr: 'value' },
          makeDocumentReferenceGroup('Referans Belge', 'iline-desp-docref', ['Invoice', 'cac:InvoiceLine', 'cac:DespatchLineReference', 'cac:DocumentReference']),
        ],
      },
      {
        title: 'Alındı Kalemi Referansı',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:ReceiptLineReference',
        addLabel: 'Yeni Alındı Kalemi Ekle',
        items: [
          { fieldId: 'iline-rcpt-lineid', label: 'Kalem Numarası', path: ['Invoice', 'cac:InvoiceLine', 'cac:ReceiptLineReference', 'cbc:LineID'],         attr: 'value' },
          { fieldId: 'iline-rcpt-status', label: 'Kalem Durumu',   path: ['Invoice', 'cac:InvoiceLine', 'cac:ReceiptLineReference', 'cbc:LineStatusCode'], attr: 'value' },
          makeDocumentReferenceGroup('Referans Belge', 'iline-rcpt-docref', ['Invoice', 'cac:InvoiceLine', 'cac:ReceiptLineReference', 'cac:DocumentReference']),
        ],
      },
      makeDeliveryGroup('Kalem Teslimatı', 'iline-delivery', ['Invoice', 'cac:InvoiceLine', 'cac:Delivery']),
      {
        title: 'Kalem İskonto/Artırım',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:AllowanceCharge',
        addLabel: 'Yeni Kalem İskonto/Artırım Ekle',
        items: [
          makeAllowanceChargeGroup('iline-ac', ['Invoice', 'cac:InvoiceLine', 'cac:AllowanceCharge']),
        ],
      },
      makeTaxTotalGroup(
        'Kalem Vergisi',
        'iline-tax',
        'cac:TaxTotal',
        ['Invoice', 'cac:InvoiceLine', 'cac:TaxTotal'],
        'Yeni Kalem Vergisi Ekle',
        false,
      ),
      makeTaxTotalGroup(
        'Kalem Tevkifat',
        'iline-wtax',
        'cac:WithholdingTaxTotal',
        ['Invoice', 'cac:InvoiceLine', 'cac:WithholdingTaxTotal'],
        'Yeni Kalem Tevkifatı Ekle',
      ),
      {
        title: 'Mal/Hizmet',
        wrap: true,
        fields: [
          { fieldId: 'iline-item-desc',    label: 'Açıklama',       path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cbc:Description'], attr: 'value' },
          { fieldId: 'iline-item-name',    label: 'Adı',            path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cbc:Name'],        attr: 'value' },
          { fieldId: 'iline-item-keyword', label: 'Anahtar Kelime', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cbc:Keyword'],     attr: 'value' },
          { fieldId: 'iline-item-brand',   label: 'Marka Adı',      path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cbc:BrandName'],   attr: 'value' },
          { fieldId: 'iline-item-model',   label: 'Model Adı',      path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cbc:ModelName'],   attr: 'value' },
        ],
        subgroups: [
          {
            title: 'Alıcı Tanımlama',
            wrap: true,
            fields: [
              { fieldId: 'iline-item-buyer-id', label: 'ID', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:BuyersItemIdentification', 'cbc:ID'], attr: 'value' },
            ],
          },
          {
            title: 'Satıcı Tanımlama',
            wrap: true,
            fields: [
              { fieldId: 'iline-item-seller-id', label: 'ID', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:SellersItemIdentification', 'cbc:ID'], attr: 'value' },
            ],
          },
          {
            title: 'Üretici Tanımlama',
            wrap: true,
            fields: [
              { fieldId: 'iline-item-mfr-id', label: 'ID', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ManufacturersItemIdentification', 'cbc:ID'], attr: 'value' },
            ],
          },
          {
            title: 'Ek Tanımlama',
            fullWidth: true,
            wrap: true,
            repeatable: true,
            instanceMarker: 'cac:AdditionalItemIdentification',
            addLabel: 'Yeni Ek Tanımlama Ekle',
            items: [
              { fieldId: 'iline-item-add-id', label: 'ID', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:AdditionalItemIdentification', 'cbc:ID'], attr: 'value' },
            ],
          },
          {
            title: 'Menşei Ülke',
            wrap: true,
            fields: [
              { fieldId: 'iline-item-origin-code', label: 'Ülke Kodu', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:OriginCountry', 'cbc:IdentificationCode'], attr: 'value' },
              { fieldId: 'iline-item-origin-name', label: 'Ülke Adı',  path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:OriginCountry', 'cbc:Name'],               attr: 'value' },
            ],
          },
          {
            title: 'Emtia Sınıflandırma',
            fullWidth: true,
            wrap: true,
            repeatable: true,
            instanceMarker: 'cac:CommodityClassification',
            addLabel: 'Yeni Sınıflandırma Ekle',
            items: [
              { fieldId: 'iline-item-class-code', label: 'Sınıflandırma Kodu', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:CommodityClassification', 'cbc:ItemClassificationCode'], attr: 'value' },
            ],
          },
          {
            title: 'Ürün Bilgisi',
            fullWidth: true,
            wrap: true,
            repeatable: true,
            instanceMarker: 'cac:ItemInstance',
            addLabel: 'Yeni Ürün Bilgisi Ekle',
            items: [
              { fieldId: 'iline-item-inst-trace',       label: 'Ürün İz Numarası',  path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:ProductTraceID'], attr: 'value' },
              { fieldId: 'iline-item-inst-mfg-date',    label: 'Üretim Tarihi',     path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:ManufactureDate'], attr: 'value', type: 'date' },
              { fieldId: 'iline-item-inst-mfg-time',    label: 'Üretim Saati',      path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:ManufactureTime'], attr: 'value', type: 'time' },
              { fieldId: 'iline-item-inst-best-before', label: 'Son Kullanım Tarihi', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:BestBeforeDate'], attr: 'value', type: 'date' },
              { fieldId: 'iline-item-inst-reg-id',      label: 'Kayıt Numarası',    path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:RegistrationID'], attr: 'value' },
              { fieldId: 'iline-item-inst-serial',      label: 'Seri Numarası',     path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cbc:SerialID'],       attr: 'value' },
              {
                title: 'Lot Tanımlama',
                wrap: true,
                fields: [
                  { fieldId: 'iline-item-inst-lot-num',    label: 'Lot Numarası',        path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:LotIdentification', 'cbc:LotNumberID'], attr: 'value' },
                  { fieldId: 'iline-item-inst-lot-expiry', label: 'Son Kullanım Tarihi', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:LotIdentification', 'cbc:ExpiryDate'],  attr: 'value', type: 'date' },
                ],
              },
              {
                title: 'Ek Özellik',
                fullWidth: true,
                wrap: true,
                repeatable: true,
                instanceMarker: 'cac:AdditionalItemProperty',
                addLabel: 'Yeni Ek Özellik Ekle',
                items: [
                  { fieldId: 'iline-item-inst-prop-id',           label: 'Sıra Numarası',     path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:ID'],             attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-name',         label: 'Adı',               path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:Name'],           attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-name-code',    label: 'İsim Kodu',         path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:NameCode'],       attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-test',         label: 'Test Yöntemi',      path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:TestMethod'],     attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-value',        label: 'Değer',             path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:Value'],          attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-value-qty',    label: 'Değer Miktarı',     path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:ValueQuantity'],  attr: 'value', type: 'number' },
                  { fieldId: 'iline-item-inst-prop-importance',   label: 'Önem Derecesi',     path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:ImportanceCode'], attr: 'value' },
                  { fieldId: 'iline-item-inst-prop-qualifiers',   label: 'Değer Niteleyicisi', path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:ValueQualifier'], attr: 'value', type: 'notes-list' },
                  { fieldId: 'iline-item-inst-prop-list-values',  label: 'Liste Değeri',      path: ['Invoice', 'cac:InvoiceLine', 'cac:Item', 'cac:ItemInstance', 'cac:AdditionalItemProperty', 'cbc:ListValue'],     attr: 'value', type: 'notes-list' },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Fiyat',
        wrap: true,
        fields: [
          { fieldId: 'iline-price-amount', label: 'Birim Fiyat', path: ['Invoice', 'cac:InvoiceLine', 'cac:Price', 'cbc:PriceAmount'], attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
        ],
      },
      {
        title: 'Alt Kalem',
        fullWidth: true,
        wrap: true,
        repeatable: true,
        instanceMarker: 'cac:SubInvoiceLine',
        addLabel: 'Yeni Alt Kalem Ekle',
        items: [
          { fieldId: 'iline-sub-id',       label: 'Sıra Numarası', path: ['Invoice', 'cac:InvoiceLine', 'cac:SubInvoiceLine', 'cbc:ID'],               attr: 'value' },
          { fieldId: 'iline-sub-quantity', label: 'Miktar',        path: ['Invoice', 'cac:InvoiceLine', 'cac:SubInvoiceLine', 'cbc:InvoicedQuantity'], attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
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

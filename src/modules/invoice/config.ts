import type {
  FieldDefinition,
  FieldGroupConfig,
  GroupItem,
} from '../../types'
import { isFieldDefinition } from '../../types'

export const rootTag = 'Invoice'

const DURATION_MEASURE_OPTIONS = [
  { value: 'ANN', label: 'Yıl' },
  { value: 'MON', label: 'Ay' },
  { value: 'DAY', label: 'Gün' },
  { value: 'HUR', label: 'Saat' },
]

function makeAddressGroup(prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title: 'Adres',
    wrap: true,
    fields: [
      { fieldId: `${prefix}-id`,        label: 'Sabit Tanımlama Numarası', path: [...pathBase, 'cbc:ID'],                   attr: 'value' },
      { fieldId: `${prefix}-postbox`,   label: 'Posta Kutusu',             path: [...pathBase, 'cbc:Postbox'],              attr: 'value' },
      { fieldId: `${prefix}-room`,      label: 'İç Kapı No',               path: [...pathBase, 'cbc:Room'],                 attr: 'value' },
      { fieldId: `${prefix}-street`,    label: 'Cadde-Sokak Adı',          path: [...pathBase, 'cbc:StreetName'],           attr: 'value' },
      { fieldId: `${prefix}-block`,     label: 'Blok Adı',                 path: [...pathBase, 'cbc:BlockName'],            attr: 'value' },
      { fieldId: `${prefix}-building`,  label: 'Bina',                     path: [...pathBase, 'cbc:BuildingName'],         attr: 'value' },
      { fieldId: `${prefix}-bnum`,      label: 'Dış Kapı No',              path: [...pathBase, 'cbc:BuildingNumber'],       attr: 'value' },
      { fieldId: `${prefix}-citysub`,   label: 'İlçe-Semt Adı',            path: [...pathBase, 'cbc:CitySubdivisionName'], attr: 'value' },
      { fieldId: `${prefix}-city`,      label: 'İl Adı',                   path: [...pathBase, 'cbc:CityName'],             attr: 'value' },
      { fieldId: `${prefix}-postal`,    label: 'Posta Kodu',               path: [...pathBase, 'cbc:PostalZone'],           attr: 'value' },
      { fieldId: `${prefix}-region`,    label: 'Kasaba-Köy Adı',           path: [...pathBase, 'cbc:Region'],               attr: 'value' },
      { fieldId: `${prefix}-district`,  label: 'Mahalle Adı',              path: [...pathBase, 'cbc:District'],             attr: 'value' },
    ],
    subgroups: [
      {
        title: 'Ülke',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-country-code`, label: 'Ülke Kodu', path: [...pathBase, 'cac:Country', 'cbc:IdentificationCode'], attr: 'value' },
          { fieldId: `${prefix}-country-name`, label: 'Ülke Adı',  path: [...pathBase, 'cac:Country', 'cbc:Name'],               attr: 'value' },
        ],
      },
    ],
  }
}

function makePartyItems(prefix: string, base: string[]): GroupItem[] {
  return [
    { fieldId: `${prefix}-website`,       label: 'Web Sitesi',    path: [...base, 'cbc:WebsiteURI'],                 attr: 'value' },
    { fieldId: `${prefix}-endpoint`,      label: 'EndpointID',    path: [...base, 'cbc:EndpointID'],                 attr: 'value', disabled: true },
    { fieldId: `${prefix}-industry-code`, label: 'Faaliyet Kodu', path: [...base, 'cbc:IndustryClassificationCode'], attr: 'value' },
    { fieldId: `${prefix}-party-id`, label: 'Kimlik Bilgisi', path: [...base, 'cac:PartyIdentification'],
      attr: 'value', type: 'duration-measure', attrKey: 'schemeID',
      options: [{ value: 'TCKN', label: 'Kimlik Numarası' }, { value: 'VKN', label: 'Vergi Numarası' }] },
    { fieldId: `${prefix}-party-name`, label: 'Kurum İsmi', path: [...base, 'cac:PartyName', 'cbc:Name'], attr: 'value' },
    makeAddressGroup(`${prefix}-postal`, [...base, 'cac:PostalAddress']),
    { title: 'Depo Bilgisi', wrap: true,
      fields: [{ fieldId: `${prefix}-loc-id`, label: 'ID', path: [...base, 'cac:PhysicalLocation', 'cbc:ID'], attr: 'value' }],
      subgroups: [makeAddressGroup(`${prefix}-loc-addr`, [...base, 'cac:PhysicalLocation', 'cac:Address'])] },
    { title: 'Vergi Dairesi', wrap: true,
      fields: [
        { fieldId: `${prefix}-tax-reg-name`,   label: 'Yabancı Ülke Kurumu Ünvanı',           path: [...base, 'cac:PartyTaxScheme', 'cbc:RegistrationName'], attr: 'value' },
        { fieldId: `${prefix}-tax-company-id`, label: 'Yabancı Ülke Kurumu Vergi Kayıt Kodu', path: [...base, 'cac:PartyTaxScheme', 'cbc:CompanyID'],        attr: 'value' },
      ],
      subgroups: [{ title: 'Vergi Şeması', wrap: true, fields: [
        { fieldId: `${prefix}-tax-scheme-id`,   label: 'ID',               path: [...base, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:ID'],          attr: 'value' },
        { fieldId: `${prefix}-tax-scheme-name`, label: 'Vergi Dairesi Adı', path: [...base, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:Name'],        attr: 'value' },
        { fieldId: `${prefix}-tax-scheme-type`, label: 'Vergi Tipi Kodu',   path: [...base, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:TaxTypeCode'], attr: 'value', disabled: true },
      ]}] },
    { fieldId: `${prefix}-other-reg`, label: 'Diğer Kayıtlı Olduğu Yerler', path: [], attr: 'value', disabled: true },
    { title: 'İletişim', wrap: true,
      fields: [
        { fieldId: `${prefix}-contact-id`,    label: 'Id',               path: [...base, 'cac:Contact', 'cbc:ID'],             attr: 'value' },
        { fieldId: `${prefix}-contact-name`,  label: 'İsim',             path: [...base, 'cac:Contact', 'cbc:Name'],           attr: 'value' },
        { fieldId: `${prefix}-contact-tel`,   label: 'Telefon Numarası', path: [...base, 'cac:Contact', 'cbc:Telephone'],      attr: 'value' },
        { fieldId: `${prefix}-contact-fax`,   label: 'Fax Numarası',     path: [...base, 'cac:Contact', 'cbc:Telefax'],        attr: 'value' },
        { fieldId: `${prefix}-contact-email`, label: 'E-Posta Adresi',   path: [...base, 'cac:Contact', 'cbc:ElectronicMail'], attr: 'value' },
        { fieldId: `${prefix}-contact-note`,  label: 'Not',              path: [...base, 'cac:Contact', 'cbc:Note'],           attr: 'value' },
      ],
      subgroups: [{ title: 'Diğer Bilgiler', wrap: true, fields: [
        { fieldId: `${prefix}-contact-other-ch-code`, label: 'İletişim Numarası Kodu', path: [...base, 'cac:Contact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
        { fieldId: `${prefix}-contact-other-ch`,      label: 'İletişim Kanal Adı',     path: [...base, 'cac:Contact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
        { fieldId: `${prefix}-contact-other-value`,   label: 'Değer',                  path: [...base, 'cac:Contact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
      ]}] },
    { title: 'Şahıs', wrap: true,
      fields: [
        { fieldId: `${prefix}-person-first`,      label: 'Ad',                        path: [...base, 'cac:Person', 'cbc:FirstName'],                 attr: 'value' },
        { fieldId: `${prefix}-person-family`,     label: 'Soyad',                     path: [...base, 'cac:Person', 'cbc:FamilyName'],                attr: 'value' },
        { fieldId: `${prefix}-person-title`,      label: 'Ünvan',                     path: [...base, 'cac:Person', 'cbc:Title'],                     attr: 'value' },
        { fieldId: `${prefix}-person-middle`,     label: 'Diğer Adı',                 path: [...base, 'cac:Person', 'cbc:MiddleName'],                attr: 'value' },
        { fieldId: `${prefix}-person-suffix`,     label: 'Ad Ön Eki',                 path: [...base, 'cac:Person', 'cbc:NameSuffix'],                attr: 'value' },
        { fieldId: `${prefix}-person-nat`,        label: 'Milliyeti',                 path: [...base, 'cac:Person', 'cbc:NationalityID'],             attr: 'value' },
        { fieldId: `${prefix}-person-id-doc-ref`, label: 'Kimlik Dökümanı Referansı', path: [...base, 'cac:Person', 'cac:IdentityDocumentReference'], attr: 'value', disabled: true },
      ],
      subgroups: [{ title: 'Hesap Bilgileri', wrap: true,
        fields: [
          { fieldId: `${prefix}-person-acc-id`,   label: 'Hesap Numarası', path: [...base, 'cac:Person', 'cac:FinancialAccount', 'cbc:ID'],          attr: 'value' },
          { fieldId: `${prefix}-person-acc-cur`,  label: 'Para Birimi',    path: [...base, 'cac:Person', 'cac:FinancialAccount', 'cbc:CurrencyCode'], attr: 'value' },
          { fieldId: `${prefix}-person-acc-note`, label: 'Not',            path: [...base, 'cac:Person', 'cac:FinancialAccount', 'cbc:PaymentNote'],  attr: 'value' },
        ],
        subgroups: [{ title: 'Banka-Şube Bilgileri', wrap: true,
          fields: [{ fieldId: `${prefix}-person-branch-name`, label: 'Adı', path: [...base, 'cac:Person', 'cac:FinancialAccount', 'cac:FinancialInstitutionBranch', 'cbc:Name'], attr: 'value' }],
          subgroups: [{ title: 'Banka Bilgileri', wrap: true,
            fields: [{ fieldId: `${prefix}-person-bank-name`, label: 'Adı', path: [...base, 'cac:Person', 'cac:FinancialAccount', 'cac:FinancialInstitutionBranch', 'cac:FinancialInstitution', 'cbc:Name'], attr: 'value' }],
          }],
        }],
      }],
    },
  ]
}

function makePartyGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title,
    wrap: true,
    items: [
      ...makePartyItems(prefix, pathBase),
      { title: 'Şube', wrap: true, items: makePartyItems(`${prefix}-branch`, [...pathBase, 'cac:AgentParty']) },
    ],
  }
}

function makeDocumentReferenceGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
  const IP = [...pathBase, 'cac:IssuerParty']
  return {
    title,
    wrap: true,
    fields: [
      { fieldId: `${prefix}-id`,          label: 'Sıra Numarası',    path: [...pathBase, 'cbc:ID'],                  attr: 'value' },
      { fieldId: `${prefix}-issue-date`,  label: 'Düzenleme Tarihi', path: [...pathBase, 'cbc:IssueDate'],           attr: 'value', type: 'date' },
      { fieldId: `${prefix}-type-code`,   label: 'Uygulama Yanıtı',  path: [...pathBase, 'cbc:DocumentTypeCode'],    attr: 'value', disabled: true },
      { fieldId: `${prefix}-type`,        label: 'Belge Tipi',       path: [...pathBase, 'cbc:DocumentType'],        attr: 'value' },
      { fieldId: `${prefix}-description`, label: 'Açıklama',         path: [...pathBase, 'cbc:DocumentDescription'], attr: 'value' },
      { fieldId: `${prefix}-attachment`,  label: 'Ek',               path: [...pathBase, 'cac:Attachment'],          attr: 'value' },
    ],
    subgroups: [
      {
        title: 'Geçerlilik Dönemi',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-period-start-date`,  label: 'Başlangıç Tarihi', path: [...pathBase, 'cac:ValidityPeriod', 'cbc:StartDate'],       attr: 'value', type: 'date' },
          { fieldId: `${prefix}-period-start-time`,  label: 'Başlangıç Saati',  path: [...pathBase, 'cac:ValidityPeriod', 'cbc:StartTime'],       attr: 'value', type: 'time' },
          { fieldId: `${prefix}-period-end-date`,    label: 'Bitiş Tarihi',     path: [...pathBase, 'cac:ValidityPeriod', 'cbc:EndDate'],         attr: 'value', type: 'date' },
          { fieldId: `${prefix}-period-end-time`,    label: 'Bitiş Saati',      path: [...pathBase, 'cac:ValidityPeriod', 'cbc:EndTime'],         attr: 'value', type: 'time' },
          { fieldId: `${prefix}-period-duration`,    label: 'Dönem Süresi',     path: [...pathBase, 'cac:ValidityPeriod', 'cbc:DurationMeasure'], attr: 'value', type: 'duration-measure', options: DURATION_MEASURE_OPTIONS },
          { fieldId: `${prefix}-period-description`, label: 'Açıklama',         path: [...pathBase, 'cac:ValidityPeriod', 'cbc:Description'],     attr: 'value' },
        ],
      },
      makePartyGroup('Düzenleyen', `${prefix}-issuer`, IP),
    ],
  }
}

function makeAllowanceChargeGroup(prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title: 'Iskonto-Artırım',
    wrap: true,
    fields: [
      { fieldId: `${prefix}-charge-indicator`, label: 'Yön',           path: [...pathBase, 'cbc:ChargeIndicator'],         attr: 'value', type: 'select', options: [{ value: '+', label: 'Artı' }, { value: '-', label: 'Eksi' }] },
      { fieldId: `${prefix}-reason`,           label: 'Nedeni',        path: [...pathBase, 'cbc:AllowanceChargeReason'],   attr: 'value' },
      { fieldId: `${prefix}-multiplier`,       label: 'Oranı',         path: [...pathBase, 'cbc:MultiplierFactorNumeric'], attr: 'value', type: 'number' },
      { fieldId: `${prefix}-sequence`,         label: 'Sıra Numarası', path: [...pathBase, 'cbc:SequenceNumeric'],         attr: 'value', type: 'number' },
      { fieldId: `${prefix}-amount`,           label: 'Tutarı',        path: [...pathBase, 'cbc:Amount'],                  attr: 'value', type: 'number' },
      { fieldId: `${prefix}-base-amount`,      label: 'Matrah',        path: [...pathBase, 'cbc:BaseAmount'],              attr: 'value', type: 'number' },
      { fieldId: `${prefix}-per-unit-amount`,  label: 'Adet',          path: [...pathBase, 'cbc:PerUnitAmount'],           attr: 'value', type: 'number' },
    ],
  }
}

export const fieldGroups: FieldGroupConfig[] = [
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
          { value: 'STDKODFATURA',      label: 'Standart Kod Fatura' },
          { value: 'TEMELIRSALIYE',     label: 'Temel İrsaliye' },
          { value: 'HKSIRSALIYE',       label: 'HKS İrsaliye' },
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
]

function collectFields(groups: FieldGroupConfig[]): FieldDefinition[] {
  return groups.flatMap((g) => {
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

export const fieldDefinitions: FieldDefinition[] = collectFields(fieldGroups)

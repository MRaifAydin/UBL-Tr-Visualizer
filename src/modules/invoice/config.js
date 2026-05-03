export const rootTag = 'Invoice'

const DURATION_MEASURE_OPTIONS = [
  { value: 'ANN', label: 'Yıl' },
  { value: 'MON', label: 'Ay' },
  { value: 'DAY', label: 'Gün' },
  { value: 'HUR', label: 'Saat' },
]

function makeAddressGroup(prefix, pathBase) {
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

function makePartyItems(prefix, base) {
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
      subgroups: [makeAddressGroup(`${prefix}-loc`, [...base, 'cac:PhysicalLocation', 'cac:Address'])] },
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

export const fieldGroups = [
  {
    title: 'Belge Genel Bilgileri',
    wide: true,
    fullWidth: true,
    wrap: true,
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
      {
        title: 'Döküman Referansı',
        wrap: true,
        fields: [
          {
            fieldId: 'order-docref-id',
            label: 'Sıra Numarası',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cbc:ID'],
            attr: 'value',
          },
          {
            fieldId: 'order-docref-issue-date',
            label: 'Düzenleme Tarihi',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cbc:IssueDate'],
            attr: 'value',
            type: 'date',
          },
          {
            fieldId: 'order-docref-type-code',
            label: 'Uygulama Yanıtı',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cbc:DocumentTypeCode'],
            attr: 'value',
            disabled: true,
          },
          {
            fieldId: 'order-docref-type',
            label: 'Belge Tipi',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cbc:DocumentType'],
            attr: 'value',
          },
          {
            fieldId: 'order-docref-description',
            label: 'Açıklama',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cbc:DocumentDescription'],
            attr: 'value',
          },
          {
            fieldId: 'order-docref-attachment',
            label: 'Ek',
            path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:Attachment'],
            attr: 'value',
          },
        ],
        subgroups: [
          {
            title: 'Geçerlilik Dönemi',
            wrap: true,
            fields: [
              {
                fieldId: 'order-docref-period-start-date',
                label: 'Başlangıç Tarihi',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:StartDate'],
                attr: 'value',
                type: 'date',
              },
              {
                fieldId: 'order-docref-period-start-time',
                label: 'Başlangıç Saati',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:StartTime'],
                attr: 'value',
                type: 'time',
              },
              {
                fieldId: 'order-docref-period-end-date',
                label: 'Bitiş Tarihi',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:EndDate'],
                attr: 'value',
                type: 'date',
              },
              {
                fieldId: 'order-docref-period-end-time',
                label: 'Bitiş Saati',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:EndTime'],
                attr: 'value',
                type: 'time',
              },
              {
                fieldId: 'order-docref-period-duration',
                label: 'Dönem Süresi',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:DurationMeasure'],
                attr: 'value',
                type: 'duration-measure',
                options: DURATION_MEASURE_OPTIONS,
              },
              {
                fieldId: 'order-docref-period-description',
                label: 'Açıklama',
                path: ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:ValidityPeriod', 'cbc:Description'],
                attr: 'value',
              },
            ],
          },
          (() => {
            const IP = ['Invoice', 'cac:OrderReference', 'cac:DocumentReference', 'cac:IssuerParty']
            return {
              title: 'Düzenleyen',
              wrap: true,
              items: [
                ...makePartyItems('issuer', IP),
                {
                  title: 'Şube',
                  wrap: true,
                  items: makePartyItems('branch', [...IP, 'cac:AgentParty']),
                },
              ],
            }
          })(),
        ],
      },
    ],
  },
]

function collectFields(groups) {
  return groups.flatMap((g) => {
    if (g.items) {
      const fields = g.items.filter((i) => i.fieldId)
      const subs   = g.items.filter((i) => i.title)
      return [...fields, ...collectFields(subs)]
    }
    return [
      ...g.fields,
      ...(g.subgroups ? collectFields(g.subgroups) : []),
    ]
  })
}

export const fieldDefinitions = collectFields(fieldGroups)

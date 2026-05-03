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
                { fieldId: 'issuer-website',       label: 'Web Sitesi',    path: [...IP, 'cbc:WebsiteURI'],                 attr: 'value' },
                { fieldId: 'issuer-endpoint',      label: 'EndpointID',    path: [...IP, 'cbc:EndpointID'],                 attr: 'value', disabled: true },
                { fieldId: 'issuer-industry-code', label: 'Faaliyet Kodu', path: [...IP, 'cbc:IndustryClassificationCode'], attr: 'value' },
                {
                  fieldId: 'issuer-party-id',
                  label: 'Kimlik Bilgisi',
                  path: [...IP, 'cac:PartyIdentification'],
                  attr: 'value',
                  type: 'duration-measure',
                  attrKey: 'schemeID',
                  options: [
                    { value: 'TCKN', label: 'Kimlik Numarası' },
                    { value: 'VKN',  label: 'Vergi Numarası' },
                  ],
                },
                { fieldId: 'issuer-party-name', label: 'Kurum İsmi', path: [...IP, 'cac:PartyName', 'cbc:Name'], attr: 'value' },
                makeAddressGroup('issuer-postal', [...IP, 'cac:PostalAddress']),
                {
                  title: 'Depo Bilgisi',
                  wrap: true,
                  fields: [
                    { fieldId: 'issuer-loc-id', label: 'ID', path: [...IP, 'cac:PhysicalLocation', 'cbc:ID'], attr: 'value' },
                  ],
                  subgroups: [
                    makeAddressGroup('issuer-loc', [...IP, 'cac:PhysicalLocation', 'cac:Address']),
                  ],
                },
                {
                  title: 'Vergi Dairesi',
                  wrap: true,
                  fields: [
                    { fieldId: 'issuer-tax-reg-name',   label: 'Yabancı Ülke Kurumu Ünvanı',           path: [...IP, 'cac:PartyTaxScheme', 'cbc:RegistrationName'], attr: 'value' },
                    { fieldId: 'issuer-tax-company-id', label: 'Yabancı Ülke Kurumu Vergi Kayıt Kodu', path: [...IP, 'cac:PartyTaxScheme', 'cbc:CompanyID'],        attr: 'value' },
                  ],
                  subgroups: [
                    {
                      title: 'Vergi Şeması',
                      wrap: true,
                      fields: [
                        { fieldId: 'issuer-tax-scheme-id',   label: 'ID',               path: [...IP, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:ID'],          attr: 'value' },
                        { fieldId: 'issuer-tax-scheme-name', label: 'Vergi Dairesi Adı', path: [...IP, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:Name'],        attr: 'value' },
                        { fieldId: 'issuer-tax-scheme-type', label: 'Vergi Tipi Kodu',   path: [...IP, 'cac:PartyTaxScheme', 'cac:TaxScheme', 'cbc:TaxTypeCode'], attr: 'value', disabled: true },
                      ],
                    },
                  ],
                },
                { fieldId: 'issuer-other-reg', label: 'Diğer Kayıtlı Olduğu Yerler', path: [], attr: 'value', disabled: true },
                { fieldId: 'issuer-contact',   label: 'İletişim',                    path: [], attr: 'value', disabled: true },
                { fieldId: 'issuer-person',    label: 'Şahıs',                       path: [], attr: 'value', disabled: true },
                { fieldId: 'issuer-branch',    label: 'Şube',                        path: [], attr: 'value', disabled: true },
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

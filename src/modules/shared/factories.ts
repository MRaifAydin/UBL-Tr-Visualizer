import type {
  FieldGroupConfig,
  GroupItem,
} from '../../types'

// Ortak select option setleri — UBL CAC/CBC tipleri fatura ve irsaliye için
// aynı tanımlara sahip; bu yüzden option listeleri ve faktörler tek bir
// kaynakta tutulur. Modüle özgü option setleri (ör. PAYMENT_MEANS_CODE veya
// fatura tipleri) ilgili modülün config.ts'inde kalır.

export const DURATION_MEASURE_OPTIONS = [
  { value: 'ANN', label: 'Yıl' },
  { value: 'MON', label: 'Ay' },
  { value: 'DAY', label: 'Gün' },
  { value: 'HUR', label: 'Saat' },
]

export const CURRENCY_OPTIONS = [
  { value: 'TRY', label: 'Türk Lirası' },
  { value: 'USD', label: 'Dolar' },
  { value: 'EUR', label: 'Euro' },
]

export const WEIGHT_UNIT_OPTIONS = [
  { value: 'KGM', label: 'Kilogram' },
  { value: 'GRM', label: 'Gram' },
]

export const QUANTITY_UNIT_OPTIONS = [
  { value: 'NIU', label: 'Adet' },
  { value: 'KGM', label: 'Kilogram' },
  { value: 'C62', label: 'Birim' },
]

export const TRANSPORT_MODE_OPTIONS = [
  { value: '1', label: 'Denizyolu' },
  { value: '2', label: 'Demiryolu' },
  { value: '3', label: 'Karayolu' },
  { value: '4', label: 'Havayolu' },
  { value: '5', label: 'Posta' },
  { value: '6', label: 'Çok Araçlı' },
  { value: '7', label: 'Sabit Taşıma Tesisleri' },
  { value: '8', label: 'İç Su Taşımacılığı' },
]

export const PACKAGING_TYPE_OPTIONS = [
  { value: 'BA', label: 'Varil' },
  { value: 'BE', label: 'Bohça' },
  { value: 'BG', label: 'Torba' },
  { value: 'BH', label: 'Demet' },
  { value: 'BI', label: 'Çöp Kutusu' },
  { value: 'BJ', label: 'Kova' },
  { value: 'BK', label: 'Sepet' },
  { value: 'BX', label: 'Kutu' },
  { value: 'CB', label: 'Bira Kasası' },
  { value: 'CH', label: 'Sandık' },
  { value: 'CI', label: 'Teneke Kutu' },
  { value: 'CK', label: 'Fıçı' },
  { value: 'CN', label: 'Konteyner' },
  { value: 'CR', label: 'Kasa' },
  { value: 'DK', label: 'Karton Kasa' },
  { value: 'DR', label: 'Bidon' },
  { value: 'EC', label: 'Plastik Torba' },
  { value: 'FC', label: 'Meyve Kasası' },
  { value: 'JR', label: 'Kavanoz' },
  { value: 'LV', label: 'Liftvan' },
  { value: 'NE', label: 'Ambalajsız' },
  { value: 'SA', label: 'Çuval' },
  { value: 'SU', label: 'Bavul' },
  { value: 'TN', label: 'Teneke' },
  { value: 'VG', label: 'Dökme Gaz' },
  { value: 'VL', label: 'Dökme Sıvı' },
  { value: 'VO', label: 'Dökme Katı' },
]

export function makeAddressGroup(prefix: string, pathBase: string[]): FieldGroupConfig {
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

export function makePartyItems(prefix: string, base: string[]): GroupItem[] {
  return [
    { fieldId: `${prefix}-website`,       label: 'Web Sitesi',    path: [...base, 'cbc:WebsiteURI'],                 attr: 'value' },
    { fieldId: `${prefix}-endpoint`,      label: 'EndpointID',    path: [...base, 'cbc:EndpointID'],                 attr: 'value', disabled: true },
    { fieldId: `${prefix}-industry-code`, label: 'Faaliyet Kodu', path: [...base, 'cbc:IndustryClassificationCode'], attr: 'value' },
    { title: 'Kimlik Bilgisi', wrap: true, repeatable: true, instanceMarker: 'cac:PartyIdentification', addLabel: 'Yeni Kimlik Bilgisi Ekle',
      fields: [
        { fieldId: `${prefix}-party-id`, label: 'Kimlik Numarası', path: [...base, 'cac:PartyIdentification', 'cbc:ID'],
          attr: 'value', type: 'duration-measure', attrKey: 'schemeID',
          options: [{ value: 'VKN', label: 'Vergi Kimlik Numarası' }, { value: 'TCKN', label: 'T.C. Kimlik Numarası' }] },
      ] },
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
    { title: 'Taraf Sicil Bilgileri', wrap: true, repeatable: true, instanceMarker: 'cac:PartyLegalEntity', addLabel: 'Yeni Sicil Bilgisi Ekle',
      fields: [
        { fieldId: `${prefix}-legal-name`,       label: 'Kayıt İsmi',        path: [...base, 'cac:PartyLegalEntity', 'cbc:RegistrationName'],            attr: 'value' },
        { fieldId: `${prefix}-legal-company`,    label: 'Kayıt Numarası',    path: [...base, 'cac:PartyLegalEntity', 'cbc:CompanyID'],                   attr: 'value' },
        { fieldId: `${prefix}-legal-date`,       label: 'Kayıt Tarihi',      path: [...base, 'cac:PartyLegalEntity', 'cbc:RegistrationDate'],            attr: 'value', type: 'date' },
        { fieldId: `${prefix}-legal-sole`,       label: 'Şahıs Şirketi mi?', path: [...base, 'cac:PartyLegalEntity', 'cbc:SoleProprietorshipIndicator'], attr: 'value', type: 'select', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
        { fieldId: `${prefix}-legal-stock`,      label: 'Ödenmiş Sermaye',   path: [...base, 'cac:PartyLegalEntity', 'cbc:CorporateStockAmount'],        attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
        { fieldId: `${prefix}-legal-fully-paid`, label: 'Halka Açık mı?',    path: [...base, 'cac:PartyLegalEntity', 'cbc:FullyPaidSharesIndicator'],    attr: 'value', type: 'select', options: [{ value: 'true', label: 'Evet' }, { value: 'false', label: 'Hayır' }] },
      ],
      subgroups: [
        { title: 'Ticaret Sicili', wrap: true,
          fields: [
            { fieldId: `${prefix}-legal-corp-name`, label: 'Ticaret Odası', path: [...base, 'cac:PartyLegalEntity', 'cac:CorporateRegistrationScheme', 'cbc:Name'], attr: 'value' },
          ],
          subgroups: [
            makeAddressGroup(`${prefix}-legal-corp-jur`, [...base, 'cac:PartyLegalEntity', 'cac:CorporateRegistrationScheme', 'cac:JurisdictionRegionAddress']),
          ],
        },
        { title: 'Merkez Bilgisi', wrap: true,
          fields: [
            { fieldId: `${prefix}-legal-head-id`,   label: 'Kimlik Numarası', path: [...base, 'cac:PartyLegalEntity', 'cac:HeadOfficeParty', 'cac:PartyIdentification', 'cbc:ID'], attr: 'value', type: 'duration-measure', attrKey: 'schemeID', options: [{ value: 'VKN', label: 'Vergi Kimlik Numarası' }, { value: 'TCKN', label: 'T.C. Kimlik Numarası' }] },
            { fieldId: `${prefix}-legal-head-name`, label: 'Kurum İsmi',      path: [...base, 'cac:PartyLegalEntity', 'cac:HeadOfficeParty', 'cac:PartyName', 'cbc:Name'],         attr: 'value' },
          ],
          subgroups: [
            makeAddressGroup(`${prefix}-legal-head-addr`, [...base, 'cac:PartyLegalEntity', 'cac:HeadOfficeParty', 'cac:PostalAddress']),
          ],
        },
      ] },
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

export function makePartyGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title,
    wrap: true,
    items: [
      ...makePartyItems(prefix, pathBase),
      { title: 'Şube', wrap: true, items: makePartyItems(`${prefix}-branch`, [...pathBase, 'cac:AgentParty']) },
    ],
  }
}

export function makeDocumentReferenceGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
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

export function makeAllowanceChargeGroup(prefix: string, pathBase: string[]): FieldGroupConfig {
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

export function makeDeliveryGroup(title: string, prefix: string, pathBase: string[]): FieldGroupConfig {
  return {
    title,
    wrap: true,
    fields: [
      { fieldId: `${prefix}-id`,           label: 'Sıra Numarası',         path: [...pathBase, 'cbc:ID'],                  attr: 'value' },
      { fieldId: `${prefix}-quantity`,     label: 'Miktar',                path: [...pathBase, 'cbc:Quantity'],            attr: 'value', type: 'duration-measure', attrKey: 'unitCode', options: QUANTITY_UNIT_OPTIONS },
      { fieldId: `${prefix}-actual-date`,  label: 'Fiili Teslim Tarihi',   path: [...pathBase, 'cbc:ActualDeliveryDate'],  attr: 'value', type: 'date' },
      { fieldId: `${prefix}-actual-time`,  label: 'Fiili Teslim Saati',    path: [...pathBase, 'cbc:ActualDeliveryTime'],  attr: 'value', type: 'time' },
      { fieldId: `${prefix}-latest-date`,  label: 'Son Teslim Tarihi',     path: [...pathBase, 'cbc:LatestDeliveryDate'],  attr: 'value', type: 'date' },
      { fieldId: `${prefix}-latest-time`,  label: 'Son Teslim Saati',      path: [...pathBase, 'cbc:LatestDeliveryTime'],  attr: 'value', type: 'time' },
      { fieldId: `${prefix}-tracking-id`,  label: 'Takip Numarası',        path: [...pathBase, 'cbc:TrackingID'],          attr: 'value' },
    ],
    subgroups: [
      makeAddressGroup(`${prefix}-addr`, [...pathBase, 'cac:DeliveryAddress']),
      {
        title: 'Alternatif Teslim Yeri',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-alt-loc-id`, label: 'ID', path: [...pathBase, 'cac:AlternativeDeliveryLocation', 'cbc:ID'], attr: 'value' },
        ],
        subgroups: [
          makeAddressGroup(`${prefix}-alt-loc-addr`, [...pathBase, 'cac:AlternativeDeliveryLocation', 'cac:Address']),
        ],
      },
      {
        title: 'Tahmini Teslim Dönemi',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-est-period-start-date`,  label: 'Başlangıç Tarihi', path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:StartDate'],       attr: 'value', type: 'date' },
          { fieldId: `${prefix}-est-period-start-time`,  label: 'Başlangıç Saati',  path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:StartTime'],       attr: 'value', type: 'time' },
          { fieldId: `${prefix}-est-period-end-date`,    label: 'Bitiş Tarihi',     path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:EndDate'],         attr: 'value', type: 'date' },
          { fieldId: `${prefix}-est-period-end-time`,    label: 'Bitiş Saati',      path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:EndTime'],         attr: 'value', type: 'time' },
          { fieldId: `${prefix}-est-period-duration`,    label: 'Dönem Süresi',     path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:DurationMeasure'], attr: 'value', type: 'duration-measure', options: DURATION_MEASURE_OPTIONS },
          { fieldId: `${prefix}-est-period-description`, label: 'Açıklama',         path: [...pathBase, 'cac:EstimatedDeliveryPeriod', 'cbc:Description'],     attr: 'value' },
        ],
      },
      makePartyGroup('Taşıyıcı Taraf', `${prefix}-carrier`, [...pathBase, 'cac:CarrierParty']),
      makePartyGroup('Teslimat Yapılacak Taraf', `${prefix}-party`, [...pathBase, 'cac:DeliveryParty']),
      {
        title: 'Gönderi Bilgisi',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-despatch-id`,           label: 'Sıra Numarası',     path: [...pathBase, 'cac:Despatch', 'cbc:ID'],                  attr: 'value' },
          { fieldId: `${prefix}-despatch-actual-date`, label: 'Fiili Sevk Tarihi', path: [...pathBase, 'cac:Despatch', 'cbc:ActualDespatchDate'], attr: 'value', type: 'date' },
          { fieldId: `${prefix}-despatch-actual-time`, label: 'Fiili Sevk Saati',  path: [...pathBase, 'cac:Despatch', 'cbc:ActualDespatchTime'], attr: 'value', type: 'time' },
          { fieldId: `${prefix}-despatch-instructions`, label: 'Açıklama',         path: [...pathBase, 'cac:Despatch', 'cbc:Instructions'],        attr: 'value' },
        ],
        subgroups: [
          makeAddressGroup(`${prefix}-despatch-addr`, [...pathBase, 'cac:Despatch', 'cac:DespatchAddress']),
          makePartyGroup('Gönderim Yapan Taraf', `${prefix}-despatch-party`, [...pathBase, 'cac:Despatch', 'cac:DespatchParty']),
          {
            title: 'İletişim',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-despatch-contact-id`,    label: 'Id',               path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:ID'],             attr: 'value' },
              { fieldId: `${prefix}-despatch-contact-name`,  label: 'İsim',             path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:Name'],           attr: 'value' },
              { fieldId: `${prefix}-despatch-contact-tel`,   label: 'Telefon Numarası', path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:Telephone'],      attr: 'value' },
              { fieldId: `${prefix}-despatch-contact-fax`,   label: 'Fax Numarası',     path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:Telefax'],        attr: 'value' },
              { fieldId: `${prefix}-despatch-contact-email`, label: 'E-Posta Adresi',   path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:ElectronicMail'], attr: 'value' },
              { fieldId: `${prefix}-despatch-contact-note`,  label: 'Not',              path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cbc:Note'],           attr: 'value' },
            ],
            subgroups: [
              {
                title: 'Diğer Bilgiler',
                wrap: true,
                fields: [
                  { fieldId: `${prefix}-despatch-contact-other-ch-code`, label: 'İletişim Numarası Kodu', path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cac:OtherCommunication', 'cbc:ChannelCode'], attr: 'value' },
                  { fieldId: `${prefix}-despatch-contact-other-ch`,      label: 'İletişim Kanal Adı',     path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cac:OtherCommunication', 'cbc:Channel'],     attr: 'value' },
                  { fieldId: `${prefix}-despatch-contact-other-value`,   label: 'Değer',                  path: [...pathBase, 'cac:Despatch', 'cac:Contact', 'cac:OtherCommunication', 'cbc:Value'],       attr: 'value' },
                ],
              },
            ],
          },
          {
            title: 'Tahmini Gönderim Dönemi',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-despatch-est-period-start-date`,  label: 'Başlangıç Tarihi', path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:StartDate'],       attr: 'value', type: 'date' },
              { fieldId: `${prefix}-despatch-est-period-start-time`,  label: 'Başlangıç Saati',  path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:StartTime'],       attr: 'value', type: 'time' },
              { fieldId: `${prefix}-despatch-est-period-end-date`,    label: 'Bitiş Tarihi',     path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:EndDate'],         attr: 'value', type: 'date' },
              { fieldId: `${prefix}-despatch-est-period-end-time`,    label: 'Bitiş Saati',      path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:EndTime'],         attr: 'value', type: 'time' },
              { fieldId: `${prefix}-despatch-est-period-duration`,    label: 'Dönem Süresi',     path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:DurationMeasure'], attr: 'value', type: 'duration-measure', options: DURATION_MEASURE_OPTIONS },
              { fieldId: `${prefix}-despatch-est-period-description`, label: 'Açıklama',         path: [...pathBase, 'cac:Despatch', 'cac:EstimatedDespatchPeriod', 'cbc:Description'],     attr: 'value' },
            ],
          },
        ],
      },
      {
        title: 'Teslimat Koşulları',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-terms-id`,      label: 'Sıra Numarası',  path: [...pathBase, 'cac:DeliveryTerms', 'cbc:ID'],           attr: 'value' },
          { fieldId: `${prefix}-terms-special`, label: 'Özel Koşullar',  path: [...pathBase, 'cac:DeliveryTerms', 'cbc:SpecialTerms'], attr: 'value' },
          { fieldId: `${prefix}-terms-amount`,  label: 'Tutar',          path: [...pathBase, 'cac:DeliveryTerms', 'cbc:Amount'],       attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
        ],
      },
      {
        title: 'Yük/Kargo Bilgileri',
        wrap: true,
        fields: [
          { fieldId: `${prefix}-shipment-id`,                label: 'Sıra Numarası',                 path: [...pathBase, 'cac:Shipment', 'cbc:ID'],                                 attr: 'value' },
          { fieldId: `${prefix}-shipment-handling-code`,     label: 'İşlem Kodu',                    path: [...pathBase, 'cac:Shipment', 'cbc:HandlingCode'],                       attr: 'value' },
          { fieldId: `${prefix}-shipment-handling-instr`,    label: 'Taşıma Talimatları',            path: [...pathBase, 'cac:Shipment', 'cbc:HandlingInstructions'],               attr: 'value' },
          { fieldId: `${prefix}-shipment-gross-weight`,      label: 'Brüt Ağırlık',                  path: [...pathBase, 'cac:Shipment', 'cbc:GrossWeightMeasure'],                 attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: WEIGHT_UNIT_OPTIONS },
          { fieldId: `${prefix}-shipment-net-weight`,        label: 'Net Ağırlık',                   path: [...pathBase, 'cac:Shipment', 'cbc:NetWeightMeasure'],                   attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: WEIGHT_UNIT_OPTIONS },
          { fieldId: `${prefix}-shipment-total-goods-qty`,   label: 'Toplam Mal Sayısı',             path: [...pathBase, 'cac:Shipment', 'cbc:TotalGoodsItemQuantity'],              attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
          { fieldId: `${prefix}-shipment-total-thu-qty`,     label: 'Toplam Taşıma Birimi Sayısı',   path: [...pathBase, 'cac:Shipment', 'cbc:TotalTransportHandlingUnitQuantity'], attr: 'value', type: 'duration-measure', attrKey: 'unitCode',   options: QUANTITY_UNIT_OPTIONS },
          { fieldId: `${prefix}-shipment-insurance`,         label: 'Sigorta Tutarı',                path: [...pathBase, 'cac:Shipment', 'cbc:InsuranceValueAmount'],               attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-shipment-customs-value`,     label: 'Beyan Edilen Gümrük Tutarı',    path: [...pathBase, 'cac:Shipment', 'cbc:DeclaredCustomsValueAmount'],         attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-shipment-carriage-value`,    label: 'Beyan Edilen Taşıma Tutarı',    path: [...pathBase, 'cac:Shipment', 'cbc:DeclaredForCarriageValueAmount'],     attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-shipment-fob`,               label: 'FOB Tutarı',                    path: [...pathBase, 'cac:Shipment', 'cbc:FreeOnBoardValueAmount'],             attr: 'value', type: 'duration-measure', attrKey: 'currencyID', options: CURRENCY_OPTIONS },
          { fieldId: `${prefix}-shipment-special-instr`,     label: 'Özel Talimatlar',               path: [...pathBase, 'cac:Shipment', 'cbc:SpecialInstructions'],                attr: 'value' },
        ],
        subgroups: [
          makeAddressGroup(`${prefix}-shipment-return-addr`, [...pathBase, 'cac:Shipment', 'cac:ReturnAddress']),
          {
            title: 'Eşya Bilgisi',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-shipment-goods-customs-id`, label: 'GTİP No', path: [...pathBase, 'cac:Shipment', 'cac:GoodsItem', 'cbc:RequiredCustomsID'], attr: 'value' },
            ],
          },
          {
            title: 'Taşıma Aşaması',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-shipment-stage-mode`, label: 'Taşıma Gönderim Şekli', path: [...pathBase, 'cac:Shipment', 'cac:ShipmentStage', 'cbc:TransportModeCode'], attr: 'value', type: 'select', options: TRANSPORT_MODE_OPTIONS },
            ],
          },
          {
            title: 'Taşıma Kabı',
            wrap: true,
            fields: [
              { fieldId: `${prefix}-shipment-thu-package-id`,   label: 'Kap Numarası',   path: [...pathBase, 'cac:Shipment', 'cac:TransportHandlingUnit', 'cac:ActualPackage', 'cbc:ID'],                attr: 'value' },
              { fieldId: `${prefix}-shipment-thu-package-qty`,  label: 'Kap Adedi',      path: [...pathBase, 'cac:Shipment', 'cac:TransportHandlingUnit', 'cac:ActualPackage', 'cbc:Quantity'],          attr: 'value', type: 'number' },
              { fieldId: `${prefix}-shipment-thu-package-type`, label: 'Paket/Kap Cinsi', path: [...pathBase, 'cac:Shipment', 'cac:TransportHandlingUnit', 'cac:ActualPackage', 'cbc:PackagingTypeCode'], attr: 'value', type: 'select', options: PACKAGING_TYPE_OPTIONS },
            ],
          },
        ],
      },
    ],
  }
}

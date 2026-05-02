export const rootTag = 'Invoice'

export const fieldGroups = [
  {
    title: 'Belge Genel Bilgileri',
    wide: true,
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
        fieldId: 'invoice-type-code',
        label: 'Fatura Tipi',
        path: ['Invoice', 'InvoiceTypeCode'],
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
        fieldId: 'invoice-currency',
        label: 'Para Birimi',
        path: ['Invoice', 'DocumentCurrencyCode'],
        attr: 'value',
      },
    ],
  },
  {
    title: 'Satıcı Bilgileri',
    fields: [
      {
        fieldId: 'supplier-name',
        label: 'Satıcı Adı',
        path: ['Invoice', 'AccountingSupplierParty', 'Party', 'PartyName', 'Name'],
        attr: 'value',
      },
      {
        fieldId: 'supplier-tax-id',
        label: 'Satıcı Vergi No',
        path: ['Invoice', 'AccountingSupplierParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: 'value',
      },
    ],
  },
  {
    title: 'Alıcı Bilgileri',
    fields: [
      {
        fieldId: 'customer-name',
        label: 'Alıcı Adı',
        path: ['Invoice', 'AccountingCustomerParty', 'Party', 'PartyName', 'Name'],
        attr: 'value',
      },
      {
        fieldId: 'customer-vkn',
        label: 'Alıcı VKN',
        path: ['Invoice', 'AccountingCustomerParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: { schemeID: 'VKN' },
      },
      {
        fieldId: 'customer-tckn',
        label: 'Alıcı TCKN',
        path: ['Invoice', 'AccountingCustomerParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: { schemeID: 'TCKN' },
      },
    ],
  },
  {
    title: 'Mali Bilgiler',
    fields: [
      {
        fieldId: 'payable-amount',
        label: 'Ödenecek Tutar',
        path: ['Invoice', 'LegalMonetaryTotal', 'PayableAmount'],
        attr: 'value',
      },
    ],
  },
]

export const fieldDefinitions = fieldGroups.flatMap((g) => g.fields)

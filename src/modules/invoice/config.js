export const rootTag = 'Invoice'

export const fieldGroups = [
  {
    title: 'Belge Genel Bilgileri',
    fields: [
      {
        fieldId: 'invoice-id',
        label: 'Fatura No',
        path: ['Invoice', 'ID'],
        attr: 'value',
      },
      {
        fieldId: 'invoice-issue-date',
        label: 'Düzenleme Tarihi',
        path: ['Invoice', 'IssueDate'],
        attr: 'value',
      },
      {
        fieldId: 'invoice-type-code',
        label: 'Fatura Tipi',
        path: ['Invoice', 'InvoiceTypeCode'],
        attr: 'value',
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
    newRow: true,
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

export const rootTag = 'DespatchAdvice'

export const fieldGroups = [
  {
    title: 'Belge Genel Bilgileri',
    fields: [
      {
        fieldId: 'despatch-id',
        label: 'İrsaliye No',
        path: ['DespatchAdvice', 'ID'],
        attr: 'value',
      },
      {
        fieldId: 'despatch-issue-date',
        label: 'Düzenleme Tarihi',
        path: ['DespatchAdvice', 'IssueDate'],
        attr: 'value',
      },
      {
        fieldId: 'despatch-type-code',
        label: 'İrsaliye Tipi',
        path: ['DespatchAdvice', 'DespatchAdviceTypeCode'],
        attr: 'value',
      },
    ],
  },
  {
    title: 'Gönderen Bilgileri',
    fields: [
      {
        fieldId: 'despatch-supplier-name',
        label: 'Gönderen Adı',
        path: ['DespatchAdvice', 'DespatchSupplierParty', 'Party', 'PartyName', 'Name'],
        attr: 'value',
      },
      {
        fieldId: 'despatch-supplier-tax-id',
        label: 'Gönderen Vergi No',
        path: ['DespatchAdvice', 'DespatchSupplierParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: 'value',
      },
    ],
  },
  {
    title: 'Alıcı Bilgileri',
    fields: [
      {
        fieldId: 'despatch-customer-name',
        label: 'Alıcı Adı',
        path: ['DespatchAdvice', 'DeliveryCustomerParty', 'Party', 'PartyName', 'Name'],
        attr: 'value',
      },
      {
        fieldId: 'despatch-customer-vkn',
        label: 'Alıcı VKN',
        path: ['DespatchAdvice', 'DeliveryCustomerParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: { schemeID: 'VKN' },
      },
      {
        fieldId: 'despatch-customer-tckn',
        label: 'Alıcı TCKN',
        path: ['DespatchAdvice', 'DeliveryCustomerParty', 'Party', 'PartyTaxScheme', 'CompanyID'],
        attr: { schemeID: 'TCKN' },
      },
    ],
  },
  {
    title: 'Sevkiyat Bilgileri',
    newRow: true,
    fields: [
      {
        fieldId: 'shipment-id',
        label: 'Sevkiyat No',
        path: ['DespatchAdvice', 'Shipment', 'ID'],
        attr: 'value',
      },
      {
        fieldId: 'delivery-date',
        label: 'Teslim Tarihi',
        path: ['DespatchAdvice', 'Shipment', 'Delivery', 'ActualDeliveryDate'],
        attr: 'value',
      },
    ],
  },
]

export const fieldDefinitions = fieldGroups.flatMap((g) => g.fields)

import DocumentPageLayout from './DocumentPageLayout'
import {
  invoiceExcludedGroups,
  invoiceFillScenarios,
  invoiceGroupDefaults,
} from '../modules/invoice/defaults'

export default function InvoicePage() {
  return (
    <DocumentPageLayout
      title="Fatura"
      groupDefaults={invoiceGroupDefaults}
      excludedGroups={invoiceExcludedGroups}
      fillScenarios={invoiceFillScenarios}
    />
  )
}

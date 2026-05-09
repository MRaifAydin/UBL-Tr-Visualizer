import DocumentPageLayout from './DocumentPageLayout'
import {
  creditNoteExcludedGroups,
  creditNoteFillScenarios,
  creditNoteGroupDefaults,
} from '../modules/creditnote/defaults'

export default function CreditNotePage() {
  return (
    <DocumentPageLayout
      title="Müstahsil Makbuzu"
      groupDefaults={creditNoteGroupDefaults}
      excludedGroups={creditNoteExcludedGroups}
      fillScenarios={creditNoteFillScenarios}
    />
  )
}

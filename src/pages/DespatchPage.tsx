import DocumentPageLayout from './DocumentPageLayout'
import {
  despatchExcludedGroups,
  despatchFillScenarios,
  despatchGroupDefaults,
} from '../modules/despatch/defaults'

export default function DespatchPage() {
  return (
    <DocumentPageLayout
      title="İrsaliye"
      groupDefaults={despatchGroupDefaults}
      excludedGroups={despatchExcludedGroups}
      fillScenarios={despatchFillScenarios}
    />
  )
}

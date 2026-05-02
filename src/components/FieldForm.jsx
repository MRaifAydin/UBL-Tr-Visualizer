import { useDocument } from '../context/DocumentContext.jsx'
import { findNodeById } from '../core/treeManager.js'
import FieldGroup from './FieldGroup.jsx'

function FieldInput({ fieldId, label, path, attr }) {
  const { tree, activeFieldId, setActiveFieldId, updateField } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId

  return (
    <div>
      <label
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
      </label>
      <input
        type="text"
        value={currentValue}
        onFocus={() => setActiveFieldId(fieldId)}
        onChange={(e) => updateField(fieldId, path, e.target.value, attr)}
        className={`w-36 rounded border px-2 py-1 text-xs outline-none transition-all ${
          isActive
            ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-300'
        }`}
      />
    </div>
  )
}

export default function FieldForm() {
  const { config } = useDocument()

  return (
    <div className="flex flex-wrap gap-3 content-start">
      {config.fieldGroups.map((group) => (
        <>
          {group.newRow && <div key={`${group.title}-break`} className="w-full" />}
          <FieldGroup key={group.title} title={group.title}>
            {group.fields.map((field) => (
              <FieldInput key={field.fieldId} {...field} />
            ))}
          </FieldGroup>
        </>
      ))}
    </div>
  )
}

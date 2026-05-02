export default function FieldGroup({ title, children }) {
  return (
    <div className="w-fit border border-gray-200 rounded-lg p-3">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </p>
      <div className="flex flex-col gap-2.5">
        {children}
      </div>
    </div>
  )
}

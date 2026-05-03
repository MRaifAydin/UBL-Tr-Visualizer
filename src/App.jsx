import { useDocument } from './context/DocumentContext.jsx'
import InvoicePage from './pages/InvoicePage.jsx'

const SIDEBAR_ITEMS = {
  invoice: {
    label: 'Fatura',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-6.75a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
      </svg>
    ),
  },
}

const PAGES = {
  invoice: <InvoicePage />,
}

export default function App() {
  const { docType, setDocType } = useDocument()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      <nav className="w-16 shrink-0 flex flex-col items-center gap-2 bg-gray-900 pt-4 pb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center mb-4 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5">
            <path fillRule="evenodd" d="M14.447 3.026a.75.75 0 01.527.921l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.527zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
        </div>

        {Object.entries(SIDEBAR_ITEMS).map(([key, { label, icon }]) => (
          <button
            key={key}
            title={label}
            onClick={() => setDocType(key)}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
              docType === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {icon}
            <span className="text-[9px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </nav>

      {PAGES[docType]}
    </div>
  )
}

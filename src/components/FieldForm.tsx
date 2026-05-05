import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useDocument } from '../context/DocumentContext'
import { findNodeById } from '../core/treeManager'
import FieldGroup from './FieldGroup'
import RepeatableFieldGroup from './RepeatableFieldGroup'
import type {
  FieldAttr,
  FieldDefinition,
  FieldGroupConfig,
  GroupItem,
  SelectOption,
} from '../types'
import { isFieldDefinition } from '../types'

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]
const DAYS_TR = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
const MIN_YEAR = 1980
const MAX_YEAR = new Date().getFullYear() + 10
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i)

interface SharedFieldProps {
  wide?: boolean
  fill?: boolean
}

interface FieldProps extends FieldDefinition, SharedFieldProps {}

function FieldError({ show }: { show: boolean }) {
  if (!show) return null
  return <p className="mt-1 text-[11px] text-red-600">Bu alan zorunludur.</p>
}

function FieldInput({ fieldId, label, path, attr, wide, fill, disabled, required, _order }: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId && !disabled
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required
  const w = fill ? 'w-full' : wide ? 'w-48' : 'w-36'

  return (
    <div data-field-id={fieldId}>
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type="text"
          value={currentValue}
          disabled={disabled}
          onFocus={() => !disabled && setActiveFieldId(fieldId)}
          onChange={(e) => !disabled && updateField(fieldId, path, e.target.value, attr, _order)}
          className={`${w} rounded border px-2 py-1 text-xs outline-none transition-all ${
            !disabled && currentValue ? 'pr-5' : ''
          } ${
            disabled
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : hasError
              ? 'border-red-500 ring-1 ring-red-300 bg-white'
              : isActive
              ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-300'
          }`}
        />
        {!disabled && currentValue && (
          <span
            role="button"
            onMouseDown={(e) => {
              e.preventDefault()
              updateField(fieldId, path, '', attr, _order)
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
          >
            ✕
          </span>
        )}
      </div>
      <FieldError show={hasError} />
    </div>
  )
}

function SearchableSelect({ fieldId, label, path, attr, options, wide, fill, required, _order }: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const w = fill ? 'w-full' : wide ? 'w-48' : 'w-36'
  const opts: SelectOption[] = options ?? []
  const selectedLabel = opts.find((o) => o.value === currentValue)?.label ?? currentValue

  const filtered = opts.filter(
    (o) =>
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      o.value.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(option: SelectOption) {
    updateField(fieldId, path, option.value, attr, _order)
    setOpen(false)
    setQuery('')
  }

  function handleOpen() {
    setActiveFieldId(fieldId)
    setOpen(true)
    setQuery('')
  }

  return (
    <div ref={containerRef} data-field-id={fieldId} className="relative">
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {open ? (
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara..."
          className={`${w} rounded border px-2 py-1 text-xs outline-none border-blue-400 ring-1 ring-blue-300 bg-white`}
        />
      ) : (
        <button
          id={fieldId}
          type="button"
          onClick={handleOpen}
          className={`${w} rounded border px-2 py-1 text-xs text-left flex items-center justify-between transition-all ${
            hasError
              ? 'border-red-500 ring-1 ring-red-300 bg-white'
              : isActive
              ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <span className={currentValue ? 'text-gray-800' : 'text-gray-400'}>
            {currentValue ? selectedLabel : 'Seçiniz'}
          </span>
          {currentValue ? (
            <span
              role="button"
              onMouseDown={(e) => {
                e.stopPropagation()
                updateField(fieldId, path, '', attr, _order)
              }}
              className="w-3 h-3 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              ✕
            </span>
          ) : (
            <svg className="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}

      {!open && <FieldError show={hasError} />}

      {open && (
        <ul className="absolute z-10 mt-1 w-64 max-h-52 overflow-y-auto overflow-x-hidden rounded border border-gray-200 bg-white shadow-md text-xs">
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-gray-400">Sonuç bulunamadı</li>
          ) : (
            filtered.map((option) => (
              <li
                key={option.value}
                onMouseDown={() => handleSelect(option)}
                className={`px-2 py-1.5 cursor-pointer hover:bg-blue-50 flex justify-between gap-2 ${
                  option.value === currentValue ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                }`}
              >
                <span>{option.label}</span>
                <span className="text-gray-400 font-mono shrink-0">{option.value}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

type CalendarView = 'calendar' | 'months' | 'years'

function DatePicker({ fieldId, label, path, attr, wide, fill, required, _order }: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<CalendarView>('calendar')
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth())
  const containerRef = useRef<HTMLDivElement | null>(null)
  const yearListRef = useRef<HTMLDivElement | null>(null)

  const w = fill ? 'w-full' : wide ? 'w-48' : 'w-36'
  const displayValue = currentValue ? currentValue.split('-').reverse().join('.') : ''
  const parsed = currentValue ? currentValue.split('-').map(Number) : [0, 0, 0]
  const selYear = currentValue ? parsed[0] : null
  const selMonth = currentValue ? parsed[1] : null
  const selDay = currentValue ? parsed[2] : null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setView('calendar')
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (view === 'years' && yearListRef.current) {
      const el = yearListRef.current.querySelector<HTMLElement>('[data-selected="true"]')
      if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
    }
  }, [view])

  function handleOpen() {
    setActiveFieldId(fieldId)
    if (currentValue && selYear !== null && selMonth !== null) {
      setViewYear(selYear)
      setViewMonth(selMonth - 1)
    } else {
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      updateField(fieldId, path, todayStr, attr, _order)
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
    }
    setView('calendar')
    setOpen(true)
  }

  function handleSelectDay(day: number) {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    updateField(fieldId, path, `${viewYear}-${mm}-${dd}`, attr, _order)
    setOpen(false)
    setView('calendar')
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => Math.max(MIN_YEAR, y - 1)) }
    else setViewMonth((m) => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => Math.min(MAX_YEAR, y + 1)) }
    else setViewMonth((m) => m + 1)
  }

  function prevYear() { setViewYear((y) => Math.max(MIN_YEAR, y - 1)) }
  function nextYear() { setViewYear((y) => Math.min(MAX_YEAR, y + 1)) }

  const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = new Date()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const navBtn = 'px-1 py-0.5 rounded hover:bg-gray-100 text-gray-600 leading-none'

  return (
    <div ref={containerRef} data-field-id={fieldId} className="relative">
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <button
        id={fieldId}
        type="button"
        onClick={handleOpen}
        className={`${w} rounded border px-2 py-1 text-xs text-left flex items-center justify-between transition-all ${
          hasError
            ? 'border-red-500 ring-1 ring-red-300 bg-white'
            : isActive || open
            ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || 'gg.aa.yyyy'}
        </span>
        {currentValue ? (
          <span
            role="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              updateField(fieldId, path, '', attr, _order)
            }}
            className="w-3 h-3 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            ✕
          </span>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {!open && <FieldError show={hasError} />}

      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-md p-2 w-52 text-xs select-none">

          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex gap-0.5">
              <button type="button" onClick={prevYear} className={navBtn}>«</button>
              <button type="button" onClick={prevMonth} className={navBtn}>‹</button>
            </div>
            <div className="flex gap-1 items-center font-medium text-gray-700">
              <button
                type="button"
                onClick={() => setView((v) => v === 'months' ? 'calendar' : 'months')}
                className="hover:text-blue-600 hover:bg-blue-50 px-1 rounded"
              >
                {MONTHS_TR[viewMonth]}
              </button>
              <button
                type="button"
                onClick={() => setView((v) => v === 'years' ? 'calendar' : 'years')}
                className="hover:text-blue-600 hover:bg-blue-50 px-1 rounded"
              >
                {viewYear}
              </button>
            </div>
            <div className="flex gap-0.5">
              <button type="button" onClick={nextMonth} className={navBtn}>›</button>
              <button type="button" onClick={nextYear} className={navBtn}>»</button>
            </div>
          </div>

          {view === 'months' && (
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_TR.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setViewMonth(i); setView('calendar') }}
                  className={`py-1 rounded text-center transition-colors ${
                    i === viewMonth
                      ? 'bg-blue-500 text-white font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {view === 'years' && (
            <div ref={yearListRef} className="max-h-40 overflow-y-auto">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  data-selected={y === viewYear ? 'true' : undefined}
                  onClick={() => { setViewYear(y); setView('months') }}
                  className={`w-full py-0.5 rounded text-center transition-colors ${
                    y === viewYear
                      ? 'bg-blue-500 text-white font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <>
              <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
                {DAYS_TR.map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 text-center">
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />
                  const isSelected =
                    selDay !== null && selMonth !== null && selYear !== null &&
                    day === selDay && viewMonth + 1 === selMonth && viewYear === selYear
                  const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear()
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => handleSelectDay(day)}
                      className={`py-0.5 rounded transition-colors ${
                        isSelected
                          ? 'bg-blue-500 text-white font-medium'
                          : isToday
                          ? 'ring-1 ring-blue-300 text-blue-600 hover:bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NumberInput({ fieldId, label, path, attr, wide, fill, required, _order }: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required
  const w = fill ? 'w-full' : wide ? 'w-48' : 'w-36'

  return (
    <div data-field-id={fieldId}>
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          value={currentValue}
          onFocus={() => setActiveFieldId(fieldId)}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            updateField(fieldId, path, raw, attr, _order)
          }}
          className={`${w} rounded border px-2 py-1 text-xs outline-none transition-all ${
            currentValue ? 'pr-5' : ''
          } ${
            hasError
              ? 'border-red-500 ring-1 ring-red-300 bg-white'
              : isActive
              ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-400 focus:ring-1 focus:ring-blue-300'
          }`}
        />
        {currentValue && (
          <span
            role="button"
            onMouseDown={(e) => {
              e.preventDefault()
              updateField(fieldId, path, '', attr, _order)
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
          >
            ✕
          </span>
        )}
      </div>
      <FieldError show={hasError} />
    </div>
  )
}

interface NoteEntry {
  id: string
  order: number
}

function NotesList({ fieldId, label, path, attr }: FieldProps) {
  const { tree, updateField, removeField, setActiveFieldId, config } = useDocument()
  const [notes, setNotes] = useState<NoteEntry[]>([])
  const counter = useRef(0)

  const anchorOrder = config.fieldDefinitions.findIndex((f) => f.fieldId === fieldId)

  function addNote() {
    counter.current += 1
    const id = `${fieldId}-${counter.current}`
    const order = anchorOrder + counter.current * 0.01
    setNotes((prev) => [...prev, { id, order }])
    updateField(id, path, '', attr, order, true)
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    removeField(id, path)
  }

  function changeNote(id: string, order: number, value: string) {
    updateField(id, path, value, attr, order, true)
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <button
          type="button"
          onClick={addNote}
          className="w-4 h-4 flex items-center justify-center rounded border border-blue-400 text-blue-500 hover:bg-blue-50 shrink-0"
        >
          <svg viewBox="0 0 10 10" fill="currentColor" className="w-2.5 h-2.5">
            <path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z" />
          </svg>
        </button>
      </div>
      {notes.length === 0 && (
        <div className="flex items-center h-[26px]">
          <div className="w-full border-t border-gray-200" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        {notes.map(({ id, order }) => {
          const value = findNodeById(tree, id)?.value ?? ''
          return (
            <div key={id} className="flex items-center gap-1">
              <input
                type="text"
                value={value}
                onFocus={() => setActiveFieldId(id)}
                onChange={(e) => changeNote(id, order, e.target.value)}
                className="w-44 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 bg-white"
              />
              <button
                type="button"
                onClick={() => removeNote(id)}
                className="text-gray-400 hover:text-gray-700 text-xs leading-none"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DurationMeasureInput({
  fieldId,
  label,
  path,
  options,
  fill,
  required,
  attrKey = 'unitCode',
  _order,
}: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const node = findNodeById(tree, fieldId)
  const storedAmount = node?.value ?? ''
  const storedUnit = node?.attr?.[attrKey] ?? ''
  const [localUnit, setLocalUnit] = useState('')
  const isActive = activeFieldId === fieldId
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required
  const opts: SelectOption[] = options ?? []

  const displayUnit = storedUnit || localUnit
  const displayAmount = storedAmount
  const hasValue = displayAmount !== '' || displayUnit !== ''

  function buildAttr(unit: string): FieldAttr {
    return unit ? { [attrKey]: unit } : 'value'
  }

  function handleUnitChange(unit: string) {
    setActiveFieldId(fieldId)
    setLocalUnit(unit)
    if (storedAmount !== '') {
      updateField(fieldId, path, storedAmount, buildAttr(unit), _order)
    }
  }

  function handleAmountChange(raw: string) {
    const amount = raw.replace(/\D/g, '')
    if (amount) {
      updateField(fieldId, path, amount, buildAttr(displayUnit), _order)
    } else {
      updateField(fieldId, path, '', 'value', _order)
    }
  }

  function handleClear() {
    updateField(fieldId, path, '', 'value', _order)
    setLocalUnit('')
  }

  const w = fill ? 'w-full' : 'w-36'
  const borderActive = 'border-blue-400 ring-1 ring-blue-300'
  const borderIdle = 'border-gray-300 hover:border-gray-400'
  const borderError = 'border-red-500 ring-1 ring-red-300'

  return (
    <div data-field-id={fieldId}>
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className={`flex ${w}`}>
        <select
          id={fieldId}
          value={displayUnit}
          onChange={(e) => handleUnitChange(e.target.value)}
          onFocus={() => setActiveFieldId(fieldId)}
          className={`w-16 shrink-0 rounded-l border border-r-0 px-1 py-1 text-xs bg-white outline-none appearance-none text-center cursor-pointer transition-all ${
            hasError ? borderError : isActive ? borderActive : borderIdle
          }`}
        >
          <option value="">—</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={displayAmount}
            onFocus={() => setActiveFieldId(fieldId)}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`w-full rounded-r border px-2 py-1 text-xs outline-none transition-all bg-white ${
              hasValue ? 'pr-5' : ''
            } ${hasError ? borderError : isActive ? borderActive : borderIdle}`}
          />
          {hasValue && (
            <span
              role="button"
              onMouseDown={(e) => { e.preventDefault(); handleClear() }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
            >
              ✕
            </span>
          )}
        </div>
      </div>
      <FieldError show={hasError} />
    </div>
  )
}

interface TimeSpinnerProps {
  value: number
  max: number
  onChange: (value: number) => void
  inputRef: RefObject<HTMLInputElement | null>
  nextRef?: RefObject<HTMLInputElement | null>
}

function TimeSpinner({ value, max, onChange, inputRef, nextRef }: TimeSpinnerProps) {
  const [text, setText] = useState(String(value).padStart(2, '0'))

  useEffect(() => {
    setText(String(value).padStart(2, '0'))
  }, [value])

  function commit(raw: string) {
    const n = Math.min(max, Math.max(0, parseInt(raw, 10) || 0))
    onChange(n)
    setText(String(n).padStart(2, '0'))
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange((value + 1) % (max + 1))}
        className="px-2 py-0.5 rounded hover:bg-gray-100 text-gray-500 leading-none"
      >
        ▲
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
          setText(raw)
          if (raw.length === 2) commit(raw)
        }}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange((value + 1) % (max + 1)) }
          if (e.key === 'ArrowDown') { e.preventDefault(); onChange((value - 1 + max + 1) % (max + 1)) }
          if (e.key === 'Tab' && !e.shiftKey && nextRef?.current) {
            e.preventDefault()
            nextRef.current.focus()
            nextRef.current.select()
          }
        }}
        className="w-8 text-center font-mono text-sm font-semibold text-gray-800 border-b border-gray-300 outline-none focus:border-blue-400 bg-transparent"
      />
      <button
        type="button"
        onClick={() => onChange((value - 1 + max + 1) % (max + 1))}
        className="px-2 py-0.5 rounded hover:bg-gray-100 text-gray-500 leading-none"
      >
        ▼
      </button>
    </div>
  )
}

function TimePicker({ fieldId, label, path, attr, wide, fill, required, _order }: FieldProps) {
  const { tree, activeFieldId, setActiveFieldId, updateField, safeMode, validationErrors } = useDocument()
  const currentValue = findNodeById(tree, fieldId)?.value ?? ''
  const isActive = activeFieldId === fieldId
  const hasError = validationErrors.some((e) => e.fieldId === fieldId)
  const showStar = safeMode && required

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const hourRef = useRef<HTMLInputElement | null>(null)
  const minRef = useRef<HTMLInputElement | null>(null)
  const secRef = useRef<HTMLInputElement | null>(null)

  const w = fill ? 'w-full' : wide ? 'w-48' : 'w-36'

  const displayValue = currentValue ? currentValue.split('.')[0] : ''

  function parseTime(val: string): [number, number, number] {
    if (!val) return [0, 0, 0]
    const parts = val.split('.')[0].split(':')
    return [
      parseInt(parts[0] || '0', 10),
      parseInt(parts[1] || '0', 10),
      parseInt(parts[2] || '0', 10),
    ]
  }

  const [h, m, s] = parseTime(currentValue)

  function saveTime(newH: number, newM: number, newS: number) {
    const hh = String(newH).padStart(2, '0')
    const mm = String(newM).padStart(2, '0')
    const ss = String(newS).padStart(2, '0')
    updateField(fieldId, path, `${hh}:${mm}:${ss}.0000000+00:00`, attr, _order)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleOpen() {
    setActiveFieldId(fieldId)
    if (!currentValue) {
      const now = new Date()
      saveTime(now.getHours(), now.getMinutes(), now.getSeconds())
    }
    setOpen(true)
  }

  return (
    <div ref={containerRef} data-field-id={fieldId} className="relative">
      <label
        htmlFor={fieldId}
        className={`block text-xs font-medium mb-1 transition-colors ${
          isActive ? 'text-blue-600' : 'text-gray-500'
        }`}
      >
        {label}
        {showStar && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <button
        id={fieldId}
        type="button"
        onClick={handleOpen}
        className={`${w} rounded border px-2 py-1 text-xs text-left flex items-center justify-between transition-all ${
          hasError
            ? 'border-red-500 ring-1 ring-red-300 bg-white'
            : isActive || open
            ? 'border-blue-400 ring-1 ring-blue-300 bg-white'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue || 'SS:DD:SN'}
        </span>
        {currentValue ? (
          <span
            role="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              updateField(fieldId, path, '', attr, _order)
            }}
            className="w-3 h-3 shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            ✕
          </span>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        )}
      </button>

      {!open && <FieldError show={hasError} />}

      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded shadow-md p-3 text-xs select-none">
          <div className="flex items-center gap-1">
            <TimeSpinner value={h} max={23} onChange={(v) => saveTime(v, m, s)} inputRef={hourRef} nextRef={minRef} />
            <span className="text-gray-400 font-bold text-base pb-0.5">:</span>
            <TimeSpinner value={m} max={59} onChange={(v) => saveTime(h, v, s)} inputRef={minRef} nextRef={secRef} />
            <span className="text-gray-400 font-bold text-base pb-0.5">:</span>
            <TimeSpinner value={s} max={59} onChange={(v) => saveTime(h, m, v)} inputRef={secRef} />
          </div>
        </div>
      )}
    </div>
  )
}

export function renderField(field: FieldDefinition, shared: SharedFieldProps) {
  if (field.type === 'duration-measure')
    return <DurationMeasureInput key={field.fieldId} {...field} {...shared} />
  if (field.type === 'number')
    return <NumberInput key={field.fieldId} {...field} {...shared} />
  if (field.type === 'notes-list')
    return <NotesList key={field.fieldId} {...field} />
  if (field.type === 'select')
    return <SearchableSelect key={field.fieldId} {...field} {...shared} />
  if (field.type === 'date')
    return <DatePicker key={field.fieldId} {...field} {...shared} />
  if (field.type === 'time')
    return <TimePicker key={field.fieldId} {...field} {...shared} />
  return <FieldInput key={field.fieldId} {...field} {...shared} />
}

export function collectFieldIdsInGroup(group: FieldGroupConfig): string[] {
  const out: string[] = []
  if (group.fields) {
    for (const f of group.fields) out.push(f.fieldId)
  }
  if (group.items) {
    for (const item of group.items) {
      if (isFieldDefinition(item)) out.push(item.fieldId)
      else if (!item.repeatable) out.push(...collectFieldIdsInGroup(item))
    }
  }
  if (group.subgroups) {
    for (const sub of group.subgroups) {
      if (!sub.repeatable) out.push(...collectFieldIdsInGroup(sub))
    }
  }
  return out
}

function renderItem(item: GroupItem, shared: SharedFieldProps, colSpan: string, childDepth: number) {
  if (isFieldDefinition(item)) {
    return renderField(item, shared)
  }
  if (item.repeatable) {
    return (
      <div key={item.title} className={colSpan}>
        <RepeatableFieldGroup group={item} depth={childDepth} />
      </div>
    )
  }
  return (
    <div key={item.title} className={colSpan}>
      <FieldGroup
        title={item.title}
        wrap={item.wrap}
        fullWidth
        collapsible
        depth={childDepth}
        validationFieldIds={collectFieldIdsInGroup(item)}
      >
        {renderGroupChildren(item, childDepth)}
      </FieldGroup>
    </div>
  )
}

export function renderGroupChildren(group: FieldGroupConfig, depth = 0) {
  const shared: SharedFieldProps = { wide: group.wide, fill: !!group.wrap }
  const colSpan = group.wrap ? 'col-span-4' : ''
  const childDepth = depth + 1

  if (group.items) {
    return group.items.map((item) => renderItem(item, shared, colSpan, childDepth))
  }

  return (
    <>
      {(group.fields ?? []).map((field) => renderField(field, shared))}
      {group.subgroups?.map((sub) => {
        if (sub.repeatable) {
          return (
            <div key={sub.title} className={colSpan}>
              <RepeatableFieldGroup group={sub} depth={childDepth} />
            </div>
          )
        }
        return (
          <div key={sub.title} className={colSpan}>
            <FieldGroup
              title={sub.title}
              wrap={sub.wrap}
              fullWidth
              collapsible
              depth={childDepth}
              validationFieldIds={collectFieldIdsInGroup(sub)}
            >
              {renderGroupChildren(sub, childDepth)}
            </FieldGroup>
          </div>
        )
      })}
    </>
  )
}

export default function FieldForm() {
  const { config } = useDocument()

  return (
    <div className="flex flex-wrap gap-3 content-start items-start">
      {config.fieldGroups.map((group) => (
        <Fragment key={group.title}>
          {group.newRow && <div className="w-full" />}
          {group.repeatable ? (
            <RepeatableFieldGroup group={group} depth={0} />
          ) : (
            <FieldGroup
              title={group.title}
              wrap={group.wrap}
              fullWidth={group.fullWidth}
              collapsible
              defaultOpen={!!group.defaultOpen}
              validationFieldIds={collectFieldIdsInGroup(group)}
            >
              {renderGroupChildren(group)}
            </FieldGroup>
          )}
        </Fragment>
      ))}
    </div>
  )
}

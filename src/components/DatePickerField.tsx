import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { format, parseISO } from 'date-fns'
import { Calendar } from 'lucide-react'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}

export default function DatePickerField({ label, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const selected = value ? parseISO(value) : undefined
  const displayValue = selected ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPosition({ top: rect.bottom + 8, left: rect.left })
          }
          setOpen(!open)
        }}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-left transition-all focus:outline-none relative ${
          open
            ? 'border-brand-400 ring-2 ring-brand-500/40'
            : 'border-gray-200 hover:border-gray-300'
        } ${!displayValue ? 'text-gray-400' : 'text-brand-950 font-medium'}`}
      >
        <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <span className="pl-6">{displayValue || 'Selecione a data'}</span>
      </button>

      {open && (
        <div className="fixed z-50 bg-white rounded-2xl shadow-xl border border-brand-100/50 overflow-hidden" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
          <style>{`
            .rdp-root {
              --rdp-accent-color: #7C3AED;
              --rdp-accent-background-color: #EDE9FE;
              --rdp-day-font: 0.875rem;
              font-family: inherit;
              padding: 12px;
            }
            .rdp-day_button {
              border-radius: 8px !important;
              font-size: 0.8rem;
              width: 36px;
              height: 36px;
              transition: all 0.15s;
            }
            .rdp-selected .rdp-day_button {
              background-color: #7C3AED !important;
              color: white !important;
              font-weight: 700;
            }
            .rdp-day_button:hover:not([disabled]) {
              background-color: #EDE9FE !important;
              color: #5B21B6 !important;
            }
            .rdp-today .rdp-day_button {
              border: 2px solid #7C3AED;
              font-weight: 700;
              color: #7C3AED;
            }
            .rdp-nav button {
              color: #7C3AED;
              border-radius: 8px;
              padding: 4px;
            }
            .rdp-nav button:hover {
              background-color: #EDE9FE;
            }
            .rdp-month_caption {
              font-size: 0.875rem;
              font-weight: 700;
              color: #1e1b4b;
              text-transform: capitalize;
              padding-bottom: 8px;
            }
            .rdp-weekday {
              font-size: 0.7rem;
              color: #9ca3af;
              font-weight: 600;
              text-transform: uppercase;
            }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
            locale={ptBR}
            weekStartsOn={0}
          />
        </div>
      )}
    </div>
  )
}

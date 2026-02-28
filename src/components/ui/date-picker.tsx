'use client'

import { useState, useEffect, useRef } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string | null
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  name?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date', className = '', required, name }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + 'T12:00:00') : new Date())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (value) setViewMonth(new Date(value + 'T12:00:00'))
  }, [value])

  const selectedDate = value ? new Date(value + 'T12:00:00') : null
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const handleSelect = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={value || ''} />}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-sm transition-colors hover:bg-primary-5 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary ${
          value ? 'text-primary' : 'text-muted'
        }`}
      >
        <Calendar className="w-4 h-4 text-muted shrink-0" />
        {selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-xl shadow-nav p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 text-muted hover:text-primary rounded transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-primary">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 text-muted hover:text-primary rounded transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {weekdays.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth)
              const selected = selectedDate && isSameDay(day, selectedDate)
              const today = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-secondary text-white'
                      : today
                      ? 'bg-secondary-10 text-secondary font-semibold'
                      : inMonth
                      ? 'text-primary hover:bg-primary-5'
                      : 'text-muted/40'
                  }`}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full mt-2 text-xs text-muted hover:text-primary text-center py-1"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  )
}

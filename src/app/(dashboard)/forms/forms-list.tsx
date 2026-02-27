'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, FileEdit } from 'lucide-react'
import type { Form } from '@/types/database'

interface FormsListProps {
  forms: Form[]
  submissionCounts: Record<string, number>
}

const FORM_TYPE_LABELS: Record<string, string> = {
  check_in: 'Check-in Template',
  intake: 'Intake Form',
  session: 'Session / Consultation',
  general: 'General',
}

export function FormsList({ forms, submissionCounts }: FormsListProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return forms
    return forms.filter((f) => (f.form_type || 'general') === typeFilter)
  }, [forms, typeFilter])

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary"
        >
          <option value="all">All types</option>
          <option value="check_in">Check-in Template</option>
          <option value="intake">Intake Form</option>
          <option value="session">Session / Consultation</option>
          <option value="general">General</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((form) => (
          <Link
            key={form.id}
            href={`/forms/${form.id}`}
            className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center">
                <FileEdit className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex items-center gap-2">
                {(form.form_type && form.form_type !== 'general') && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-muted border border-border">
                    {FORM_TYPE_LABELS[form.form_type] || form.form_type}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  form.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700'
                    : form.status === 'archived'
                    ? 'bg-primary-5 text-muted'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </span>
              </div>
            </div>

            <h3 className="text-primary font-semibold mb-1">{form.title}</h3>
            {form.description && (
              <p className="text-sm text-muted line-clamp-2 mb-4">{form.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {(form.fields as unknown[])?.length || 0} fields
              </span>
              <span>
                {submissionCounts[form.id] || 0} responses
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

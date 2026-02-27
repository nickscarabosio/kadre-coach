'use client'

import { useState } from 'react'
import { Form } from '@/types/database'
import { submitForm } from '@/app/(dashboard)/forms/actions'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
}

export function PublicForm({ form }: { form: Form }) {
  const fields = (form.fields as unknown as FormField[]) || []
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setValue = (fieldId: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validate required fields
    for (const field of fields) {
      if (field.required && !responses[field.id]) {
        setError(`"${field.label}" is required`)
        setSubmitting(false)
        return
      }
    }

    const result = await submitForm(form.id, {
      submitter_name: name || undefined,
      submitter_email: email || undefined,
      responses,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 shadow-card text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-xl font-bold text-primary mb-2">Thank you!</h2>
        <p className="text-muted">Your response has been submitted.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-surface border border-border rounded-xl p-8 shadow-card">
        <h1 className="text-2xl font-bold text-primary mb-2">{form.title}</h1>
        {form.description && <p className="text-muted mb-6">{form.description}</p>}

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">{error}</div>}

        <div className="space-y-6">
          {/* Name and email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Your Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" placeholder="Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">Your Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" placeholder="Email" />
            </div>
          </div>

          {/* Dynamic fields */}
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-primary mb-1.5">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-muted mb-1.5">{field.description}</p>}

              {field.type === 'text' && <input type="text" placeholder={field.placeholder} value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" />}
              {field.type === 'email' && <input type="email" placeholder={field.placeholder} value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" />}
              {field.type === 'number' && <input type="number" placeholder={field.placeholder} value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" />}
              {field.type === 'date' && <input type="date" value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary" />}
              {field.type === 'textarea' && <textarea placeholder={field.placeholder} value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none" />}
              {field.type === 'select' && (
                <select value={(responses[field.id] as string) || ''} onChange={e => setValue(field.id, e.target.value)} className="w-full px-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary">
                  <option value="">Select...</option>
                  {(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              )}
              {field.type === 'radio' && (
                <div className="space-y-2">{(field.options || []).map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-primary"><input type="radio" name={field.id} value={o} checked={responses[field.id] === o} onChange={() => setValue(field.id, o)} className="text-secondary" />{o}</label>
                ))}</div>
              )}
              {field.type === 'checkbox' && (
                <div className="space-y-2">{(field.options || []).map((o, i) => {
                  const checked = ((responses[field.id] as string[]) || []).includes(o)
                  return (
                    <label key={i} className="flex items-center gap-2 text-sm text-primary">
                      <input type="checkbox" checked={checked} onChange={() => {
                        const current = (responses[field.id] as string[]) || []
                        setValue(field.id, checked ? current.filter(v => v !== o) : [...current, o])
                      }} className="text-secondary rounded" />
                      {o}
                    </label>
                  )
                })}</div>
              )}
              {field.type === 'rating' && (
                <div className="flex gap-1">{Array.from({ length: 10 }, (_, i) => (
                  <button key={i} type="button" onClick={() => setValue(field.id, i + 1)} className={`w-8 h-8 rounded-lg border text-sm transition-colors ${responses[field.id] === i + 1 ? 'bg-secondary text-white border-secondary' : 'bg-primary-5 border-border-strong text-muted hover:border-secondary'}`}>{i + 1}</button>
                ))}</div>
              )}
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <button type="submit" disabled={submitting} className="mt-8 w-full py-2.5 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-white font-medium rounded-lg transition-colors">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted mt-4">Powered by Kadre Coach</p>
    </form>
  )
}

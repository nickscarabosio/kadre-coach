'use client'

import { FormField } from './form-builder'

interface FormPreviewProps {
  title: string
  description: string
  fields: FormField[]
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-surface border border-border rounded-xl p-8 shadow-card">
        <h1 className="text-2xl font-bold text-primary mb-2">{title || 'Untitled Form'}</h1>
        {description && <p className="text-muted mb-6">{description}</p>}

        <div className="space-y-6">
          {fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-primary mb-1.5">
                {field.label || 'Untitled'} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.description && <p className="text-xs text-muted mb-1.5">{field.description}</p>}

              {field.type === 'text' && <input type="text" placeholder={field.placeholder} disabled className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary" />}
              {field.type === 'email' && <input type="email" placeholder={field.placeholder} disabled className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary" />}
              {field.type === 'number' && <input type="number" placeholder={field.placeholder} disabled className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary" />}
              {field.type === 'date' && <input type="date" disabled className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary" />}
              {field.type === 'textarea' && <textarea placeholder={field.placeholder} disabled rows={3} className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary resize-none" />}
              {field.type === 'select' && (
                <select disabled className="w-full px-4 py-2.5 bg-primary-5 border border-border-strong rounded-lg text-primary">
                  <option>Select...</option>
                  {(field.options || []).map((o, i) => <option key={i}>{o}</option>)}
                </select>
              )}
              {field.type === 'radio' && (
                <div className="space-y-2">{(field.options || []).map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-primary"><input type="radio" name={field.id} disabled className="text-secondary" />{o}</label>
                ))}</div>
              )}
              {field.type === 'checkbox' && (
                <div className="space-y-2">{(field.options || []).map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" disabled className="text-secondary rounded" />{o}</label>
                ))}</div>
              )}
              {field.type === 'rating' && (
                <div className="flex gap-1">{Array.from({ length: 10 }, (_, i) => (
                  <button key={i} disabled className="w-8 h-8 rounded-lg bg-primary-5 border border-border-strong text-sm text-muted">{i + 1}</button>
                ))}</div>
              )}
            </div>
          ))}
        </div>

        {fields.length > 0 && (
          <button disabled className="mt-8 w-full py-2.5 bg-secondary/50 text-white font-medium rounded-lg">Submit (Preview)</button>
        )}
      </div>
    </div>
  )
}

'use client'

import { FormField } from './form-builder'
import { Plus, X } from 'lucide-react'

interface FieldEditorProps {
  field: FormField
  onChange: (updates: Partial<FormField>) => void
}

export function FieldEditor({ field, onChange }: FieldEditorProps) {
  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Label</label>
        <input value={field.label} onChange={e => onChange({ label: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Field label" />
      </div>

      {field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select' && field.type !== 'rating' && (
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Placeholder</label>
          <input value={field.placeholder || ''} onChange={e => onChange({ placeholder: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Placeholder text" />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted mb-1">Description (optional)</label>
        <input value={field.description || ''} onChange={e => onChange({ description: e.target.value })} className="w-full px-3 py-2 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" placeholder="Help text for this field" />
      </div>

      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Options</label>
          <div className="space-y-1.5">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={opt} onChange={e => {
                  const newOpts = [...(field.options || [])]
                  newOpts[i] = e.target.value
                  onChange({ options: newOpts })
                }} className="flex-1 px-3 py-1.5 bg-surface border border-border-strong rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary/40" />
                <button onClick={() => onChange({ options: (field.options || []).filter((_, j) => j !== i) })} className="text-muted hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <button onClick={() => onChange({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })} className="text-xs text-secondary hover:text-secondary/80 flex items-center gap-1"><Plus className="w-3 h-3" />Add option</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" checked={field.required} onChange={e => onChange({ required: e.target.checked })} id={`req-${field.id}`} className="w-4 h-4 rounded border-border-strong text-secondary focus:ring-secondary/40" />
        <label htmlFor={`req-${field.id}`} className="text-sm text-primary">Required</label>
      </div>
    </div>
  )
}

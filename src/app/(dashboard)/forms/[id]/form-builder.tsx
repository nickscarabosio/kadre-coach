'use client'

import { useState } from 'react'
import { Form, FormSubmission } from '@/types/database'
import { updateForm, deleteForm, generatePublicLink, duplicateForm } from '../actions'
import { FieldEditor } from './field-editor'
import { FormPreview } from './form-preview'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, Eye, Copy, Globe, Link as LinkIcon, Save, ArrowLeft } from 'lucide-react'

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
}

interface FormBuilderProps {
  form: Form
  submissions: FormSubmission[]
}

export function FormBuilder({ form, submissions }: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>((form.fields as unknown as FormField[]) || [])
  const [title, setTitle] = useState(form.title)
  const [description, setDescription] = useState(form.description || '')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState(form.public_token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${form.public_token}` : '')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'builder' | 'submissions'>('builder')
  const router = useRouter()

  const handleSave = async () => {
    setSaving(true)
    await updateForm(form.id, { title, description: description || undefined, fields: fields as unknown[] })
    setSaving(false)
  }

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1'] : undefined,
    }
    setFields([...fields, newField])
    setEditingField(newField.id)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
    if (editingField === id) setEditingField(null)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(fields)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    setFields(reordered)
  }

  const handlePublish = async () => {
    const result = await generatePublicLink(form.id)
    if (result.token) {
      const url = `${window.location.origin}/f/${result.token}`
      setPublicUrl(url)
    }
    router.refresh()
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDuplicate = async () => {
    await duplicateForm(form.id)
    router.push('/forms')
  }

  const handleDelete = async () => {
    if (confirm('Delete this form? This cannot be undone.')) {
      await deleteForm(form.id)
    }
  }

  const fieldTypes: { type: FormField['type']; label: string }[] = [
    { type: 'text', label: 'Short Text' },
    { type: 'textarea', label: 'Long Text' },
    { type: 'email', label: 'Email' },
    { type: 'number', label: 'Number' },
    { type: 'date', label: 'Date' },
    { type: 'select', label: 'Dropdown' },
    { type: 'radio', label: 'Multiple Choice' },
    { type: 'checkbox', label: 'Checkboxes' },
    { type: 'rating', label: 'Rating (1-10)' },
  ]

  if (showPreview) {
    return (
      <div>
        <button onClick={() => setShowPreview(false)} className="mb-4 flex items-center gap-2 text-muted hover:text-primary">
          <ArrowLeft className="w-4 h-4" /> Back to Editor
        </button>
        <FormPreview title={title} description={description} fields={fields} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 mr-4">
          <input value={title} onChange={e => setTitle(e.target.value)} className="text-3xl font-bold text-primary bg-transparent border-none outline-none w-full" placeholder="Form title" />
          <input value={description} onChange={e => setDescription(e.target.value)} className="text-muted bg-transparent border-none outline-none w-full mt-1" placeholder="Add a description..." />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-primary hover:bg-primary-5 rounded-lg transition-colors"><Eye className="w-4 h-4" />Preview</button>
          <button onClick={handleDuplicate} className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted hover:text-primary hover:bg-primary-5 rounded-lg transition-colors"><Copy className="w-4 h-4" />Duplicate</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/90 text-white font-medium rounded-lg transition-colors text-sm"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {/* Public link bar */}
      {publicUrl ? (
        <div className="flex items-center gap-3 mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700 font-medium">Published</span>
          <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">{publicUrl}</code>
          <button onClick={handleCopyLink} className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">{copied ? 'Copied!' : 'Copy Link'}</button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <LinkIcon className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700">Draft — save and publish to share</span>
          <button onClick={handlePublish} className="ml-auto text-xs px-3 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700">Publish</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-primary-5 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('builder')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'builder' ? 'bg-secondary text-white' : 'text-muted hover:text-primary'}`}>Builder</button>
        <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'submissions' ? 'bg-secondary text-white' : 'text-muted hover:text-primary'}`}>Submissions ({submissions.length})</button>
      </div>

      {activeTab === 'builder' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Field list */}
          <div className="lg:col-span-3">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-surface border rounded-xl p-4 ${snapshot.isDragging ? 'border-secondary shadow-lg' : 'border-border'} ${editingField === field.id ? 'ring-2 ring-secondary/20' : ''}`}>
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="text-muted hover:text-primary cursor-grab"><GripVertical className="w-4 h-4" /></div>
                              <div className="flex-1 cursor-pointer" onClick={() => setEditingField(editingField === field.id ? null : field.id)}>
                                <p className="text-sm font-medium text-primary">{field.label || 'Untitled field'}</p>
                                <p className="text-xs text-muted">{fieldTypes.find(t => t.type === field.type)?.label} {field.required ? '• Required' : ''}</p>
                              </div>
                              <button onClick={() => removeField(field.id)} className="text-muted hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            {editingField === field.id && (
                              <FieldEditor field={field} onChange={(updates) => updateField(field.id, updates)} />
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {fields.length === 0 && (
              <div className="text-center py-12 bg-surface border border-border rounded-xl">
                <p className="text-muted mb-2">No fields yet</p>
                <p className="text-sm text-muted">Add fields from the panel on the right</p>
              </div>
            )}
          </div>

          {/* Add field panel */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-xl p-4 sticky top-20">
              <h3 className="text-sm font-semibold text-primary mb-3">Add Field</h3>
              <div className="space-y-1.5">
                {fieldTypes.map(({ type, label }) => (
                  <button key={type} onClick={() => addField(type)} className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary-5 rounded-lg transition-colors flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-muted" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="mt-4 bg-surface border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
              <button onClick={handleDelete} className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Form
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Submissions tab */
        <div className="bg-surface border border-border rounded-xl shadow-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-primary">Submissions</h2>
            {submissions.length > 0 && (
              <button onClick={() => {
                const headers = ['Submitted At', 'Name', 'Email', ...fields.map(f => f.label)]
                const rows = submissions.map(s => {
                  const r = s.responses as Record<string, unknown>
                  return [s.submitted_at, s.submitter_name || '', s.submitter_email || '', ...fields.map(f => String(r[f.id] || ''))]
                })
                const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${form.title}-submissions.csv`
                a.click()
                URL.revokeObjectURL(url)
              }} className="text-sm px-3 py-1.5 bg-primary-5 hover:bg-primary-10 text-primary rounded-lg border border-border-strong transition-colors">Export CSV</button>
            )}
          </div>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-primary-5">
                  <th className="text-left p-3 font-medium text-muted">Date</th>
                  <th className="text-left p-3 font-medium text-muted">Name</th>
                  <th className="text-left p-3 font-medium text-muted">Email</th>
                  {fields.slice(0, 4).map(f => <th key={f.id} className="text-left p-3 font-medium text-muted">{f.label}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {submissions.map(s => {
                    const r = s.responses as Record<string, unknown>
                    return (
                      <tr key={s.id} className="hover:bg-primary-5">
                        <td className="p-3 text-muted whitespace-nowrap">{new Date(s.submitted_at).toLocaleDateString()}</td>
                        <td className="p-3 text-primary">{s.submitter_name || '—'}</td>
                        <td className="p-3 text-primary">{s.submitter_email || '—'}</td>
                        {fields.slice(0, 4).map(f => <td key={f.id} className="p-3 text-primary max-w-[200px] truncate">{String(r[f.id] || '—')}</td>)}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center"><p className="text-muted">No submissions yet</p></div>
          )}
        </div>
      )}
    </div>
  )
}

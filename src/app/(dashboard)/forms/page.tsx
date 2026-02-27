import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Globe, FileEdit } from 'lucide-react'
import { AddFormButton } from './add-form-button'

export default async function FormsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: forms } = user ? await supabase
    .from('forms')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  // Get submission counts
  const { data: submissions } = user ? await supabase
    .from('form_submissions')
    .select('form_id')
    .in('form_id', forms?.map(f => f.id) || []) : { data: null }

  const submissionCounts = (submissions || []).reduce((acc, s) => {
    acc[s.form_id] = (acc[s.form_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Forms</h1>
          <p className="text-muted mt-1">{forms?.length || 0} forms</p>
        </div>
        <AddFormButton />
      </div>

      {forms && forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/forms/${form.id}`}
              className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-secondary" />
                </div>
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

              <h3 className="text-primary font-semibold mb-1">{form.title}</h3>
              {form.description && (
                <p className="text-sm text-muted line-clamp-2 mb-4">{form.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {(form.fields as unknown[])?.length || 0} fields
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {submissionCounts[form.id] || 0} responses
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <FileEdit className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No forms yet</h3>
          <p className="text-muted mb-4">Create your first form to collect responses</p>
          <AddFormButton />
        </div>
      )}
    </div>
  )
}

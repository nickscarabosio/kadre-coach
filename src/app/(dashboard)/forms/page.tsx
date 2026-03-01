import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { FileEdit } from 'lucide-react'
import { FormsList } from './forms-list'

export const dynamic = 'force-dynamic'

export default async function FormsPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: forms } = await supabase
    .from('forms')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  // Get submission counts
  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('form_id')
    .in('form_id', forms?.map(f => f.id) || [])

  const submissionCounts = (submissions || []).reduce((acc, s) => {
    acc[s.form_id] = (acc[s.form_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Forms</h1>
          <p className="text-muted mt-1">{forms?.length || 0} forms</p>
        </div>
      </div>

      {forms && forms.length > 0 ? (
        <FormsList forms={forms} submissionCounts={submissionCounts} />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <FileEdit className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No forms yet</h3>
          <p className="text-muted mb-4">Create your first form to collect responses</p>
        </div>
      )}
    </div>
  )
}

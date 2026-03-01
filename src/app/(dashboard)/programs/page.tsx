import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { BookOpen } from 'lucide-react'
import { ProgramsList } from './programs-list'

export const dynamic = 'force-dynamic'

export default async function ProgramsPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  // Get enrollment counts per program
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('program_id')
    .in('program_id', programs?.map(p => p.id) || [])

  const enrollmentCounts = (enrollments || []).reduce((acc, e) => {
    acc[e.program_id] = (acc[e.program_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get phase counts per program
  const { data: phases } = await supabase
    .from('program_phases')
    .select('program_id')
    .in('program_id', programs?.map(p => p.id) || [])

  const phaseCounts = (phases || []).reduce((acc, p) => {
    acc[p.program_id] = (acc[p.program_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Programs</h1>
          <p className="text-muted mt-1">{programs?.length || 0} programs</p>
        </div>
      </div>

      {programs && programs.length > 0 ? (
        <ProgramsList
          programs={programs}
          enrollmentCounts={enrollmentCounts}
          phaseCounts={phaseCounts}
        />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No programs yet</h3>
          <p className="text-muted mb-4">Create your first coaching program</p>
        </div>
      )}
    </div>
  )
}

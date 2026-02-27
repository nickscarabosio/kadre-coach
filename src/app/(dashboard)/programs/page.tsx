import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import Link from 'next/link'
import { BookOpen, Clock, Users, Layers } from 'lucide-react'
import { AddProgramButton } from './add-program-button'

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Programs</h1>
          <p className="text-muted mt-1">{programs?.length || 0} programs</p>
        </div>
        <AddProgramButton />
      </div>

      {programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-secondary" />
                </div>
                {program.is_template && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-muted border border-border">
                    Template
                  </span>
                )}
              </div>

              <h3 className="text-primary font-semibold mb-1">{program.name}</h3>
              {program.description && (
                <p className="text-sm text-muted line-clamp-2 mb-4">{program.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {program.duration_weeks}w
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-4 h-4" />
                  {phaseCounts[program.id] || 0} phases
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {enrollmentCounts[program.id] || 0} enrolled
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No programs yet</h3>
          <p className="text-muted mb-4">Create your first coaching program</p>
          <AddProgramButton />
        </div>
      )}
    </div>
  )
}

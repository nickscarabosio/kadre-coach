import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Building, CheckCircle, Circle, Mail } from 'lucide-react'
import { PhaseBuilder } from './phase-builder'
import { AssignDialog } from './assign-dialog'
import { Client, Enrollment, AssignedAssignment } from '@/types/database'

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: program, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !program) {
    notFound()
  }

  // Fetch phases
  const { data: phases } = await supabase
    .from('program_phases')
    .select('*')
    .eq('program_id', id)
    .order('order_index')

  // Fetch assignments for all phases
  const phaseIds = (phases || []).map(p => p.id)
  const { data: assignments } = phaseIds.length > 0
    ? await supabase
        .from('program_assignments')
        .select('*')
        .in('phase_id', phaseIds)
        .order('order_index')
    : { data: [] }

  // Fetch enrollments with client data
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, clients(*)')
    .eq('program_id', id)

  // Fetch assigned assignments for this program's enrollments
  const enrollmentIds = (enrollments || []).map(e => e.id)
  const { data: assignedAssignments } = enrollmentIds.length > 0
    ? await supabase
        .from('assigned_assignments')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .order('created_at')
    : { data: [] }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/programs"
        className="inline-flex items-center gap-2 text-muted hover:text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Programs
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">{program.name}</h1>
          {program.description && (
            <p className="text-muted max-w-2xl">{program.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {program.duration_weeks} weeks
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {enrollments?.length || 0} enrolled
            </span>
            {program.is_template && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-muted border border-border">
                Template
              </span>
            )}
          </div>
        </div>
        {enrollments && enrollments.length > 0 && (
          <AssignDialog
            programId={id}
            enrollments={enrollments as unknown as (Enrollment & { clients: Client })[]}
          />
        )}
      </div>

      {/* Phase Builder */}
      <div className="mb-8">
        <PhaseBuilder
          programId={id}
          initialPhases={phases || []}
          initialAssignments={assignments || []}
        />
      </div>

      {/* Enrolled Companies + Assignment Tracking */}
      <div className="bg-surface border border-border rounded-xl shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">Enrolled Companies</h2>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="divide-y divide-border">
            {enrollments.map((enrollment) => {
              const client = enrollment.clients as unknown as Client
              const clientAssignments = (assignedAssignments || []).filter(
                (a: AssignedAssignment) => a.enrollment_id === enrollment.id
              )
              const completedCount = clientAssignments.filter(
                (a: AssignedAssignment) => a.status === 'completed'
              ).length
              const totalCount = clientAssignments.length

              return (
                <div key={enrollment.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-5 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary/60" />
                      </div>
                      <div>
                        <Link href={`/clients/${client?.id}`} className="text-primary font-medium hover:text-secondary">
                          {client?.company_name || client?.name}
                        </Link>
                        <p className="text-xs text-muted">{client?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">Week {enrollment.current_week}</p>
                        <p className="text-xs text-muted">of {program.duration_weeks}</p>
                      </div>
                      <div className="w-24">
                        <div className="w-full h-2 bg-primary-5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : enrollment.completion_rate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted text-right mt-1">
                          {totalCount > 0 ? `${completedCount}/${totalCount}` : `${enrollment.completion_rate}%`}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : enrollment.status === 'completed'
                          ? 'bg-secondary-10 text-secondary'
                          : 'bg-primary-5 text-muted'
                      }`}>
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Assignment status list */}
                  {clientAssignments.length > 0 && (
                    <div className="ml-13 grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                      {clientAssignments.map((assigned: AssignedAssignment) => (
                        <div key={assigned.id} className="flex items-center gap-2 text-xs">
                          {assigned.status === 'completed' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-muted shrink-0" />
                          )}
                          <span className={assigned.status === 'completed' ? 'text-muted line-through' : 'text-primary'}>
                            {assigned.title}
                          </span>
                          {assigned.email_sent_at && (
                            <Mail className="w-3 h-3 text-secondary shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted">No companies enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

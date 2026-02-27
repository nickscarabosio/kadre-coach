import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Building } from 'lucide-react'

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

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, clients(*)')
    .eq('program_id', id)

  return (
    <div className="p-8">
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
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-card">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-primary">Enrolled Companies</h2>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="divide-y divide-border">
            {enrollments.map((enrollment) => {
              const client = enrollment.clients as unknown as { id: string; company_name: string; name: string; email: string }
              return (
                <div key={enrollment.id} className="p-4 flex items-center justify-between">
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
                          style={{ width: `${enrollment.completion_rate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted text-right mt-1">{enrollment.completion_rate}%</p>
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

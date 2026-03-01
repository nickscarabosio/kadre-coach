import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { BookOpen } from 'lucide-react'
import { SynthesisList } from './synthesis-list'

export const dynamic = 'force-dynamic'

export default async function SynthesesPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: syntheses } = await supabase
    .from('daily_syntheses')
    .select('*')
    .eq('coach_id', coachId)
    .order('synthesis_date', { ascending: false })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Daily Syntheses</h1>
          <p className="text-muted mt-1">{syntheses?.length || 0} syntheses generated</p>
        </div>
      </div>

      {syntheses && syntheses.length > 0 ? (
        <div className="max-w-5xl mx-auto">
          <SynthesisList syntheses={syntheses} />
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No syntheses yet</h3>
          <p className="text-muted">Daily syntheses are generated automatically at 8 PM</p>
        </div>
      )}
    </div>
  )
}

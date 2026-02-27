import { createClient } from '@/lib/supabase/server'
import { BookOpen } from 'lucide-react'
import { SynthesisList } from './synthesis-list'

export default async function SynthesesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: syntheses } = user ? await supabase
    .from('daily_syntheses')
    .select('*')
    .eq('coach_id', user.id)
    .order('synthesis_date', { ascending: false }) : { data: null }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Daily Syntheses</h1>
          <p className="text-muted mt-1">{syntheses?.length || 0} syntheses generated</p>
        </div>
      </div>

      {syntheses && syntheses.length > 0 ? (
        <SynthesisList syntheses={syntheses} />
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

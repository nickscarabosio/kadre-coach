import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { Radio } from 'lucide-react'
import { UpdatesFeed } from './updates-feed'

export default async function UpdatesPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: updates } = await supabase
    .from('telegram_updates')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', coachId)
    .order('company_name')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Updates</h1>
          <p className="text-muted mt-1">{updates?.length || 0} updates logged</p>
        </div>
      </div>

      {updates && updates.length > 0 ? (
        <UpdatesFeed updates={updates} clients={clients || []} />
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <Radio className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No updates yet</h3>
          <p className="text-muted">Updates from Telegram will appear here</p>
        </div>
      )}
    </div>
  )
}

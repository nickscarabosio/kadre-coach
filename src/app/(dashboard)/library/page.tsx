import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { LibraryView } from './library-view'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)
  if (!coachId) return null

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', coachId)

  const { data: shares } = await supabase
    .from('document_shares')
    .select('*')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <LibraryView
        documents={documents || []}
        clients={clients || []}
        shares={shares || []}
      />
    </div>
  )
}

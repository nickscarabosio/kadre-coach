import { createClient } from '@/lib/supabase/server'
import { LibraryView } from './library-view'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: documents } = user ? await supabase
    .from('documents')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id) : { data: null }

  const { data: shares } = user ? await supabase
    .from('document_shares')
    .select('*') : { data: null }

  return (
    <div className="p-8">
      <LibraryView
        documents={documents || []}
        clients={clients || []}
        shares={shares || []}
      />
    </div>
  )
}

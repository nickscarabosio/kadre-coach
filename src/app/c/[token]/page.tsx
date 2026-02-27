import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckInForm } from './check-in-form'
import { PortalTabs } from './portal-tabs'

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, coach_id')
    .eq('access_token', token)
    .single()

  if (error || !client) {
    notFound()
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .or(`client_id.eq.${client.id},client_id.is.null`)
    .eq('coach_id', client.coach_id)
    .order('created_at', { ascending: false })

  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {client.name.split(' ')[0]}</h1>
          <p className="text-muted">Your coaching portal</p>
        </div>

        <PortalTabs
          clientId={client.id}
          messages={messages || []}
          resources={resources || []}
          reflections={reflections || []}
        />
      </div>
    </div>
  )
}

import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckInForm } from './check-in-form'

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

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Weekly Check-in</h1>
          <p className="text-zinc-400">
            Hi {client.name.split(' ')[0]}, your coach would love to hear how you&apos;re doing.
          </p>
        </div>

        <CheckInForm clientId={client.id} />
      </div>
    </div>
  )
}

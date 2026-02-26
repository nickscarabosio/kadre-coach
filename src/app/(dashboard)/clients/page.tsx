import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, User } from 'lucide-react'
import { AddClientButton } from './add-client-button'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  const statusColors = {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    at_risk: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-zinc-400 mt-1">{clients?.length || 0} total clients</p>
        </div>
        <AddClientButton />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search clients..."
          className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{client.name}</h3>
                  <p className="text-sm text-zinc-400 truncate">{client.email}</p>
                  {client.company && (
                    <p className="text-sm text-zinc-500 mt-1">{client.role} at {client.company}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[client.status as keyof typeof statusColors] || statusColors.active}`}>
                  {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${client.engagement_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400">{client.engagement_score}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
          <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No clients yet</h3>
          <p className="text-zinc-400 mb-4">Add your first client to get started</p>
          <AddClientButton />
        </div>
      )}
    </div>
  )
}

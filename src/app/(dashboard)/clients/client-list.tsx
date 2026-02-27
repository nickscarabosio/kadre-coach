'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, Building, Search, AlertCircle, Clock, CalendarCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Client } from '@/types/database'

interface EnrichedClient extends Client {
  latest_update?: string | null
  latest_update_at?: string | null
  overdue_task_count: number
  upcoming_task_count: number
}

interface ClientListProps {
  clients: EnrichedClient[]
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  at_risk: 'bg-amber-50 text-amber-700 border-amber-200',
  inactive: 'bg-primary-5 text-muted border-border',
  completed: 'bg-secondary-10 text-secondary border-secondary-20',
}

export function ClientList({ clients }: ClientListProps) {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [search, setSearch] = useState('')

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.company_name || c.name).toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q))
    )
  })

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2.5 transition-colors ${viewMode === 'card' ? 'bg-secondary-10 text-secondary' : 'text-muted hover:text-primary hover:bg-primary-5'}`}
            title="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-secondary-10 text-secondary' : 'text-muted hover:text-primary hover:bg-primary-5'}`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <Building className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No companies found</h3>
          <p className="text-muted">{search ? 'Try a different search term' : 'Add your first company to get started'}</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-5 flex items-center justify-center shrink-0">
                  <Building className="w-6 h-6 text-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-primary font-semibold truncate">{client.company_name || client.name}</h3>
                    {client.overdue_task_count > 0 && (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        {client.overdue_task_count}
                      </span>
                    )}
                    {client.upcoming_task_count > 0 && (
                      <span className="shrink-0 flex items-center gap-1 text-xs font-medium text-secondary bg-secondary-10 px-1.5 py-0.5 rounded-full">
                        <CalendarCheck className="w-3 h-3" />
                        {client.upcoming_task_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted truncate">{client.email}</p>
                  {client.industry && (
                    <p className="text-xs text-muted mt-1">{client.industry}</p>
                  )}
                </div>
              </div>

              {client.latest_update && (
                <div className="mt-3">
                  <p className="text-xs text-primary/60 line-clamp-2">{client.latest_update}</p>
                  {client.latest_update_at && (
                    <p className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(client.latest_update_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[client.status] || statusColors.active}`}>
                  {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-24 h-2 bg-primary-5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${client.engagement_score}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted">{client.engagement_score}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-primary-5">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Industry</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Latest Update</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Engagement</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Upcoming</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-primary-5 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-5 flex items-center justify-center shrink-0">
                        <Building className="w-4 h-4 text-primary/60" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{client.company_name || client.name}</p>
                        <p className="text-xs text-muted">{client.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted">{client.industry || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[client.status] || statusColors.active}`}>
                      {client.status === 'at_risk' ? 'At Risk' : client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-xs text-muted line-clamp-1 max-w-xs">{client.latest_update || '—'}</p>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-primary-5 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${client.engagement_score}%` }} />
                      </div>
                      <span className="text-xs text-muted">{client.engagement_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {client.upcoming_task_count > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-secondary">
                        <CalendarCheck className="w-3 h-3" />
                        {client.upcoming_task_count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {client.overdue_task_count > 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        {client.overdue_task_count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

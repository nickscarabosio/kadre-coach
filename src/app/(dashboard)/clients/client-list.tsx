'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Building, Search, AlertCircle, Clock, CalendarCheck, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDistanceToNow, subDays, isAfter } from 'date-fns'
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

type SortKey = 'company' | 'industry' | 'status' | 'latest_update' | 'engagement' | 'upcoming' | 'overdue'

function stripHashtagFromUpdate(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/^#\w+\s*/, '').trim() || text
}

export function ClientList({ clients }: ClientListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [industryFilter, setIndustryFilter] = useState<string>('')
  const [lastActivityFilter, setLastActivityFilter] = useState<string>('') // '', '7', '30', '90'
  const [sortBy, setSortBy] = useState<SortKey>('company')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const industries = useMemo(() => {
    const set = new Set<string>()
    clients.forEach((c) => c.industry && set.add(c.industry))
    return Array.from(set).sort()
  }, [clients])

  const filtered = useMemo(() => {
    let list = clients.filter((c) => {
      const q = search.toLowerCase()
      if (q && !(c.company_name || c.name).toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !(c.industry && c.industry.toLowerCase().includes(q))) return false
      if (statusFilter && c.status !== statusFilter) return false
      if (industryFilter && c.industry !== industryFilter) return false
      if (lastActivityFilter) {
        const days = parseInt(lastActivityFilter, 10)
        const cutoff = subDays(new Date(), days)
        const lastAt = c.latest_update_at ? new Date(c.latest_update_at) : null
        if (!lastAt || !isAfter(lastAt, cutoff)) return false
      }
      return true
    })
    const mult = sortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      let av: string | number, bv: string | number
      switch (sortBy) {
        case 'company':
          av = (a.company_name || a.name || '').toLowerCase()
          bv = (b.company_name || b.name || '').toLowerCase()
          return mult * (av < bv ? -1 : av > bv ? 1 : 0)
        case 'industry':
          av = (a.industry || '').toLowerCase()
          bv = (b.industry || '').toLowerCase()
          return mult * (av < bv ? -1 : av > bv ? 1 : 0)
        case 'status':
          av = (a.status || '').toLowerCase()
          bv = (b.status || '').toLowerCase()
          return mult * (av < bv ? -1 : av > bv ? 1 : 0)
        case 'latest_update':
          av = a.latest_update_at ? new Date(a.latest_update_at).getTime() : 0
          bv = b.latest_update_at ? new Date(b.latest_update_at).getTime() : 0
          return mult * (av - bv)
        case 'engagement':
          return mult * (a.engagement_score - b.engagement_score)
        case 'upcoming':
          return mult * (a.upcoming_task_count - b.upcoming_task_count)
        case 'overdue':
          return mult * (a.overdue_task_count - b.overdue_task_count)
        default:
          return 0
      }
    })
    return list
  }, [clients, search, statusFilter, industryFilter, lastActivityFilter, sortBy, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) =>
    sortBy === column ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />) : null

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="at_risk">At Risk</option>
          <option value="inactive">Inactive</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary min-w-[140px]"
        >
          <option value="">All industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select
          value={lastActivityFilter}
          onChange={(e) => setLastActivityFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary"
        >
          <option value="">Any activity</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <Building className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No companies found</h3>
          <p className="text-muted">{search || statusFilter || industryFilter || lastActivityFilter ? 'Try adjusting filters' : 'Add your first company to get started'}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-primary-5">
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('company')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Company <SortIcon column="company" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('industry')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Industry <SortIcon column="industry" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('status')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Status <SortIcon column="status" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('latest_update')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Latest Update <SortIcon column="latest_update" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('engagement')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Engagement <SortIcon column="engagement" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('upcoming')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Upcoming <SortIcon column="upcoming" />
                  </button>
                </th>
                <th className="text-left px-6 py-3">
                  <button type="button" onClick={() => handleSort('overdue')} className="text-xs font-semibold text-muted uppercase tracking-wide hover:text-primary flex items-center gap-1">
                    Overdue <SortIcon column="overdue" />
                  </button>
                </th>
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
                    <p className="text-xs text-muted line-clamp-1 max-w-xs">{stripHashtagFromUpdate(client.latest_update) || '—'}</p>
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-1"
                      title="Based on check-ins, updates, and task completion over the last 4 weeks."
                    >
                      <div className="w-16 h-2 bg-primary-5 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: `${client.engagement_score}%` }} />
                      </div>
                      <span className="text-xs text-muted">{client.engagement_score}%</span>
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    {client.upcoming_task_count > 0 ? (
                      <Link href={`/tasks?client=${client.id}`} className="flex items-center gap-1 text-xs font-medium text-secondary hover:underline">
                        <CalendarCheck className="w-3 h-3" />
                        {client.upcoming_task_count}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {client.overdue_task_count > 0 ? (
                      <Link href={`/tasks?client=${client.id}&overdue=1`} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                        <AlertCircle className="w-3 h-3" />
                        {client.overdue_task_count}
                      </Link>
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

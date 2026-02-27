'use client'

import { Reflection } from '@/types/database'
import { format } from 'date-fns'

export function PortalProgress({ reflections }: { reflections: Reflection[] }) {
  if (reflections.length === 0) {
    return <p className="text-muted text-center py-8">No check-ins yet. Complete your first check-in to see progress.</p>
  }

  const sorted = [...reflections].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const avgEnergy = Math.round(sorted.reduce((sum, r) => sum + r.energy_level, 0) / sorted.length)
  const avgAccountability = Math.round(sorted.reduce((sum, r) => sum + r.accountability_score, 0) / sorted.length)
  const onTrackCount = sorted.filter(r => r.goal_progress === 'yes').length
  const onTrackPct = Math.round((onTrackCount / sorted.length) * 100)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary-5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgEnergy}/10</p>
          <p className="text-xs text-muted">Avg Energy</p>
        </div>
        <div className="bg-primary-5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgAccountability}/10</p>
          <p className="text-xs text-muted">Avg Accountability</p>
        </div>
        <div className="bg-primary-5 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">{onTrackPct}%</p>
          <p className="text-xs text-muted">On Track</p>
        </div>
      </div>

      {/* Energy trend chart (simple bar chart) */}
      <div>
        <h3 className="text-sm font-medium text-primary mb-3">Energy Trend</h3>
        <div className="flex items-end gap-1" style={{ height: '120px' }}>
          {sorted.slice(-12).map((r, i) => (
            <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-secondary rounded-t"
                style={{ height: `${(r.energy_level / 10) * 100}%` }}
                title={`${r.energy_level}/10 — ${format(new Date(r.created_at), 'MMM d')}`}
              />
              {i % 3 === 0 && (
                <span className="text-[10px] text-muted">{format(new Date(r.created_at), 'M/d')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Accountability trend */}
      <div>
        <h3 className="text-sm font-medium text-primary mb-3">Accountability Trend</h3>
        <div className="flex items-end gap-1" style={{ height: '120px' }}>
          {sorted.slice(-12).map((r, i) => (
            <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-emerald-500 rounded-t"
                style={{ height: `${(r.accountability_score / 10) * 100}%` }}
                title={`${r.accountability_score}/10 — ${format(new Date(r.created_at), 'MMM d')}`}
              />
              {i % 3 === 0 && (
                <span className="text-[10px] text-muted">{format(new Date(r.created_at), 'M/d')}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Goal progress history */}
      <div>
        <h3 className="text-sm font-medium text-primary mb-3">Goal Progress History</h3>
        <div className="flex gap-1.5 flex-wrap">
          {sorted.map((r) => (
            <div
              key={r.id}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                r.goal_progress === 'yes'
                  ? 'bg-emerald-100 text-emerald-700'
                  : r.goal_progress === 'partial'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
              title={`${format(new Date(r.created_at), 'MMM d')} — ${r.goal_progress}`}
            >
              {r.goal_progress === 'yes' ? '✓' : r.goal_progress === 'partial' ? '~' : '✗'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

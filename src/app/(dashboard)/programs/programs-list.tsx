'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Users, Layers, Search, UserPlus } from 'lucide-react'
import type { Program } from '@/types/database'

interface ProgramsListProps {
  programs: Program[]
  enrollmentCounts: Record<string, number>
  phaseCounts: Record<string, number>
}

export function ProgramsList({ programs, enrollmentCounts, phaseCounts }: ProgramsListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return programs
    const q = search.toLowerCase()
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [programs, search])

  return (
    <>
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search programs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((program) => (
          <div
            key={program.id}
            className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
              {program.is_template && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-5 text-muted border border-border">
                  Template
                </span>
              )}
            </div>

            <h3 className="text-primary font-semibold mb-1">{program.name}</h3>
            {program.description && (
              <p className="text-sm text-muted line-clamp-2 mb-4">{program.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {program.duration_weeks}w
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-4 h-4" />
                {phaseCounts[program.id] || 0} phases
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {enrollmentCounts[program.id] || 0} enrolled
              </span>
            </div>

            <div className="mt-auto flex gap-2">
              <Link
                href={`/programs/${program.id}`}
                className="flex-1 text-center py-2 rounded-lg border border-border text-sm font-medium text-primary hover:bg-primary-5 transition-colors"
              >
                View
              </Link>
              <Link
                href={`/programs/${program.id}?assign=1`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Assign
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

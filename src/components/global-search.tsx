'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Building2,
  Users,
  Rss,
  CheckSquare,
  FolderKanban,
  FileText,
  X,
} from 'lucide-react'
import type { SearchResultGroup } from '@/app/api/search/route'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultGroup | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    setQuery('')
    setResults(null)
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults(null)
      return
    }
    debounceRef.current = setTimeout(() => fetchResults(query.trim()), 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchResults])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const navigate = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  const hasAny =
    results &&
    (results.companies.length > 0 ||
      results.people.length > 0 ||
      results.updates.length > 0 ||
      results.tasks.length > 0 ||
      results.projects.length > 0 ||
      results.documents.length > 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary-5 transition-colors flex items-center gap-2"
        aria-label="Search (Cmd+K)"
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline text-sm text-muted">Search</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-primary-10 border border-border rounded">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-nav w-full max-w-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="w-5 h-5 text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search companies, people, updates, tasks..."
                className="flex-1 bg-transparent text-primary placeholder-muted outline-none py-1"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:bg-primary-5 hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading && (
                <p className="text-sm text-muted py-4 text-center">Searching…</p>
              )}
              {!loading && query.trim().length >= 2 && !hasAny && (
                <p className="text-sm text-muted py-4 text-center">No results found</p>
              )}
              {!loading && hasAny && (
                <div className="space-y-4">
                  {results!.companies.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Companies
                      </h3>
                      {results!.companies.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => navigate(c.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          {c.name}
                        </button>
                      ))}
                    </section>
                  }
                  {results!.people.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> People
                      </h3>
                      {results!.people.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => navigate(p.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          <span className="font-medium">{p.name}</span>
                          <span className="text-muted ml-1">· {p.companyName}</span>
                        </button>
                      ))}
                    </section>
                  }
                  {results!.updates.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <Rss className="w-3.5 h-3.5" /> Updates
                      </h3>
                      {results!.updates.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => navigate(u.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          <span className="text-muted text-xs">{u.companyName}</span>
                          <p className="line-clamp-1">{u.snippet}</p>
                        </button>
                      ))}
                    </section>
                  }
                  {results!.tasks.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5" /> Tasks
                      </h3>
                      {results!.tasks.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => navigate(t.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          {t.title}
                          {t.clientName && (
                            <span className="text-muted ml-1">· {t.clientName}</span>
                          )}
                        </button>
                      ))}
                    </section>
                  }
                  {results!.projects.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <FolderKanban className="w-3.5 h-3.5" /> Projects
                      </h3>
                      {results!.projects.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => navigate(p.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          {p.title}
                        </button>
                      ))}
                    </section>
                  }
                  {results!.documents.length > 0 && (
                    <section>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider px-2 mb-1 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Documents
                      </h3>
                      {results!.documents.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => navigate(d.href)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-5 text-sm text-primary"
                        >
                          {d.title}
                        </button>
                      ))}
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

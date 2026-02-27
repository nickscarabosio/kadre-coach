'use client'

import { useState } from 'react'
import { FileText, Link as LinkIcon, File, ExternalLink, Trash2, Share2, Search, PenTool } from 'lucide-react'
import { Document, Client, DocumentShare } from '@/types/database'
import { deleteDocument } from './actions'
import { UploadDialog } from './upload-dialog'
import { ShareDialog } from './share-dialog'
import { useRouter } from 'next/navigation'

interface LibraryViewProps {
  documents: Document[]
  clients: Client[]
  shares: DocumentShare[]
}

type TabFilter = 'all' | 'file' | 'link' | 'richtext'

export function LibraryView({ documents, clients, shares }: LibraryViewProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [search, setSearch] = useState('')
  const [shareDocId, setShareDocId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'file', label: 'Files' },
    { id: 'link', label: 'Links' },
    { id: 'richtext', label: 'Documents' },
  ]

  const filtered = documents.filter((doc) => {
    if (activeTab !== 'all' && doc.document_type !== activeTab) return false
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return
    setDeleting(docId)
    await deleteDocument(docId)
    setDeleting(null)
    router.refresh()
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'file': return <File className="w-5 h-5" />
      case 'link': return <LinkIcon className="w-5 h-5" />
      case 'richtext': return <PenTool className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'file': return 'Uploaded file'
      case 'link': return 'External link'
      case 'richtext': return 'Rich text document'
      default: return type
    }
  }

  const shareDoc = shareDocId ? documents.find(d => d.id === shareDocId) : null

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Library</h1>
          <p className="text-muted mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <UploadDialog clients={clients} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-secondary text-white' : 'bg-primary-5 text-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-strong rounded-lg text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const docShares = shares.filter(s => s.document_id === doc.id)
            const href = doc.document_type === 'file' ? doc.file_url : doc.document_type === 'link' ? doc.url : null

            return (
              <div
                key={doc.id}
                className="bg-surface border border-border rounded-xl p-6 hover:shadow-nav transition-shadow shadow-card group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center text-secondary shrink-0">
                    {typeIcon(doc.document_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium truncate hover:text-secondary transition-colors">
                          {doc.title}
                        </a>
                      ) : (
                        <h3 className="text-primary font-medium truncate">{doc.title}</h3>
                      )}
                      {href && (
                        <ExternalLink className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{typeLabel(doc.document_type)}</p>
                    {doc.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{doc.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    {doc.category && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-primary-5 text-muted border border-border">
                        {doc.category}
                      </span>
                    )}
                    {docShares.length > 0 && (
                      <span className="text-xs text-muted">
                        Shared ({docShares.length})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShareDocId(doc.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-secondary hover:bg-secondary-10 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No documents yet</h3>
          <p className="text-muted mb-4">Add links, upload files, or write documents for your companies</p>
          <UploadDialog clients={clients} />
        </div>
      )}

      {shareDoc && (
        <ShareDialog
          documentId={shareDoc.id}
          documentTitle={shareDoc.title}
          clients={clients}
          shares={shares}
          onClose={() => setShareDocId(null)}
        />
      )}
    </>
  )
}

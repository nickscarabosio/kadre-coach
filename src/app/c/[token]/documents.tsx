'use client'

import { Document } from '@/types/database'
import { FileText, Link as LinkIcon, ExternalLink, PenTool } from 'lucide-react'

export function PortalDocuments({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return <p className="text-muted text-center py-8">No documents shared yet.</p>
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        if (doc.document_type === 'richtext') {
          return (
            <div key={doc.id} className="p-4 bg-primary-5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="w-4 h-4 text-secondary" />
                <p className="text-sm font-medium text-primary">{doc.title}</p>
              </div>
              {doc.content && (
                <div
                  className="prose prose-sm max-w-none text-primary"
                  dangerouslySetInnerHTML={{ __html: doc.content }}
                />
              )}
            </div>
          )
        }

        const href = doc.document_type === 'file' ? doc.file_url : doc.url
        return (
          <a
            key={doc.id}
            href={href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-primary-5 rounded-lg hover:bg-primary-10 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center text-secondary">
              {doc.document_type === 'file' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{doc.title}</p>
              <p className="text-xs text-muted">{doc.document_type === 'file' ? 'Download' : 'External link'}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )
      })}
    </div>
  )
}

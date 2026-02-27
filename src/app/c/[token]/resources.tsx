'use client'

import { Resource } from '@/types/database'
import { FileText, Link as LinkIcon, ExternalLink } from 'lucide-react'

export function PortalResources({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return <p className="text-muted text-center py-8">No resources shared yet.</p>
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <a
          key={resource.id}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-primary-5 rounded-lg hover:bg-primary-10 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center text-secondary">
            {resource.type === 'document' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{resource.name}</p>
            <p className="text-xs text-muted">{resource.type === 'document' ? 'Download' : 'External link'}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  )
}

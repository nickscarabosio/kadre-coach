import { createClient } from '@/lib/supabase/server'
import { FileText, Link as LinkIcon, File, ExternalLink } from 'lucide-react'
import { UploadResource } from './upload-resource'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: resources } = user ? await supabase
    .from('resources')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  const { data: clients } = user ? await supabase
    .from('clients')
    .select('*')
    .eq('coach_id', user.id) : { data: null }

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c]))

  const typeIcon = (type: string) => {
    switch (type) {
      case 'document': return <File className="w-5 h-5" />
      case 'link': return <LinkIcon className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Resources</h1>
          <p className="text-muted mt-1">{resources?.length || 0} resources</p>
        </div>
        <UploadResource clients={clients || []} />
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const client = resource.client_id ? clientMap[resource.client_id] : null
            return (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface border border-border rounded-xl p-5 hover:shadow-nav transition-shadow shadow-card group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-10 flex items-center justify-center text-secondary shrink-0">
                    {typeIcon(resource.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-primary font-medium truncate">{resource.name}</h3>
                      <ExternalLink className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {resource.type === 'document' ? 'Uploaded file' : 'External link'}
                    </p>
                    {client && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-primary-5 text-muted border border-border">
                        {client.company_name || client.name}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-card">
          <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-primary font-semibold mb-2">No resources yet</h3>
          <p className="text-muted mb-4">Add links or upload files for your companies</p>
          <UploadResource clients={clients || []} />
        </div>
      )}
    </div>
  )
}

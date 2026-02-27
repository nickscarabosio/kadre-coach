import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export type SearchResultGroup = {
  companies: { id: string; name: string; href: string }[]
  people: { id: string; name: string; companyName: string; href: string }[]
  updates: { id: string; snippet: string; companyName: string; href: string }[]
  tasks: { id: string; title: string; clientName: string | null; href: string }[]
  projects: { id: string; title: string; clientId: string; href: string }[]
  documents: { id: string; title: string; href: string }[]
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ companies: [], people: [], updates: [], tasks: [], projects: [], documents: [] })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase() || ''
  if (q.length < 2) {
    return Response.json({ companies: [], people: [], updates: [], tasks: [], projects: [], documents: [] })
  }

  const pattern = `%${q}%`

  const [clientsRes, myClientsRes, updatesRes, tasksRes, projectsRes, documentsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, company_name')
      .eq('coach_id', user.id)
      .or(`company_name.ilike.${pattern},name.ilike.${pattern}`)
      .limit(8),
    supabase
      .from('clients')
      .select('id')
      .eq('coach_id', user.id),
    supabase
      .from('telegram_updates')
      .select('id, content, voice_transcript, client_id')
      .eq('coach_id', user.id)
      .or(`content.ilike.${pattern},voice_transcript.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('tasks')
      .select('id, title, client_id')
      .eq('coach_id', user.id)
      .ilike('title', pattern)
      .limit(8),
    supabase
      .from('client_projects')
      .select('id, title, client_id')
      .eq('coach_id', user.id)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(8),
    supabase
      .from('documents')
      .select('id, title')
      .eq('coach_id', user.id)
      .or(`title.ilike.${pattern},description.ilike.${pattern},content.ilike.${pattern}`)
      .limit(8),
  ])

  const myClientIds = (myClientsRes.data || []).map(c => c.id)
  const { data: contactsRes } = myClientIds.length > 0
    ? await supabase
        .from('contacts')
        .select('id, name, email, client_id')
        .in('client_id', myClientIds)
        .or(`name.ilike.${pattern},email.ilike.${pattern}`)
        .limit(20)
    : { data: [] }

  const clientIdsFromContacts = [...new Set((contactsRes || []).map(c => c.client_id))]
  const { data: clientsForContacts } = clientIdsFromContacts.length > 0
    ? await supabase.from('clients').select('id, company_name').eq('coach_id', user.id).in('id', clientIdsFromContacts)
    : { data: [] }
  const clientMap = Object.fromEntries((clientsForContacts || []).map(c => [c.id, c.company_name]))
  const allClientIds = [...new Set([
    ...(updatesRes.data || []).map(u => u.client_id).filter(Boolean),
    ...(tasksRes.data || []).map(t => t.client_id).filter(Boolean),
  ])] as string[]
  const { data: allClients } = allClientIds.length > 0
    ? await supabase.from('clients').select('id, company_name').eq('coach_id', user.id).in('id', allClientIds)
    : { data: [] }
  const fullClientMap = Object.fromEntries((allClients || []).map(c => [c.id, c.company_name]))

  const companies = (clientsRes.data || []).map(c => ({
    id: c.id,
    name: c.company_name,
    href: `/clients/${c.id}`,
  }))

  const people = (contactsRes || []).map(c => ({
    id: c.id,
    name: c.name,
    companyName: clientMap[c.client_id] || 'Unknown',
    href: `/people?contact=${c.id}`,
  }))

  const updates = (updatesRes.data || []).map(u => {
    const text = u.voice_transcript || u.content || ''
    const snippet = text.length > 80 ? text.slice(0, 80) + '…' : text
    return {
      id: u.id,
      snippet,
      companyName: u.client_id ? fullClientMap[u.client_id] || 'Unknown' : 'Unknown',
      href: `/updates`,
    }
  })

  const tasks = (tasksRes.data || []).map(t => ({
    id: t.id,
    title: t.title,
    clientName: t.client_id ? fullClientMap[t.client_id] || null : null,
    href: `/tasks`,
  }))

  const projects = (projectsRes.data || []).map(p => ({
    id: p.id,
    title: p.title,
    clientId: p.client_id,
    href: `/clients/${p.client_id}#section-projects`,
  }))

  const documents = (documentsRes.data || []).map(d => ({
    id: d.id,
    title: d.title,
    href: `/library`,
  }))

  return Response.json({
    companies,
    people,
    updates,
    tasks,
    projects,
    documents,
  } satisfies SearchResultGroup)
}

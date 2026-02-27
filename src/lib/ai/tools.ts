import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'

export function getAssistantTools(): Anthropic.Tool[] {
  return [
    {
      name: 'list_companies',
      description: 'List all companies for the coach with their status and engagement scores',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
    {
      name: 'get_company_details',
      description: 'Get detailed info about a specific company including contacts and recent activity',
      input_schema: {
        type: 'object' as const,
        properties: {
          company_name: { type: 'string', description: 'Name or partial name of the company' },
        },
        required: ['company_name'],
      },
    },
    {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered by status or company',
      input_schema: {
        type: 'object' as const,
        properties: {
          status: { type: 'string', description: 'Filter by status: pending, in_progress, completed' },
          company_name: { type: 'string', description: 'Filter by company name' },
        },
        required: [],
      },
    },
    {
      name: 'list_updates',
      description: 'List recent Telegram updates, optionally filtered by company or date',
      input_schema: {
        type: 'object' as const,
        properties: {
          company_name: { type: 'string', description: 'Filter by company name' },
          days: { type: 'number', description: 'Number of days back to look (default 7)' },
        },
        required: [],
      },
    },
    {
      name: 'get_synthesis',
      description: 'Get the daily synthesis for a specific date',
      input_schema: {
        type: 'object' as const,
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (default today)' },
        },
        required: [],
      },
    },
    {
      name: 'list_reflections',
      description: 'List recent check-in reflections from clients',
      input_schema: {
        type: 'object' as const,
        properties: {
          company_name: { type: 'string', description: 'Filter by company name' },
          limit: { type: 'number', description: 'Number of results (default 10)' },
        },
        required: [],
      },
    },
    {
      name: 'search_notes',
      description: 'Search session notes by content',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Search term' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_stats',
      description: 'Get overall coaching statistics',
      input_schema: { type: 'object' as const, properties: {}, required: [] },
    },
  ]
}

export async function executeTool(
  coachId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  const supabase = createAdminClient()

  switch (toolName) {
    case 'list_companies': {
      const { data } = await supabase.from('clients').select('company_name, status, engagement_score, industry, email').eq('coach_id', coachId).order('company_name')
      return JSON.stringify(data || [])
    }

    case 'get_company_details': {
      const name = input.company_name as string
      const { data: clients } = await supabase.from('clients').select('*').eq('coach_id', coachId).ilike('company_name', `%${name}%`).limit(1)
      if (!clients?.length) return 'Company not found'
      const client = clients[0]
      const { data: contacts } = await supabase.from('contacts').select('*').eq('client_id', client.id)
      const { data: recentUpdates } = await supabase.from('telegram_updates').select('content, classification, created_at').eq('client_id', client.id).order('created_at', { ascending: false }).limit(5)
      return JSON.stringify({ ...client, contacts, recent_updates: recentUpdates })
    }

    case 'list_tasks': {
      let query = supabase.from('tasks').select('title, description, status, priority, due_date, client_id').eq('coach_id', coachId)
      if (input.status) query = query.eq('status', input.status as string)
      const { data } = await query.order('due_date', { ascending: true }).limit(20)
      return JSON.stringify(data || [])
    }

    case 'list_updates': {
      const days = (input.days as number) || 7
      const since = new Date(Date.now() - days * 86400000).toISOString()
      let query = supabase.from('telegram_updates').select('content, classification, ai_summary, created_at, client_id').eq('coach_id', coachId).gte('created_at', since)
      const { data } = await query.order('created_at', { ascending: false }).limit(30)
      return JSON.stringify(data || [])
    }

    case 'get_synthesis': {
      const date = (input.date as string) || new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('daily_syntheses').select('*').eq('coach_id', coachId).eq('synthesis_date', date).single()
      return data ? JSON.stringify(data) : 'No synthesis found for this date'
    }

    case 'list_reflections': {
      const limit = (input.limit as number) || 10
      const { data: clients } = await supabase.from('clients').select('id, company_name').eq('coach_id', coachId)
      const clientIds = (clients || []).map(c => c.id)
      const { data } = await supabase.from('reflections').select('*').in('client_id', clientIds).order('created_at', { ascending: false }).limit(limit)
      return JSON.stringify(data || [])
    }

    case 'search_notes': {
      const query = input.query as string
      const { data } = await supabase.from('session_notes').select('title, content, session_date, client_id').eq('coach_id', coachId).ilike('content', `%${query}%`).limit(10)
      return JSON.stringify(data || [])
    }

    case 'get_stats': {
      const { data: clients } = await supabase.from('clients').select('status, engagement_score').eq('coach_id', coachId)
      const { data: tasks } = await supabase.from('tasks').select('status').eq('coach_id', coachId)
      const { data: updates } = await supabase.from('telegram_updates').select('id').eq('coach_id', coachId)

      const stats = {
        total_companies: clients?.length || 0,
        active_companies: clients?.filter(c => c.status === 'active').length || 0,
        at_risk_companies: clients?.filter(c => c.status === 'at_risk').length || 0,
        avg_engagement: clients?.length ? Math.round(clients.reduce((sum, c) => sum + c.engagement_score, 0) / clients.length) : 0,
        total_tasks: tasks?.length || 0,
        pending_tasks: tasks?.filter(t => t.status === 'pending').length || 0,
        total_updates: updates?.length || 0,
      }
      return JSON.stringify(stats)
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}

import { getAIClient, MODELS } from './client'
import { SYNTHESIS_PROMPT } from './prompts'
import { createAdminClient } from '@/lib/supabase/server'

export async function generateDailySynthesis(coachId: string): Promise<string> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Get today's updates
  const { data: updates } = await supabase
    .from('telegram_updates')
    .select('content, voice_transcript, classification, client_id, created_at')
    .eq('coach_id', coachId)
    .gte('created_at', `${today}T00:00:00`)
    .order('created_at')

  // Get recent check-ins
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', coachId)

  const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c.company_name]))

  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .in('client_id', (clients || []).map(c => c.id))
    .gte('created_at', `${today}T00:00:00`)

  // Get pending tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, priority, status, client_id')
    .eq('coach_id', coachId)
    .in('status', ['pending', 'in_progress'])

  const updatesText = (updates || []).map(u => {
    const company = u.client_id ? clientMap[u.client_id] || 'Unknown' : 'Untagged'
    const text = u.voice_transcript || u.content
    return `[${company}] (${u.classification || 'unclassified'}) ${text}`
  }).join('\n\n') || 'No updates today.'

  const checkInsText = (reflections || []).map(r => {
    const company = clientMap[r.client_id] || 'Unknown'
    return `[${company}] Energy: ${r.energy_level}/10, Goal: ${r.goal_progress}, Win: ${r.win || 'N/A'}`
  }).join('\n') || 'No check-ins today.'

  const tasksText = (tasks || []).map(t => {
    const company = t.client_id ? clientMap[t.client_id] || 'Unknown' : 'General'
    return `[${t.priority}] ${t.title} (${company}) — ${t.status}`
  }).join('\n') || 'No pending tasks.'

  const prompt = SYNTHESIS_PROMPT
    .replace('{updates}', updatesText)
    .replace('{check_ins}', checkInsText)
    .replace('{tasks}', tasksText)

  const client = getAIClient()
  const response = await client.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const synthesisContent = response.content[0].type === 'text' ? response.content[0].text : 'No synthesis generated.'

  // Store synthesis
  await supabase.from('daily_syntheses').upsert({
    coach_id: coachId,
    synthesis_date: today,
    content: synthesisContent,
    summary: synthesisContent.slice(0, 500),
    client_highlights: (updates || [])
      .filter((u): u is typeof u & { client_id: string } => u.client_id !== null)
      .reduce((acc, u) => {
        if (!acc.find((h: { client_id: string }) => h.client_id === u.client_id)) {
          acc.push({ client_id: u.client_id, company: clientMap[u.client_id] || 'Unknown' })
        }
        return acc
      }, [] as { client_id: string; company: string }[]),
    action_items: (tasks || []).map(t => ({ title: t.title, priority: t.priority })),
  }, {
    onConflict: 'coach_id,synthesis_date',
  })

  return synthesisContent
}

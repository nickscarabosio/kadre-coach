import { getAIClient, MODELS } from './client'
import { INFER_CLIENT_PROMPT } from './prompts'
import { createAdminClient } from '@/lib/supabase/server'

export async function inferClient(coachId: string, content: string): Promise<string | null> {
  const supabase = createAdminClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('coach_id', coachId)

  if (!clients || clients.length === 0) return null

  // Check for explicit hashtag match first
  const hashtagMatch = content.match(/#(\w+)/g)
  if (hashtagMatch) {
    for (const tag of hashtagMatch) {
      const tagName = tag.slice(1).toLowerCase()
      const match = clients.find(c =>
        c.company_name.toLowerCase().replace(/\s+/g, '') === tagName ||
        c.company_name.toLowerCase().includes(tagName)
      )
      if (match) return match.id
    }
  }

  // Use AI to infer
  const companiesList = clients.map(c => `- ${c.company_name}`).join('\n')
  const prompt = INFER_CLIENT_PROMPT
    .replace('{companies}', companiesList)
    .replace('{content}', content)

  const client = getAIClient()
  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  const result = response.content[0].type === 'text' ? response.content[0].text.trim() : 'UNKNOWN'

  if (result === 'UNKNOWN') return null

  const match = clients.find(c => c.company_name.toLowerCase() === result.toLowerCase())
  return match?.id || null
}

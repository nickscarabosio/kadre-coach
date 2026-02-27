import { getAIClient, MODELS } from './client'
import { EXTRACT_ACTION_ITEMS_PROMPT } from './prompts'
import { createAdminClient } from '@/lib/supabase/server'

interface ActionItem {
  title: string
  priority: 'high' | 'medium' | 'low'
}

export async function extractActionItems(content: string): Promise<ActionItem[]> {
  const client = getAIClient()

  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 500,
    messages: [
      { role: 'user', content: EXTRACT_ACTION_ITEMS_PROMPT.replace('{content}', content) },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'

  try {
    const items = JSON.parse(text)
    if (!Array.isArray(items)) return []
    return items.filter(
      (item: unknown): item is ActionItem =>
        typeof item === 'object' &&
        item !== null &&
        'title' in item &&
        typeof (item as ActionItem).title === 'string'
    ).map(item => ({
      title: item.title,
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
    }))
  } catch {
    return []
  }
}

export async function createTasksFromActionItems(
  coachId: string,
  clientId: string | null,
  actionItems: ActionItem[]
) {
  if (actionItems.length === 0) return

  const supabase = createAdminClient()

  const tasks = actionItems.map(item => ({
    coach_id: coachId,
    client_id: clientId,
    title: item.title,
    priority: item.priority,
    status: 'pending',
  }))

  await supabase.from('tasks').insert(tasks)
}

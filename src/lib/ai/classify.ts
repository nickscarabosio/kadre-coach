import { getAIClient, MODELS } from './client'
import { CLASSIFY_PROMPT } from './prompts'

export type Classification = 'progress' | 'blocker' | 'communication' | 'insight' | 'admin'

const VALID_CLASSIFICATIONS: Classification[] = ['progress', 'blocker', 'communication', 'insight', 'admin']

export async function classifyUpdate(content: string): Promise<Classification> {
  const client = getAIClient()

  const response = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 20,
    messages: [
      { role: 'user', content: CLASSIFY_PROMPT.replace('{content}', content) },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim().toLowerCase() : 'communication'

  if (VALID_CLASSIFICATIONS.includes(text as Classification)) {
    return text as Classification
  }
  return 'communication'
}

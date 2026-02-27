import Anthropic from '@anthropic-ai/sdk'

let clientInstance: Anthropic | null = null

export function getAIClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic()
  }
  return clientInstance
}

export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001' as const,
  sonnet: 'claude-sonnet-4-6' as const,
}

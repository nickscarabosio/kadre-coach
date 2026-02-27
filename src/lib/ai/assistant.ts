import { getAIClient, MODELS } from './client'
import { ASSISTANT_SYSTEM_PROMPT } from './prompts'
import { getAssistantTools, executeTool } from './tools'
import Anthropic from '@anthropic-ai/sdk'

export async function runAssistant(coachId: string, userMessage: string): Promise<string> {
  const client = getAIClient()
  const tools = getAssistantTools()

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  // Tool-use loop (max 5 iterations)
  for (let i = 0; i < 5; i++) {
    const response = await client.messages.create({
      model: MODELS.sonnet,
      max_tokens: 2000,
      system: ASSISTANT_SYSTEM_PROMPT,
      tools,
      messages,
    })

    // If no tool use, return the text response
    if (response.stop_reason === 'end_turn') {
      const textBlocks = response.content.filter(b => b.type === 'text')
      return textBlocks.map(b => b.text).join('\n') || 'No response generated.'
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter(b => b.type === 'text')
      return textBlocks.map(b => b.text).join('\n') || 'No response generated.'
    }

    // Add assistant message with tool calls
    messages.push({ role: 'assistant', content: response.content })

    // Execute tools and add results
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of toolUseBlocks) {
      if (block.type === 'tool_use') {
        const result = await executeTool(coachId, block.name, block.input as Record<string, unknown>)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        })
      }
    }

    messages.push({ role: 'user', content: toolResults })
  }

  return 'I was unable to complete your request. Please try again.'
}

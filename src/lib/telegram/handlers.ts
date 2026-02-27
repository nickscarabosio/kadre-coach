import { CoachContext } from './bot'
import { createAdminClient } from '@/lib/supabase/server'
import { classifyUpdate } from '@/lib/ai/classify'
import { inferClient } from '@/lib/ai/infer-client'
import { extractActionItems, createTasksFromActionItems } from '@/lib/ai/extract'
import { runAssistant } from '@/lib/ai/assistant'
import { transcribeAudio } from '@/lib/voice/transcribe'
import type { Json } from '@/types/database'

async function processUpdateWithAI(coachId: string, content: string) {
  const [classification, clientId] = await Promise.all([
    classifyUpdate(content),
    inferClient(coachId, content),
  ])

  const actionItems = await extractActionItems(content)

  if (actionItems.length > 0) {
    await createTasksFromActionItems(coachId, clientId, actionItems)
  }

  return { classification, clientId, actionItems }
}

async function downloadTelegramFile(fileId: string): Promise<ArrayBuffer> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN!
  const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  const filePath = fileData.result.file_path
  const downloadRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`)
  return downloadRes.arrayBuffer()
}

export async function handleTextMessage(ctx: CoachContext) {
  if (!ctx.coachId || !ctx.message?.text) return
  const coachId = ctx.coachId

  const text = ctx.message.text
  if (text.startsWith('/')) {
    if (text.startsWith('/ask')) {
      return handleAskCommand(ctx)
    }
    return
  }

  const supabase = createAdminClient()

  try {
    const { classification, clientId, actionItems } = await processUpdateWithAI(coachId, text)

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      client_id: clientId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: text,
      message_type: 'text',
      classification,
      action_items: actionItems as unknown as Json,
      raw_update: ctx.update as unknown as Json,
    })

    const parts = [`Logged as **${classification}**`]
    if (clientId) {
      const { data: client } = await supabase.from('clients').select('company_name').eq('id', clientId).single()
      if (client) parts.push(`for **${client.company_name}**`)
    }
    if (actionItems.length > 0) {
      parts.push(`\n${actionItems.length} task(s) created`)
    }

    await ctx.reply(parts.join(' '), { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('AI pipeline error:', error)

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: text,
      message_type: 'text',
      raw_update: ctx.update as unknown as Json,
    })

    await ctx.reply('Update recorded (AI processing unavailable).')
  }
}

async function handleAskCommand(ctx: CoachContext) {
  if (!ctx.coachId) return

  const text = ctx.message?.text || ''
  const question = text.replace(/^\/ask\s*/, '').trim()

  if (!question) {
    await ctx.reply('Usage: /ask <your question>\n\nExample: /ask How is Acme doing this week?')
    return
  }

  try {
    const response = await runAssistant(ctx.coachId, question)
    await ctx.reply(response)
  } catch (error) {
    console.error('Assistant error:', error)
    await ctx.reply('Sorry, I couldn\'t process that question. Please try again.')
  }
}

export async function handleVoiceMessage(ctx: CoachContext) {
  if (!ctx.coachId || !ctx.message?.voice) return
  const coachId = ctx.coachId

  const supabase = createAdminClient()

  try {
    const audioBuffer = await downloadTelegramFile(ctx.message.voice.file_id)
    const transcript = await transcribeAudio(audioBuffer, 'voice.ogg')
    const { classification, clientId, actionItems } = await processUpdateWithAI(coachId, transcript)

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      client_id: clientId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: transcript,
      message_type: 'voice',
      classification,
      action_items: actionItems as unknown as Json,
      voice_transcript: transcript,
      raw_update: ctx.update as unknown as Json,
    })

    const parts = [`Transcribed & logged as **${classification}**`]
    if (clientId) {
      const { data: client } = await supabase.from('clients').select('company_name').eq('id', clientId).single()
      if (client) parts.push(`for **${client.company_name}**`)
    }
    if (actionItems.length > 0) {
      parts.push(`\n${actionItems.length} task(s) created`)
    }
    parts.push(`\n\n_"${transcript.slice(0, 200)}${transcript.length > 200 ? '...' : ''}"_`)

    await ctx.reply(parts.join(' '), { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Voice processing error:', error)

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: '[Voice message — transcription failed]',
      message_type: 'voice',
      raw_update: ctx.update as unknown as Json,
    })

    await ctx.reply('Voice note saved, but transcription failed. The audio is stored for later processing.')
  }
}

export async function handleDocument(ctx: CoachContext) {
  if (!ctx.coachId || !ctx.message?.document) return
  const coachId = ctx.coachId

  const supabase = createAdminClient()
  const doc = ctx.message.document
  const fileName = doc.file_name || 'unknown'

  try {
    const fileBuffer = await downloadTelegramFile(doc.file_id)

    const ext = fileName.split('.').pop() || 'bin'
    const storagePath = `${coachId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(storagePath, fileBuffer, {
        contentType: doc.mime_type || 'application/octet-stream',
      })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('resources').getPublicUrl(storagePath)

    const caption = ctx.message.caption || fileName
    const clientId = await inferClient(coachId, caption)

    await supabase.from('resources').insert({
      coach_id: coachId,
      client_id: clientId,
      name: fileName,
      type: 'document',
      url: urlData.publicUrl,
      file_path: storagePath,
    })

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      client_id: clientId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: `[File: ${fileName}]`,
      message_type: 'document',
      file_url: urlData.publicUrl,
      raw_update: ctx.update as unknown as Json,
    })

    let reply = `File "${fileName}" uploaded and saved as a resource.`
    if (clientId) {
      const { data: client } = await supabase.from('clients').select('company_name').eq('id', clientId).single()
      if (client) reply += ` Linked to ${client.company_name}.`
    }

    await ctx.reply(reply)
  } catch (error) {
    console.error('Document processing error:', error)

    await supabase.from('telegram_updates').insert({
      coach_id: coachId,
      telegram_message_id: ctx.message.message_id,
      chat_id: ctx.chat!.id,
      content: `[File: ${fileName} — upload failed]`,
      message_type: 'document',
      raw_update: ctx.update as unknown as Json,
    })

    await ctx.reply('File received but upload failed. It has been logged for later processing.')
  }
}

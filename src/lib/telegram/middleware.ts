import { NextFunction } from 'grammy'
import { CoachContext } from './bot'
import { createAdminClient } from '@/lib/supabase/server'

export async function coachAuth(ctx: CoachContext, next: NextFunction) {
  const chatId = ctx.chat?.id
  if (!chatId) return

  const supabase = createAdminClient()

  const { data: coach } = await supabase
    .from('coaches')
    .select('id, full_name')
    .eq('telegram_chat_id', chatId)
    .single()

  if (coach) {
    ctx.coachId = coach.id
    ctx.coachName = coach.full_name
    return next()
  }

  // Check if message is /start with linking code
  const text = ctx.message?.text || ''
  if (text.startsWith('/start')) {
    return next()
  }

  // Not linked — prompt them
  await ctx.reply(
    'Your Telegram is not linked to a Kadre account.\n\n' +
    'To link: Go to Settings in Kadre Coach, generate a link code, then send:\n' +
    '/start <code>'
  )
}

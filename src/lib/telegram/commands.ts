import { CoachContext } from './bot'
import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export async function handleStart(ctx: CoachContext) {
  const text = ctx.message?.text || ''
  const parts = text.split(' ')

  if (parts.length < 2) {
    if (ctx.coachId) {
      await ctx.reply(`Welcome back, ${ctx.coachName}! You're already linked.\n\nUse /help to see available commands.`)
    } else {
      await ctx.reply(
        'Welcome to Kadre Coach Bot!\n\n' +
        'To link your account, go to Settings in the Kadre dashboard, generate a link code, then send:\n' +
        '/start <6-digit code>'
      )
    }
    return
  }

  const code = parts[1]
  const supabase = createAdminClient()

  // Find coach with matching link code
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, full_name, notification_preferences')

  const coach = coaches?.find(c => {
    const prefs = c.notification_preferences as Record<string, unknown>
    if (!prefs?._telegram_link_code) return false
    if (prefs._telegram_link_code !== code) return false
    const expires = prefs._telegram_link_code_expires as string
    if (new Date(expires) < new Date()) return false
    return true
  })

  if (!coach) {
    await ctx.reply('Invalid or expired code. Please generate a new one from Settings.')
    return
  }

  // Link the account
  const prefs = coach.notification_preferences as Record<string, unknown>
  delete prefs._telegram_link_code
  delete prefs._telegram_link_code_expires

  await supabase.from('coaches').update({
    telegram_chat_id: ctx.chat!.id,
    telegram_username: ctx.from?.username || null,
    notification_preferences: prefs as unknown as Json,
  }).eq('id', coach.id)

  await ctx.reply(`Account linked! Welcome, ${coach.full_name}.\n\nUse /help to see available commands.`)
}

export async function handleHelp(ctx: CoachContext) {
  await ctx.reply(
    'Kadre Coach Commands:\n\n' +
    '/companies — List your companies\n' +
    '/addcompany <name> — Quick-add a company\n' +
    '/myprefs — View notification preferences\n' +
    '/synthesis — Get today\'s synthesis\n' +
    '/ask <question> — Ask AI about your clients\n\n' +
    'You can also send text updates about your companies. Use #CompanyName to tag a company.\n\n' +
    'Voice notes are transcribed automatically.'
  )
}

export async function handleCompanies(ctx: CoachContext) {
  if (!ctx.coachId) return

  const supabase = createAdminClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('company_name, status, engagement_score')
    .eq('coach_id', ctx.coachId)
    .order('company_name')

  if (!clients || clients.length === 0) {
    await ctx.reply('No companies yet. Add one with /addcompany <name> or from the dashboard.')
    return
  }

  const list = clients.map(c => {
    const emoji = c.status === 'active' ? '🟢' : c.status === 'at_risk' ? '🟡' : '⚪'
    return `${emoji} ${c.company_name} (${c.engagement_score}%)`
  }).join('\n')

  await ctx.reply(`Your companies:\n\n${list}`)
}

export async function handleAddCompany(ctx: CoachContext) {
  if (!ctx.coachId) return

  const text = ctx.message?.text || ''
  const name = text.replace('/addcompany', '').trim()

  if (!name) {
    await ctx.reply('Usage: /addcompany <company name>')
    return
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('clients').insert({
    coach_id: ctx.coachId,
    name,
    company_name: name,
    email: '',
  })

  if (error) {
    await ctx.reply(`Error: ${error.message}`)
    return
  }

  await ctx.reply(`Added company: ${name}`)
}

export async function handleMyPrefs(ctx: CoachContext) {
  if (!ctx.coachId) return

  const supabase = createAdminClient()
  const { data: coach } = await supabase
    .from('coaches')
    .select('notification_preferences')
    .eq('id', ctx.coachId)
    .single()

  if (!coach) return

  const prefs = coach.notification_preferences as Record<string, boolean>
  const lines = Object.entries(prefs)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, val]) => `${val ? '✅' : '❌'} ${key.replace(/_/g, ' ')}`)

  await ctx.reply(`Your notification preferences:\n\n${lines.join('\n')}\n\nUpdate in Settings on the dashboard.`)
}

export async function handleSynthesis(ctx: CoachContext) {
  if (!ctx.coachId) return

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: synthesis } = await supabase
    .from('daily_syntheses')
    .select('content, summary')
    .eq('coach_id', ctx.coachId)
    .eq('synthesis_date', today)
    .single()

  if (!synthesis) {
    await ctx.reply('No synthesis generated yet for today. It typically runs at 8 PM.')
    return
  }

  await ctx.reply(synthesis.summary || synthesis.content)
}

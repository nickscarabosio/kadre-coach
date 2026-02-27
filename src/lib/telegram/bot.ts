import { Bot, Context } from 'grammy'

export interface CoachContext extends Context {
  coachId?: string
  coachName?: string
}

let botInstance: Bot<CoachContext> | null = null

export function getBot(): Bot<CoachContext> {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
    botInstance = new Bot<CoachContext>(token)
  }
  return botInstance
}

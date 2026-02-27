import { NextRequest, NextResponse } from 'next/server'
import { getBot } from '@/lib/telegram/bot'
import { coachAuth } from '@/lib/telegram/middleware'
import { handleStart, handleHelp, handleCompanies, handleAddCompany, handleMyPrefs, handleSynthesis } from '@/lib/telegram/commands'
import { handleTextMessage, handleVoiceMessage, handleDocument } from '@/lib/telegram/handlers'

let setupDone = false
let initDone = false

function setupBot() {
  if (setupDone) return
  setupDone = true

  const bot = getBot()

  // Auth middleware
  bot.use(coachAuth)

  // Commands
  bot.command('start', handleStart)
  bot.command('help', handleHelp)
  bot.command('companies', handleCompanies)
  bot.command('addcompany', handleAddCompany)
  bot.command('myprefs', handleMyPrefs)
  bot.command('synthesis', handleSynthesis)
  bot.command('ask', handleTextMessage)

  // Message handlers
  bot.on('message:text', handleTextMessage)
  bot.on('message:voice', handleVoiceMessage)
  bot.on('message:document', handleDocument)
}

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    setupBot()
    const bot = getBot()

    if (!initDone) {
      await bot.init()
      initDone = true
    }

    const update = await request.json()
    await bot.handleUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: true }) // Always return 200 to prevent retries
  }
}

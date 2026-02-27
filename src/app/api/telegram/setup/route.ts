import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.RAILWAY_PUBLIC_DOMAIN

  if (!botToken || !appUrl) {
    return NextResponse.json({ error: 'Missing TELEGRAM_BOT_TOKEN or app URL' }, { status: 500 })
  }

  const webhookUrl = `${appUrl.startsWith('http') ? appUrl : `https://${appUrl}`}/api/telegram/webhook`

  const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ['message', 'callback_query'],
    }),
  })

  const result = await response.json()
  return NextResponse.json(result)
}

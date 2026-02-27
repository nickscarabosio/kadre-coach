export async function sendUrgentAlert(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhone) {
    console.warn('Twilio credentials not configured, skipping SMS')
    return
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const body = new URLSearchParams({
    To: phone,
    From: fromPhone,
    Body: message,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Twilio SMS error:', error)
    throw new Error(`SMS failed: ${response.status}`)
  }
}

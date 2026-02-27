export function dailySynthesisTemplate(coachName: string, content: string, date: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(43,52,80,0.08); padding: 32px;">
    <h1 style="color: #2b3450; font-size: 24px; margin: 0 0 8px;">Daily Synthesis</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">${date} — Hi ${coachName}</p>
    <div style="color: #2b3450; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${content}</div>
    <hr style="border: none; border-top: 1px solid rgba(43,52,80,0.08); margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent by Kadre Coach</p>
  </div>
</body>
</html>`
}

export function checkInAlertTemplate(coachName: string, clientName: string, energyLevel: number, goalProgress: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(43,52,80,0.08); padding: 32px;">
    <h1 style="color: #2b3450; font-size: 24px; margin: 0 0 8px;">New Check-in Received</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Hi ${coachName},</p>
    <p style="color: #2b3450; font-size: 15px;"><strong>${clientName}</strong> just submitted a check-in:</p>
    <div style="background: #f8f9fb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0; color: #2b3450;">Energy Level: <strong>${energyLevel}/10</strong></p>
      <p style="margin: 4px 0; color: #2b3450;">Goal Progress: <strong>${goalProgress}</strong></p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard" style="display: inline-block; background: #0089ca; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Dashboard</a>
    <hr style="border: none; border-top: 1px solid rgba(43,52,80,0.08); margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent by Kadre Coach</p>
  </div>
</body>
</html>`
}

export function assignmentEmailTemplate(coachName: string, assigneeName: string, title: string, description: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(43,52,80,0.08); padding: 32px;">
    <h1 style="color: #2b3450; font-size: 24px; margin: 0 0 8px;">New Assignment</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Hi ${assigneeName},</p>
    <p style="color: #2b3450; font-size: 15px; line-height: 1.6;"><strong>${coachName}</strong> has assigned you a new task:</p>
    <div style="background: #f8f9fb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: #2b3450; font-weight: 600; font-size: 16px;">${title}</p>
      ${description ? `<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">${description}</p>` : ''}
    </div>
    <hr style="border: none; border-top: 1px solid rgba(43,52,80,0.08); margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent by Kadre Coach</p>
  </div>
</body>
</html>`
}

export function formInviteTemplate(coachName: string, formTitle: string, formUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(43,52,80,0.08); padding: 32px;">
    <h1 style="color: #2b3450; font-size: 24px; margin: 0 0 8px;">You've been invited to fill out a form</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Hi there,</p>
    <p style="color: #2b3450; font-size: 15px; line-height: 1.6;"><strong>${coachName}</strong> has invited you to complete: <strong>${formTitle}</strong></p>
    <a href="${formUrl}" style="display: inline-block; background: #0089ca; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px;">Fill Out Form</a>
    <hr style="border: none; border-top: 1px solid rgba(43,52,80,0.08); margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent by Kadre Coach</p>
  </div>
</body>
</html>`
}

export function welcomeTemplate(coachName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: 'Inter', -apple-system, sans-serif; background: #f8f9fb; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid rgba(43,52,80,0.08); padding: 32px;">
    <h1 style="color: #2b3450; font-size: 24px; margin: 0 0 16px;">Welcome to Kadre Coach</h1>
    <p style="color: #2b3450; font-size: 15px; line-height: 1.6;">Hi ${coachName},</p>
    <p style="color: #2b3450; font-size: 15px; line-height: 1.6;">Your coaching platform is ready. Here's how to get started:</p>
    <ol style="color: #2b3450; font-size: 15px; line-height: 1.8;">
      <li>Add your companies from the dashboard</li>
      <li>Connect Telegram for real-time updates</li>
      <li>Set up your notification preferences</li>
    </ol>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard" style="display: inline-block; background: #0089ca; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Go to Dashboard</a>
    <hr style="border: none; border-top: 1px solid rgba(43,52,80,0.08); margin: 24px 0;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">Sent by Kadre Coach</p>
  </div>
</body>
</html>`
}

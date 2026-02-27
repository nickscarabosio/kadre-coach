import { getResendClient } from './client'
import { dailySynthesisTemplate, checkInAlertTemplate, welcomeTemplate, assignmentEmailTemplate, formInviteTemplate } from './templates'

const FROM = 'Kadre Coach <notifications@kadrecoach.com>'

export async function sendDailySynthesis(email: string, coachName: string, content: string, date: string) {
  const resend = getResendClient()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Daily Synthesis — ${date}`,
    html: dailySynthesisTemplate(coachName, content, date),
  })
}

export async function sendCheckInAlert(email: string, coachName: string, clientName: string, energyLevel: number, goalProgress: string) {
  const resend = getResendClient()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `New Check-in: ${clientName}`,
    html: checkInAlertTemplate(coachName, clientName, energyLevel, goalProgress),
  })
}

export async function sendWelcomeEmail(email: string, coachName: string) {
  const resend = getResendClient()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to Kadre Coach',
    html: welcomeTemplate(coachName),
  })
}

export async function sendAssignmentNotification(email: string, coachName: string, assigneeName: string, title: string, description: string) {
  const resend = getResendClient()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `New Assignment: ${title}`,
    html: assignmentEmailTemplate(coachName, assigneeName, title, description),
  })
}

export async function sendFormInvite(email: string, coachName: string, formTitle: string, formUrl: string) {
  const resend = getResendClient()

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${coachName} invited you to fill out: ${formTitle}`,
    html: formInviteTemplate(coachName, formTitle, formUrl),
  })
}

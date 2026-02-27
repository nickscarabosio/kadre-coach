import { Resend } from 'resend'

let resendInstance: Resend | null = null

export function getResendClient(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

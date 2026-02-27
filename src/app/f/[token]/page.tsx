import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicForm } from './public-form'

export default async function PublicFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: form, error } = await supabase
    .from('forms')
    .select('*')
    .eq('public_token', token)
    .eq('status', 'published')
    .single()

  if (error || !form) notFound()

  // Check expiration
  if (form.public_token_expires_at && new Date(form.public_token_expires_at) < new Date()) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-xl mx-auto">
        <PublicForm form={form} />
      </div>
    </div>
  )
}

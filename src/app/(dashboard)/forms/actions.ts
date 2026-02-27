'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createForm(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.from('forms').insert({
    coach_id: user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
  }).select().single()

  if (error) return { error: error.message }
  revalidatePath('/forms')
  return { success: true, id: data.id }
}

export async function updateForm(formId: string, data: { title?: string; description?: string; fields?: unknown[]; status?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.fields !== undefined) updateData.fields = JSON.parse(JSON.stringify(data.fields))
  if (data.status !== undefined) updateData.status = data.status

  const { error } = await supabase.from('forms').update(updateData).eq('id', formId).eq('coach_id', user.id)
  if (error) return { error: error.message }
  revalidatePath(`/forms/${formId}`)
  revalidatePath('/forms')
  return { success: true }
}

export async function deleteForm(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('forms').delete().eq('id', formId).eq('coach_id', user.id)
  if (error) return { error: error.message }
  redirect('/forms')
}

export async function duplicateForm(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: original } = await supabase.from('forms').select('*').eq('id', formId).eq('coach_id', user.id).single()
  if (!original) return { error: 'Form not found' }

  const { error } = await supabase.from('forms').insert({
    coach_id: user.id,
    title: `${original.title} (Copy)`,
    description: original.description,
    fields: original.fields,
    status: 'draft',
  })

  if (error) return { error: error.message }
  revalidatePath('/forms')
  return { success: true }
}

export async function generatePublicLink(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
  const { error } = await supabase.from('forms').update({
    public_token: token,
    status: 'published',
  }).eq('id', formId).eq('coach_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/forms/${formId}`)
  return { success: true, token }
}

export async function submitForm(formId: string, data: { submitter_name?: string; submitter_email?: string; responses: Record<string, unknown>; client_id?: string }) {
  const supabase = await createClient()

  const { error } = await supabase.from('form_submissions').insert({
    form_id: formId,
    submitter_name: data.submitter_name || null,
    submitter_email: data.submitter_email || null,
    responses: JSON.parse(JSON.stringify(data.responses)),
    client_id: data.client_id || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getFormSubmissions(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: null }

  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })

  if (error) return { error: error.message, data: null }
  return { data }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContact(clientId: string, data: {
  name: string
  email?: string | null
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('contacts').insert({
    client_id: clientId,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || null,
    is_primary: data.is_primary || false,
  })

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/people')
  return { success: true }
}

export async function updateContact(contactId: string, clientId: string, data: {
  name?: string
  email?: string | null
  phone?: string | null
  role?: string | null
  is_primary?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('contacts')
    .update(data)
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/people')
  return { success: true }
}

export async function deleteContact(contactId: string, clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/people')
  return { success: true }
}

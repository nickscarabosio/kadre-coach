'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createResource(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File | null
  let url = formData.get('url') as string
  let filePath: string | null = null

  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(path, file)

    if (uploadError) return { error: uploadError.message }

    const { data: publicUrl } = supabase.storage
      .from('resources')
      .getPublicUrl(path)

    url = publicUrl.publicUrl
    filePath = path
  }

  if (!url) return { error: 'Please provide a URL or file' }

  const { error } = await supabase.from('resources').insert({
    coach_id: user.id,
    client_id: formData.get('client_id') as string || null,
    name: formData.get('name') as string,
    type: formData.get('type') as string || 'link',
    url,
    file_path: filePath,
  })

  if (error) return { error: error.message }

  revalidatePath('/resources')
  return { success: true }
}

export async function deleteResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get file path before deleting record
  const { data: resource } = await supabase.from('resources')
    .select('file_path')
    .eq('id', resourceId)
    .eq('coach_id', user.id)
    .single()

  if (resource?.file_path) {
    await supabase.storage.from('resources').remove([resource.file_path])
  }

  const { error } = await supabase.from('resources')
    .delete()
    .eq('id', resourceId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/resources')
  return { success: true }
}

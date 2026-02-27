'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export async function createDocument(formData: FormData) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const documentType = formData.get('document_type') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const category = formData.get('category') as string || 'general'

  if (!title) return { error: 'Title is required' }

  let fileUrl: string | null = null
  let filePath: string | null = null
  let fileName: string | null = null
  let fileType: string | null = null
  let fileSize: number | null = null
  let url: string | null = null
  let content: string | null = null

  if (documentType === 'file') {
    const file = formData.get('file') as File | null

    if (!file || file.size === 0) return { error: 'Please select a file' }

    const ext = file.name.split('.').pop()
    const path = `${coachId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file)

    if (uploadError) return { error: uploadError.message }

    const { data: publicUrl } = supabase.storage
      .from('documents')
      .getPublicUrl(path)

    fileUrl = publicUrl.publicUrl
    filePath = path
    fileName = file.name
    fileType = file.type
    fileSize = file.size
  } else if (documentType === 'link') {
    url = formData.get('url') as string
    if (!url) return { error: 'Please provide a URL' }
  } else if (documentType === 'richtext') {
    content = formData.get('content') as string
    if (!content) return { error: 'Please write some content' }
  }

  const { error } = await supabase.from('documents').insert({
    coach_id: coachId,
    document_type: documentType,
    title,
    description: description || null,
    category,
    file_url: fileUrl,
    file_path: filePath,
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    url,
    content,
  })

  if (error) return { error: error.message }

  revalidatePath('/library')
  return { success: true }
}

export async function updateDocument(documentId: string, formData: FormData) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const content = formData.get('content') as string | null
  const url = formData.get('url') as string | null
  const category = formData.get('category') as string | null

  const updateData: Record<string, unknown> = {}
  if (title) updateData.title = title
  if (description !== null) updateData.description = description
  if (content !== null) updateData.content = content
  if (url !== null) updateData.url = url
  if (category) updateData.category = category

  const { error } = await supabase.from('documents')
    .update(updateData)
    .eq('id', documentId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath('/library')
  return { success: true }
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  // Get file path before deleting record
  const { data: document } = await supabase.from('documents')
    .select('file_path')
    .eq('id', documentId)
    .eq('coach_id', coachId)
    .single()

  if (document?.file_path) {
    await supabase.storage.from('documents').remove([document.file_path])
  }

  const { error } = await supabase.from('documents')
    .delete()
    .eq('id', documentId)
    .eq('coach_id', coachId)

  if (error) return { error: error.message }

  revalidatePath('/library')
  return { success: true }
}

export async function shareDocument(documentId: string, clientIds: string[]) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  // Verify the document belongs to this coach
  const { data: document } = await supabase.from('documents')
    .select('id')
    .eq('id', documentId)
    .eq('coach_id', coachId)
    .single()

  if (!document) return { error: 'Document not found' }

  const inserts = clientIds.map(clientId => ({
    document_id: documentId,
    client_id: clientId,
  }))

  const { error } = await supabase.from('document_shares').insert(inserts)

  if (error) return { error: error.message }

  revalidatePath('/library')
  return { success: true }
}

export async function unshareDocument(documentId: string, clientId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('document_shares')
    .delete()
    .eq('document_id', documentId)
    .eq('client_id', clientId)

  if (error) return { error: error.message }

  revalidatePath('/library')
  return { success: true }
}

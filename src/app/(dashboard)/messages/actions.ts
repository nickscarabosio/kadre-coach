'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoachId } from '@/lib/supabase/get-coach-id'
import { revalidatePath } from 'next/cache'

export async function createConversation(data: {
  subject: string
  conversation_type: 'direct' | 'company' | 'coach'
  client_id?: string | null
  participant_contact_ids?: string[]
  participant_coach_ids?: string[]
  initial_message: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  // Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      coach_id: coachId,
      subject: data.subject || null,
      conversation_type: data.conversation_type,
      client_id: data.client_id || null,
    })
    .select()
    .single()

  if (convError || !conversation) return { error: convError?.message || 'Failed to create conversation' }

  // Add participants
  const participants: { conversation_id: string; participant_type: string; coach_id?: string; contact_id?: string }[] = []

  // Add the current coach as participant
  participants.push({
    conversation_id: conversation.id,
    participant_type: 'coach',
    coach_id: user.id,
  })

  for (const contactId of data.participant_contact_ids || []) {
    participants.push({
      conversation_id: conversation.id,
      participant_type: 'contact',
      contact_id: contactId,
    })
  }

  for (const participantCoachId of data.participant_coach_ids || []) {
    if (participantCoachId !== user.id) {
      participants.push({
        conversation_id: conversation.id,
        participant_type: 'coach',
        coach_id: participantCoachId,
      })
    }
  }

  if (participants.length > 0) {
    await supabase.from('conversation_participants').insert(participants)
  }

  // Send initial message
  // We need a client_id for legacy compatibility.
  let messageClientId = data.client_id

  if (!messageClientId && data.participant_contact_ids?.length) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('client_id')
      .eq('id', data.participant_contact_ids[0])
      .single()
    messageClientId = contact?.client_id || null
  }

  // Coach-to-coach conversations may not include contacts, so fall back to any client
  // associated with the sender to ensure the initial message is always persisted.
  if (!messageClientId) {
    const { data: anyClient } = await supabase
      .from('clients')
      .select('id')
      .eq('coach_id', coachId)
      .limit(1)
      .single()
    messageClientId = anyClient?.id || null
  }

  if (!messageClientId) return { error: 'No client found for message' }

  const { error: messageError } = await supabase.from('messages').insert({
    coach_id: coachId,
    client_id: messageClientId,
    conversation_id: conversation.id,
    content: data.initial_message,
    sender_type: 'coach',
    sender_coach_id: user.id,
  })

  if (messageError) return { error: messageError.message }

  revalidatePath('/messages')
  return { success: true, conversationId: conversation.id }
}

export async function sendMessageToConversation(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const coachId = await getCoachId(supabase)
  if (!coachId) return { error: 'Not authenticated' }

  // Get the conversation to find client_id
  const { data: conversation } = await supabase
    .from('conversations')
    .select('client_id, coach_id')
    .eq('id', conversationId)
    .single()

  if (!conversation) return { error: 'Conversation not found' }

  // If no client_id on conversation, try to find one from participants
  let clientId = conversation.client_id
  if (!clientId) {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('contact_id')
      .eq('conversation_id', conversationId)
      .eq('participant_type', 'contact')
      .limit(1)

    if (participants?.[0]?.contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('client_id')
        .eq('id', participants[0].contact_id)
        .single()
      clientId = contact?.client_id || null
    }
  }

  // Fallback: get any client for this coach
  if (!clientId) {
    const { data: anyClient } = await supabase
      .from('clients')
      .select('id')
      .eq('coach_id', coachId)
      .limit(1)
      .single()
    clientId = anyClient?.id || null
  }

  if (!clientId) return { error: 'No client found for message' }

  const { error } = await supabase.from('messages').insert({
    coach_id: coachId,
    client_id: clientId,
    conversation_id: conversationId,
    content,
    sender_type: 'coach',
    sender_coach_id: user.id,
  })

  if (error) return { error: error.message }

  // Update conversation updated_at
  await supabase.from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  revalidatePath('/messages')
  return { success: true }
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()
  const coachId = await getCoachId(supabase)

  if (!coachId) return { error: 'Not authenticated' }

  const { error } = await supabase.from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('coach_id', coachId)
    .eq('is_read', false)

  if (error) return { error: error.message }

  revalidatePath('/messages')
  return { success: true }
}

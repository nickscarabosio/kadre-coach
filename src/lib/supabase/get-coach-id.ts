import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the effective coach ID for the current user.
 * If the user is a team member (has parent_coach_id), returns the parent's ID.
 * Otherwise returns the user's own ID.
 */
export async function getCoachId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: coach } = await supabase
    .from('coaches')
    .select('parent_coach_id')
    .eq('id', user.id)
    .single()

  return coach?.parent_coach_id || user.id
}

/**
 * Resolves the effective coach ID for data queries (clients, tasks, etc.).
 * If the coach is a team member, returns the parent coach's ID so they
 * can access shared data. Otherwise returns the given ID unchanged.
 * Works with the admin client (no auth session required).
 */
export async function resolveCoachId(supabase: SupabaseClient, coachId: string): Promise<string> {
  const { data: coach } = await supabase
    .from('coaches')
    .select('parent_coach_id')
    .eq('id', coachId)
    .single()

  return coach?.parent_coach_id ?? coachId
}

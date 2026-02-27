-- Migration V5: Coach Profile, Message Snippets, and Team Support

-- ============================================================
-- PART A: Coach profile + Message Snippets
-- ============================================================

-- Coach profile: bio and booking_link
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS booking_link text;

-- Message snippets for coaches
CREATE TABLE IF NOT EXISTS coach_message_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_message_snippets_coach_id ON coach_message_snippets(coach_id);

ALTER TABLE coach_message_snippets ENABLE ROW LEVEL SECURITY;

-- Trigger to keep updated_at in sync
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coach_message_snippets_updated_at') THEN
    CREATE TRIGGER update_coach_message_snippets_updated_at
      BEFORE UPDATE ON coach_message_snippets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- PART B: Team Support
-- Adds parent_coach_id for team members sharing the same account
-- Run in Supabase SQL Editor after migration-v4.sql

-- ============================================================
-- 1. ADD parent_coach_id TO COACHES
-- ============================================================
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS parent_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_coaches_parent ON coaches(parent_coach_id);

-- ============================================================
-- 2. CREATE get_coach_id() FUNCTION
-- Returns parent_coach_id if set (team member), otherwise auth.uid()
-- ============================================================
CREATE OR REPLACE FUNCTION get_coach_id() RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT parent_coach_id FROM public.coaches WHERE id = auth.uid()),
    auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. UPDATE ALL RLS POLICIES
-- Replace auth.uid() with get_coach_id() so team members share data
-- ============================================================

-- COACHES: team members can read the parent coach row too
DROP POLICY IF EXISTS "coaches_own" ON coaches;
CREATE POLICY "coaches_own" ON coaches FOR ALL
  USING (id = auth.uid() OR id = get_coach_id())
  WITH CHECK (id = auth.uid() OR id = get_coach_id());

-- CLIENTS
DROP POLICY IF EXISTS "clients_own_coach" ON clients;
CREATE POLICY "clients_own_coach" ON clients FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- PROGRAMS
DROP POLICY IF EXISTS "programs_own_coach" ON programs;
CREATE POLICY "programs_own_coach" ON programs FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- ENROLLMENTS
DROP POLICY IF EXISTS "enrollments_own_coach" ON enrollments;
CREATE POLICY "enrollments_own_coach" ON enrollments FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id()));

-- MESSAGES
DROP POLICY IF EXISTS "messages_own_coach" ON messages;
CREATE POLICY "messages_own_coach" ON messages FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- RESOURCES
DROP POLICY IF EXISTS "resources_own_coach" ON resources;
CREATE POLICY "resources_own_coach" ON resources FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- REFLECTIONS (keep anonymous insert)
DROP POLICY IF EXISTS "reflections_own_coach" ON reflections;
CREATE POLICY "reflections_own_coach" ON reflections FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id()));

-- SESSION NOTES
DROP POLICY IF EXISTS "session_notes_own_coach" ON session_notes;
CREATE POLICY "session_notes_own_coach" ON session_notes FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- TASKS
DROP POLICY IF EXISTS "tasks_own_coach" ON tasks;
CREATE POLICY "tasks_own_coach" ON tasks FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- CONTACTS
DROP POLICY IF EXISTS "contacts_own_coach" ON contacts;
CREATE POLICY "contacts_own_coach" ON contacts FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE coach_id = get_coach_id()));

-- TELEGRAM UPDATES
DROP POLICY IF EXISTS "telegram_updates_own_coach" ON telegram_updates;
CREATE POLICY "telegram_updates_own_coach" ON telegram_updates FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- DAILY SYNTHESES
DROP POLICY IF EXISTS "daily_syntheses_own_coach" ON daily_syntheses;
CREATE POLICY "daily_syntheses_own_coach" ON daily_syntheses FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- TASK SECTIONS
DROP POLICY IF EXISTS "Coaches can manage their own task sections" ON task_sections;
CREATE POLICY "task_sections_own_coach" ON task_sections FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- TASK LABELS
DROP POLICY IF EXISTS "Coaches can manage their own task labels" ON task_labels;
CREATE POLICY "task_labels_own_coach" ON task_labels FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- TASK LABEL ASSIGNMENTS
DROP POLICY IF EXISTS "Coaches can manage their own task label assignments" ON task_label_assignments;
CREATE POLICY "task_label_assignments_own_coach" ON task_label_assignments FOR ALL
  USING (task_id IN (SELECT id FROM tasks WHERE coach_id = get_coach_id()))
  WITH CHECK (task_id IN (SELECT id FROM tasks WHERE coach_id = get_coach_id()));

-- COACH CHECK-INS
DROP POLICY IF EXISTS "Coaches can manage their own check-ins" ON coach_check_ins;
CREATE POLICY "coach_check_ins_own_coach" ON coach_check_ins FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- CONVERSATIONS
DROP POLICY IF EXISTS "Coaches can manage their own conversations" ON conversations;
CREATE POLICY "conversations_own_coach" ON conversations FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- CONVERSATION PARTICIPANTS
DROP POLICY IF EXISTS "Coaches can manage participants in their conversations" ON conversation_participants;
CREATE POLICY "conversation_participants_own_coach" ON conversation_participants FOR ALL
  USING (conversation_id IN (SELECT id FROM conversations WHERE coach_id = get_coach_id()))
  WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE coach_id = get_coach_id()));

-- CLIENT PROJECTS
DROP POLICY IF EXISTS "Coaches can manage projects for their clients" ON client_projects;
CREATE POLICY "client_projects_own_coach" ON client_projects FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- PROGRAM PHASES
DROP POLICY IF EXISTS "Coaches can manage own program phases" ON program_phases;
CREATE POLICY "program_phases_own_coach" ON program_phases FOR ALL
  USING (program_id IN (SELECT id FROM programs WHERE coach_id = get_coach_id()))
  WITH CHECK (program_id IN (SELECT id FROM programs WHERE coach_id = get_coach_id()));

-- PROGRAM ASSIGNMENTS
DROP POLICY IF EXISTS "Coaches can manage own program assignments" ON program_assignments;
CREATE POLICY "program_assignments_own_coach" ON program_assignments FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- ASSIGNED ASSIGNMENTS
DROP POLICY IF EXISTS "Coaches can manage own assigned assignments" ON assigned_assignments;
CREATE POLICY "assigned_assignments_own_coach" ON assigned_assignments FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- ASSIGNMENT TEMPLATES
DROP POLICY IF EXISTS "Coaches can manage own assignment templates" ON assignment_templates;
CREATE POLICY "assignment_templates_own_coach" ON assignment_templates FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- DOCUMENTS
DROP POLICY IF EXISTS "Coaches can manage own documents" ON documents;
CREATE POLICY "documents_own_coach" ON documents FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- DOCUMENT SHARES
DROP POLICY IF EXISTS "Coaches can manage own document shares" ON document_shares;
CREATE POLICY "document_shares_own_coach" ON document_shares FOR ALL
  USING (document_id IN (SELECT id FROM documents WHERE coach_id = get_coach_id()))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE coach_id = get_coach_id()));

-- FORMS (keep public read policy)
DROP POLICY IF EXISTS "Coaches can manage own forms" ON forms;
CREATE POLICY "forms_own_coach" ON forms FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

-- FORM SUBMISSIONS (keep public insert policy)
DROP POLICY IF EXISTS "Coaches can read own form submissions" ON form_submissions;
CREATE POLICY "form_submissions_own_coach" ON form_submissions FOR SELECT
  USING (form_id IN (SELECT id FROM forms WHERE coach_id = get_coach_id()));

-- COACH MESSAGE SNIPPETS (uses get_coach_id for team sharing)
DROP POLICY IF EXISTS "coach_message_snippets_own" ON coach_message_snippets;
CREATE POLICY "coach_message_snippets_own" ON coach_message_snippets FOR ALL
  USING (coach_id = get_coach_id())
  WITH CHECK (coach_id = get_coach_id());

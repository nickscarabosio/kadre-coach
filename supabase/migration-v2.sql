-- Migration V2: Dashboard Redesign
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Tasks expansion (Todoist-like)
-- ============================================================
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS due_time time,
  ADD COLUMN IF NOT EXISTS priority_level smallint DEFAULT 4,
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS section_id uuid,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_rule text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS todoist_id text,
  ADD COLUMN IF NOT EXISTS todoist_sync_at timestamptz;

-- ============================================================
-- 2. Task Sections
-- ============================================================
CREATE TABLE IF NOT EXISTS task_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_section FOREIGN KEY (section_id) REFERENCES task_sections(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Task Labels
-- ============================================================
CREATE TABLE IF NOT EXISTS task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_label_assignments (
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ============================================================
-- 4. Coach Check-Ins
-- ============================================================
CREATE TABLE IF NOT EXISTS coach_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  check_in_type text NOT NULL DEFAULT 'call',
  title text,
  notes text,
  duration_minutes integer,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. Conversations (multi-recipient messaging)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  subject text,
  conversation_type text NOT NULL DEFAULT 'direct',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_type text NOT NULL DEFAULT 'contact',
  coach_id uuid REFERENCES coaches(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. Alter messages for conversation support
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'coach',
  ADD COLUMN IF NOT EXISTS sender_coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================================
-- 7. Coaches Todoist prep
-- ============================================================
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS todoist_api_token text,
  ADD COLUMN IF NOT EXISTS todoist_sync_enabled boolean DEFAULT false;

-- ============================================================
-- 8. Updated_at triggers for new tables
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_task_sections_updated_at') THEN
    CREATE TRIGGER update_task_sections_updated_at
      BEFORE UPDATE ON task_sections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coach_check_ins_updated_at') THEN
    CREATE TRIGGER update_coach_check_ins_updated_at
      BEFORE UPDATE ON coach_check_ins
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================================
-- 9. RLS Policies
-- ============================================================

-- Task Sections
ALTER TABLE task_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own task sections"
  ON task_sections FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Task Labels
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own task labels"
  ON task_labels FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Task Label Assignments
ALTER TABLE task_label_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own task label assignments"
  ON task_label_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_label_assignments.task_id
      AND t.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_label_assignments.task_id
      AND t.coach_id = auth.uid()
    )
  );

-- Coach Check-Ins
ALTER TABLE coach_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own check-ins"
  ON coach_check_ins FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their own conversations"
  ON conversations FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Conversation Participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage participants in their conversations"
  ON conversation_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.coach_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.coach_id = auth.uid()
    )
  );

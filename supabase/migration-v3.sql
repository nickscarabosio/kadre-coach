-- Migration V3: Dashboard Updates
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Client Projects (Kanban board per client)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'idea',
  sort_order integer DEFAULT 0,
  assigned_to text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Status values: 'idea', 'planning', 'needs_attention', 'in_progress', 'complete'

ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage projects for their clients"
  ON client_projects FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_projects_updated_at') THEN
    CREATE TRIGGER update_client_projects_updated_at
      BEFORE UPDATE ON client_projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================================
-- 2. Recording URL fields
-- ============================================================
ALTER TABLE coach_check_ins ADD COLUMN IF NOT EXISTS recording_url text;
ALTER TABLE session_notes ADD COLUMN IF NOT EXISTS recording_url text;

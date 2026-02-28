-- Migration v9: Project Milestones + milestone_id on tasks

-- New table: project_milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own milestones" ON project_milestones
  FOR ALL USING (coach_id = auth.uid() OR coach_id IN (
    SELECT parent_coach_id FROM coaches WHERE id = auth.uid()
  ));

-- Add milestone_id to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL;

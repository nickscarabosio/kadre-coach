-- Tasks: link to project and optional assignee coach
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES client_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to_coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_coach_id ON tasks(assigned_to_coach_id);

-- Migration V4: Programs Phase Builder, Library (Documents), Forms
-- Run in Supabase SQL Editor after migration-v3.sql

-- ============================================================
-- 1. PROGRAM PHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_value INT DEFAULT 1,
  duration_unit TEXT DEFAULT 'weeks' CHECK (duration_unit IN ('days', 'weeks', 'months')),
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_program_phases_updated_at
  BEFORE UPDATE ON program_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_program_phases_program ON program_phases(program_id);

ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own program phases"
  ON program_phases FOR ALL
  USING (program_id IN (SELECT id FROM programs WHERE coach_id = auth.uid()))
  WITH CHECK (program_id IN (SELECT id FROM programs WHERE coach_id = auth.uid()));

-- ============================================================
-- 2. PROGRAM ASSIGNMENTS (templates within phases)
-- ============================================================
CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES program_phases(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'task' CHECK (assignment_type IN ('task', 'reflection', 'resource', 'video', 'quiz')),
  response_type TEXT DEFAULT 'text' CHECK (response_type IN ('text', 'file', 'checkbox', 'none')),
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('once', 'daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_day INT,
  video_url TEXT,
  resource_url TEXT,
  resource_name TEXT,
  delay_days INT DEFAULT 0,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_program_assignments_updated_at
  BEFORE UPDATE ON program_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_program_assignments_phase ON program_assignments(phase_id);
CREATE INDEX idx_program_assignments_coach ON program_assignments(coach_id);

ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own program assignments"
  ON program_assignments FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ============================================================
-- 3. ASSIGNED ASSIGNMENTS (instances sent to clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS assigned_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES program_assignments(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  assignee_name TEXT,
  assignee_email TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'in_progress', 'completed', 'overdue')),
  due_date DATE,
  response_text TEXT,
  response_file_url TEXT,
  email_sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_assigned_assignments_updated_at
  BEFORE UPDATE ON assigned_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_assigned_assignments_coach ON assigned_assignments(coach_id);
CREATE INDEX idx_assigned_assignments_enrollment ON assigned_assignments(enrollment_id);
CREATE INDEX idx_assigned_assignments_client ON assigned_assignments(client_id);

ALTER TABLE assigned_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own assigned assignments"
  ON assigned_assignments FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ============================================================
-- 4. ASSIGNMENT TEMPLATES (reusable, not tied to a phase)
-- ============================================================
CREATE TABLE IF NOT EXISTS assignment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'task' CHECK (assignment_type IN ('task', 'reflection', 'resource', 'video', 'quiz')),
  video_url TEXT,
  resource_url TEXT,
  resource_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_assignment_templates_updated_at
  BEFORE UPDATE ON assignment_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE assignment_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own assignment templates"
  ON assignment_templates FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ============================================================
-- 5. ALTER ENROLLMENTS — add current_phase_id
-- ============================================================
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS current_phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL;

-- ============================================================
-- 6. DOCUMENTS (unified library — replaces resources UI)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  document_type TEXT DEFAULT 'file' CHECK (document_type IN ('file', 'link', 'richtext')),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_url TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  content TEXT,
  url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_documents_coach ON documents(coach_id);
CREATE INDEX idx_documents_client ON documents(client_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own documents"
  ON documents FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- ============================================================
-- 7. DOCUMENT SHARES
-- ============================================================
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, client_id)
);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own document shares"
  ON document_shares FOR ALL
  USING (document_id IN (SELECT id FROM documents WHERE coach_id = auth.uid()))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE coach_id = auth.uid()));

-- ============================================================
-- 8. DATA MIGRATION: resources → documents (preserves original table)
-- ============================================================
INSERT INTO documents (coach_id, document_type, title, file_url, file_path, url, client_id, created_at)
SELECT
  coach_id,
  CASE WHEN type = 'document' THEN 'file' ELSE 'link' END,
  name,
  CASE WHEN type = 'document' THEN url ELSE NULL END,
  file_path,
  CASE WHEN type = 'link' THEN url ELSE NULL END,
  client_id,
  created_at
FROM resources
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. FORMS
-- ============================================================
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  public_token TEXT UNIQUE,
  public_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_forms_coach ON forms(coach_id);
CREATE INDEX idx_forms_token ON forms(public_token);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own forms"
  ON forms FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Public read access for published forms via token
CREATE POLICY "Public can read published forms by token"
  ON forms FOR SELECT
  USING (status = 'published' AND public_token IS NOT NULL);

-- ============================================================
-- 10. FORM SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  submitter_name TEXT,
  submitter_email TEXT,
  responses JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can read own form submissions"
  ON form_submissions FOR SELECT
  USING (form_id IN (SELECT id FROM forms WHERE coach_id = auth.uid()));

-- Public insert for published forms
CREATE POLICY "Public can submit to published forms"
  ON form_submissions FOR INSERT
  WITH CHECK (form_id IN (SELECT id FROM forms WHERE status = 'published' AND public_token IS NOT NULL));

-- ============================================================
-- 11. STORAGE BUCKET for documents (if not reusing resources bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can read documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

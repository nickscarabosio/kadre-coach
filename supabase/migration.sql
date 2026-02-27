-- Kadre Coach: Schema Migration
-- Run this in Supabase SQL Editor

-- Company-first: add columns to clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE clients SET company_name = COALESCE(NULLIF(company, ''), name) WHERE company_name IS NULL;
ALTER TABLE clients ALTER COLUMN company_name SET NOT NULL;

-- Telegram integration on coaches
ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS telegram_chat_id bigint,
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email_daily_synthesis":true,"email_check_in_alerts":true,"telegram_check_in_alerts":true,"telegram_daily_synthesis":true,"sms_urgent_alerts":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS phone text;

-- Contacts table (team members under companies)
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text,
  is_primary boolean DEFAULT false,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Telegram updates table
CREATE TABLE IF NOT EXISTS telegram_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  telegram_message_id bigint,
  chat_id bigint NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  classification text,
  action_items jsonb DEFAULT '[]'::jsonb,
  ai_summary text,
  voice_transcript text,
  file_url text,
  raw_update jsonb,
  created_at timestamptz DEFAULT now()
);

-- Daily syntheses table
CREATE TABLE IF NOT EXISTS daily_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  synthesis_date date NOT NULL,
  content text NOT NULL,
  summary text,
  client_highlights jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  sent_telegram boolean DEFAULT false,
  sent_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_syntheses_coach_date ON daily_syntheses(coach_id, synthesis_date);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coaches_updated_at') THEN
    CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
    CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_programs_updated_at') THEN
    CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_enrollments_updated_at') THEN
    CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_notes_updated_at') THEN
    CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
    CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Auto-create coach on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.coaches (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- RLS policies
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_syntheses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "coaches_own" ON coaches;
  DROP POLICY IF EXISTS "clients_own_coach" ON clients;
  DROP POLICY IF EXISTS "programs_own_coach" ON programs;
  DROP POLICY IF EXISTS "enrollments_own_coach" ON enrollments;
  DROP POLICY IF EXISTS "messages_own_coach" ON messages;
  DROP POLICY IF EXISTS "resources_own_coach" ON resources;
  DROP POLICY IF EXISTS "reflections_own_coach" ON reflections;
  DROP POLICY IF EXISTS "reflections_insert_anon" ON reflections;
  DROP POLICY IF EXISTS "session_notes_own_coach" ON session_notes;
  DROP POLICY IF EXISTS "tasks_own_coach" ON tasks;
  DROP POLICY IF EXISTS "contacts_own_coach" ON contacts;
  DROP POLICY IF EXISTS "telegram_updates_own_coach" ON telegram_updates;
  DROP POLICY IF EXISTS "daily_syntheses_own_coach" ON daily_syntheses;
END $$;

CREATE POLICY "coaches_own" ON coaches FOR ALL USING (auth.uid() = id);
CREATE POLICY "clients_own_coach" ON clients FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "programs_own_coach" ON programs FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "enrollments_own_coach" ON enrollments FOR ALL USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "messages_own_coach" ON messages FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "resources_own_coach" ON resources FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "reflections_own_coach" ON reflections FOR ALL USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "reflections_insert_anon" ON reflections FOR INSERT WITH CHECK (true);
CREATE POLICY "session_notes_own_coach" ON session_notes FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "tasks_own_coach" ON tasks FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "contacts_own_coach" ON contacts FOR ALL USING (client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid()));
CREATE POLICY "telegram_updates_own_coach" ON telegram_updates FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "daily_syntheses_own_coach" ON daily_syntheses FOR ALL USING (auth.uid() = coach_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false) ON CONFLICT (id) DO NOTHING;

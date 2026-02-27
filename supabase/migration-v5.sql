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

DROP POLICY IF EXISTS "coach_message_snippets_own" ON coach_message_snippets;
CREATE POLICY "coach_message_snippets_own" ON coach_message_snippets
  FOR ALL USING (auth.uid() = coach_id);

-- Trigger to keep updated_at in sync (assumes update_updated_at_column exists from earlier migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_coach_message_snippets_updated_at') THEN
    CREATE TRIGGER update_coach_message_snippets_updated_at
      BEFORE UPDATE ON coach_message_snippets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

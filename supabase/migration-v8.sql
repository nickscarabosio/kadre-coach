-- Multi-coach: coach roles and client visibility

-- Coach role: Owner, Admin, Coach
DO $$ BEGIN
  CREATE TYPE coach_role AS ENUM ('owner', 'admin', 'coach');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'coach';

-- Client visibility: shared (all coaches) vs private (only assigned)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private';

-- Junction: which coaches are assigned to which clients (replaces single coach_id for multi-coach)
CREATE TABLE IF NOT EXISTS client_coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, coach_id)
);

CREATE INDEX IF NOT EXISTS idx_client_coaches_client_id ON client_coaches(client_id);
CREATE INDEX IF NOT EXISTS idx_client_coaches_coach_id ON client_coaches(coach_id);

-- Migrate existing client.coach_id to client_coaches (one row per client, is_lead true)
INSERT INTO client_coaches (client_id, coach_id, is_lead)
  SELECT id, coach_id, true FROM clients WHERE coach_id IS NOT NULL
  ON CONFLICT (client_id, coach_id) DO NOTHING;

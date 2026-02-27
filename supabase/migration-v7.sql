-- Forms: type for Check-in Template, Intake, Session/Consultation
ALTER TABLE forms
  ADD COLUMN IF NOT EXISTS form_type text;

COMMENT ON COLUMN forms.form_type IS 'check_in | intake | session | general';

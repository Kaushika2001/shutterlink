-- Add 'rejected' to booking_status_enum (provider decline)

DO $$ BEGIN
  ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'rejected';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

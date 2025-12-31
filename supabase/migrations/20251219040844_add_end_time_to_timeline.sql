/*
  # Add end_time to event_timeline

  1. Changes
    - Add `end_time` column to `event_timeline` table to support event duration
    - Add `location` column to store event location/venue information
    - Add `color` column to allow custom colors for different timeline events
    
  2. Notes
    - This enables Apple Calendar-style timeline views with events spanning time ranges
    - Color field allows visual categorization of different event types
    - Location helps provide context for each timeline item
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_timeline' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE event_timeline ADD COLUMN end_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_timeline' AND column_name = 'location'
  ) THEN
    ALTER TABLE event_timeline ADD COLUMN location text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_timeline' AND column_name = 'color'
  ) THEN
    ALTER TABLE event_timeline ADD COLUMN color text DEFAULT '#8B5CF6';
  END IF;
END $$;

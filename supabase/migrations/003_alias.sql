-- Add alias column to group_members table
-- Each user can have a different display name per group

ALTER TABLE group_members
  ADD COLUMN alias text NOT NULL DEFAULT 'Spieler'
  CHECK (char_length(alias) BETWEEN 2 AND 30);

ALTER TABLE group_members
  ALTER COLUMN alias DROP DEFAULT;

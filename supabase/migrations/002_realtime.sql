-- Realtime für die results-Tabelle aktivieren
-- Im Supabase Dashboard: Database → Replication → Supabase Realtime → results einschalten
-- ODER via SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE results;
ALTER PUBLICATION supabase_realtime ADD TABLE ko_resolutions;

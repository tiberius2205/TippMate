-- TippMate WM 2026 — Initiales Schema

-- Nutzer (UUID in LocalStorage, kein echtes Auth)
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname    text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 30),
  created_at  timestamptz DEFAULT now()
);

-- Tipprunden
CREATE TABLE IF NOT EXISTS groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL CHECK (char_length(code) = 6),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

-- Mitglieder einer Tipprunde
CREATE TABLE IF NOT EXISTS group_members (
  group_id    uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at   timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Spieltipps
CREATE TABLE IF NOT EXISTS tips (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id              text NOT NULL,
  home_score            int NOT NULL CHECK (home_score >= 0),
  away_score            int NOT NULL CHECK (away_score >= 0),
  knockout_winner_code  text,
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (user_id, match_id)
);

-- Bonusfragen-Tipps
CREATE TABLE IF NOT EXISTS bonus_tips (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bonus_id    text NOT NULL,
  answer      text NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, bonus_id)
);

-- Spielergebnisse (vom Admin eingetragen)
CREATE TABLE IF NOT EXISTS results (
  match_id      text PRIMARY KEY,
  home_90       int NOT NULL CHECK (home_90 >= 0),
  away_90       int NOT NULL CHECK (away_90 >= 0),
  home_final    int CHECK (home_final >= 0),
  away_final    int CHECK (away_final >= 0),
  winner_code   text,
  finalized_at  timestamptz DEFAULT now()
);

-- Manuelle KO-Paarungsauflösungen (Admin)
CREATE TABLE IF NOT EXISTS ko_resolutions (
  match_id      text PRIMARY KEY,
  home_code     text NOT NULL,
  away_code     text NOT NULL,
  resolved_at   timestamptz DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_tips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ko_resolutions ENABLE ROW LEVEL SECURITY;

-- users: jeder kann lesen, eigene Zeile anlegen/updaten
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);

-- groups: jeder kann lesen und anlegen
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);

-- group_members: jeder kann lesen und beitreten
CREATE POLICY "gm_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "gm_insert" ON group_members FOR INSERT WITH CHECK (true);

-- tips: jeder kann lesen, eigene Tipps schreiben
CREATE POLICY "tips_select" ON tips FOR SELECT USING (true);
CREATE POLICY "tips_insert" ON tips FOR INSERT WITH CHECK (true);
CREATE POLICY "tips_update" ON tips FOR UPDATE USING (true);

-- bonus_tips: jeder kann lesen, eigene Tipps schreiben
CREATE POLICY "bonus_tips_select" ON bonus_tips FOR SELECT USING (true);
CREATE POLICY "bonus_tips_insert" ON bonus_tips FOR INSERT WITH CHECK (true);
CREATE POLICY "bonus_tips_update" ON bonus_tips FOR UPDATE USING (true);

-- results: alle können lesen, kein direkter Schreibzugriff (nur via Service Role)
CREATE POLICY "results_select" ON results FOR SELECT USING (true);

-- ko_resolutions: alle können lesen, kein direkter Schreibzugriff
CREATE POLICY "ko_res_select" ON ko_resolutions FOR SELECT USING (true);

-- ─── Indizes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS tips_user_id_idx      ON tips (user_id);
CREATE INDEX IF NOT EXISTS tips_match_id_idx     ON tips (match_id);
CREATE INDEX IF NOT EXISTS bonus_tips_user_idx   ON bonus_tips (user_id);
CREATE INDEX IF NOT EXISTS gm_group_id_idx       ON group_members (group_id);
CREATE INDEX IF NOT EXISTS gm_user_id_idx        ON group_members (user_id);

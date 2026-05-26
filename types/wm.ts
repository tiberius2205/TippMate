// ─── Statische Turnierdaten (aus wc2026_data.json) ─────────────────────────

export type Confederation =
  | "UEFA"
  | "CONMEBOL"
  | "CONCACAF"
  | "CAF"
  | "AFC"
  | "OFC";

export type Group = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export type Stage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  host_countries: string[];
  team_count: number;
  group_count: number;
  match_count: number;
}

export interface Team {
  code: string;       // FIFA-Kürzel, primärer Identifier
  name: string;       // Anzeigename
  name_normalised: string;
  flag: string;
  group: Group;
  continent: string;
  confederation: Confederation;
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;    // ISO-2
  capacity: number;
  timezone_offset: string;
}

export interface TeamRef {
  code: string | null;        // null wenn noch nicht aufgelöst
  placeholder: string | null; // z.B. "1A", "2B", "3A/B/C", "W101", "L101"
}

export interface MatchResult {
  home_90: number;
  away_90: number;
  home_final: number | null;
  away_final: number | null;
  winner_code: string | null; // null bei Unentschieden in Gruppenphase
}

export interface Match {
  id: string;             // "m_001"
  match_number: number;   // 1–104
  stage: Stage;
  group: Group | null;
  matchday: number | null;
  kickoff_local: string;
  kickoff_utc: string;    // maßgeblicher Wert für Deadline-Logik
  kickoff_berlin: string;
  stadium_id: string;
  home: TeamRef;
  away: TeamRef;
  result: MatchResult | null;
}

export type BonusQuestionType = "team" | "player";

export interface BonusQuestion {
  id: string;
  label: string;
  type: BonusQuestionType;
  points: number;
  deadline: string; // ISO-UTC
}

export interface WC2026Data {
  tournament: Tournament;
  scoring: {
    system: string;
    rules: {
      exact_result: number;
      correct_goal_difference: number;
      correct_tendency: number;
      wrong: number;
      knockout_winner_bonus: number;
      comment: string;
    };
  };
  teams: Team[];
  stadiums: Stadium[];
  matches: Match[];
  bonus_questions: BonusQuestion[];
}

// ─── Supabase-Datenbank-Typen ────────────────────────────────────────────────

export interface DbUser {
  id: string;
  nickname: string;
  created_at: string;
}

export interface DbGroup {
  id: string;
  code: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface DbGroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbTip {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  knockout_winner_code: string | null;
  updated_at: string;
}

export interface DbBonusTip {
  user_id: string;
  bonus_id: string;
  answer: string;
  updated_at: string;
}

export interface DbResult {
  match_id: string;
  home_90: number;
  away_90: number;
  home_final: number | null;
  away_final: number | null;
  winner_code: string | null;
  finalized_at: string;
}

export interface DbKoResolution {
  match_id: string;
  home_code: string;
  away_code: string;
  resolved_at: string;
}

// ─── Berechnete / UI-Typen ───────────────────────────────────────────────────

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number;
}

export interface Rangliste {
  user_id: string;
  nickname: string;
  total_points: number;
  exact_results: number;
  correct_tendencies: number;
  rank: number;
}

export interface TippWithPoints extends DbTip {
  points: number | null; // null wenn Spiel noch nicht beendet
}

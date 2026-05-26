import { createClient } from "@/lib/supabase/server";
import { resolveMatch } from "@/lib/placeholder";
import type { Match, DbResult, DbKoResolution } from "@/types/wm";

export interface ResolvedTeams {
  homeCode: string | null;
  awayCode: string | null;
  isResolved: boolean;
}

export async function getResolvedTeams(match: Match): Promise<ResolvedTeams> {
  // Gruppenphase: Teams immer bekannt
  if (match.home.code && match.away.code) {
    return { homeCode: match.home.code, awayCode: match.away.code, isResolved: true };
  }

  const supabase = await createClient();
  const [{ data: results }, { data: koRes }] = await Promise.all([
    supabase.from("results").select("*"),
    supabase.from("ko_resolutions").select("*"),
  ]);

  const resultsMap = new Map<string, DbResult>(
    (results ?? []).map((r) => [r.match_id, r])
  );
  const koResMap = new Map<string, DbKoResolution>(
    (koRes ?? []).map((r) => [r.match_id, r])
  );

  const resolved = resolveMatch(match.id, match.home.placeholder, match.away.placeholder, {
    results: resultsMap,
    koResolutions: koResMap,
  });

  return {
    homeCode: resolved.home,
    awayCode: resolved.away,
    isResolved: resolved.home !== null && resolved.away !== null,
  };
}

export async function getAllResults(): Promise<Map<string, DbResult>> {
  const supabase = await createClient();
  const { data } = await supabase.from("results").select("*");
  return new Map((data ?? []).map((r) => [r.match_id, r]));
}

export async function getMatchTips(matchId: string, groupId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (!members?.length) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: tips } = await supabase
    .from("tips")
    .select("home_score, away_score, knockout_winner_code")
    .eq("match_id", matchId)
    .in("user_id", userIds);
  return tips ?? [];
}

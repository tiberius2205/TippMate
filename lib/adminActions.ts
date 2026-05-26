"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveResult({
  matchId,
  home90,
  away90,
  homeFinal,
  awayFinal,
  winnerCode,
}: {
  matchId: string;
  home90: number;
  away90: number;
  homeFinal: number | null;
  awayFinal: number | null;
  winnerCode: string | null;
}): Promise<{ success: true } | { error: string }> {
  if (isNaN(home90) || isNaN(away90)) return { error: "Ungültige Werte." };

  const supabase = await createClient();
  const { error } = await supabase.from("results").upsert(
    {
      match_id: matchId,
      home_90: home90,
      away_90: away90,
      home_final: homeFinal,
      away_final: awayFinal,
      winner_code: winnerCode,
      finalized_at: new Date().toISOString(),
    },
    { onConflict: "match_id" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function saveKoResolution({
  matchId,
  homeCode,
  awayCode,
}: {
  matchId: string;
  homeCode: string;
  awayCode: string;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("ko_resolutions").upsert(
    {
      match_id: matchId,
      home_code: homeCode,
      away_code: awayCode,
      resolved_at: new Date().toISOString(),
    },
    { onConflict: "match_id" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

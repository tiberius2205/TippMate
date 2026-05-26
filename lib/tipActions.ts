"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveTip({
  userId,
  matchId,
  homeScore,
  awayScore,
  knockoutWinnerCode,
}: {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  knockoutWinnerCode: string | null;
}): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("tips").upsert(
    {
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      knockout_winner_code: knockoutWinnerCode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function getTip(userId: string, matchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tips")
    .select("*")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .single();
  return data;
}

export async function saveBonusTip(
  userId: string,
  bonusId: string,
  answer: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bonus_tips").upsert(
    { user_id: userId, bonus_id: bonusId, answer, updated_at: new Date().toISOString() },
    { onConflict: "user_id,bonus_id" }
  );
  if (error) return { error: error.message };
  return { success: true };
}

export async function getBonusTips(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bonus_tips").select("*").eq("user_id", userId);
  return data ?? [];
}

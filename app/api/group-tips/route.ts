import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const matchId = searchParams.get("matchId");
  const groupId = searchParams.get("groupId");

  if (!matchId || !groupId) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (!members?.length) return NextResponse.json([]);

  const userIds = members.map((m) => m.user_id);
  const { data: tips } = await supabase
    .from("tips")
    .select("home_score, away_score")
    .eq("match_id", matchId)
    .in("user_id", userIds);

  return NextResponse.json(tips ?? []);
}

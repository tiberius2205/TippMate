import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { matches } from "@/lib/data";
import { calcPoints } from "@/lib/scoring";
import type { DbResult, DbTip, Stage } from "@/types/wm";
import RealtimeRefresher from "@/components/RealtimeRefresher";

interface Props {
  params: Promise<{ code: string }>;
}

const stageByMatchId = new Map(matches.map((m) => [m.id, m.stage as Stage]));

export default async function TabellePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  // Gruppe laden
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("code", code.toUpperCase())
    .single();

  if (!group) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <Link href="/" className="text-gray-400 hover:text-white text-sm">← Startseite</Link>
        <p className="text-red-400 mt-4">Tipprunde nicht gefunden.</p>
      </main>
    );
  }

  // Mitglieder
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id, alias")
    .eq("group_id", group.id);

  if (!members || members.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-4 py-6">
        <Link href={`/runde/${code}`} className="text-gray-400 hover:text-white text-sm">← Zurück</Link>
        <p className="text-gray-400 mt-4">Noch keine Mitglieder.</p>
      </main>
    );
  }

  const userIds = members.map((m) => m.user_id);

  // Alle Tipps der Mitglieder
  const { data: allTips } = await supabase
    .from("tips")
    .select("*")
    .in("user_id", userIds);

  // Alle vorhandenen Ergebnisse
  const { data: allResults } = await supabase.from("results").select("*");

  const resultsMap = new Map<string, DbResult>(
    (allResults ?? []).map((r) => [r.match_id, r])
  );

  // Punkte berechnen
  const rangliste = members
    .map((member) => {
      const memberTips = ((allTips ?? []) as DbTip[]).filter(
        (t) => t.user_id === member.user_id
      );
      let total = 0;
      let exact = 0;

      for (const tip of memberTips) {
        const result = resultsMap.get(tip.match_id);
        const stage = stageByMatchId.get(tip.match_id);
        if (result && stage) {
          const pts = calcPoints(tip, result, stage);
          total += pts;
          if (pts === 4) exact++;
        }
      }

      return {
        user_id: member.user_id,
        nickname: (member as unknown as { alias: string }).alias ?? "?",
        total_points: total,
        exact_results: exact,
        tipped_count: memberTips.length,
      };
    })
    .sort((a, b) => b.total_points - a.total_points || b.exact_results - a.exact_results);

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <RealtimeRefresher />
      <div className="flex items-center gap-3">
        <Link href={`/runde/${code}`} className="text-gray-400 hover:text-white text-sm">
          ← Zurück
        </Link>
        <h1 className="text-xl font-bold">Rangliste</h1>
      </div>

      <p className="text-sm text-gray-400">{group.name}</p>

      <div className="space-y-2">
        {rangliste.map((row, i) => (
          <div
            key={row.user_id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${i === 0 ? "bg-yellow-900/40 border border-yellow-700" : "bg-gray-800"}`}
          >
            <span className={`text-xl font-bold w-8 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-500"}`}>
              {i + 1}.
            </span>
            <div className="flex-1">
              <p className="font-semibold">{row.nickname}</p>
              <p className="text-xs text-gray-500">
                {row.tipped_count} Tipps · {row.exact_results}× exakt
              </p>
            </div>
            <span className="text-xl font-bold text-blue-400">
              {row.total_points}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 text-center">
        Aktualisiert sich nach jedem eingetragenen Spielergebnis.
      </p>
    </main>
  );
}

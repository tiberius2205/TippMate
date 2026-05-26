import Link from "next/link";
import { matches, teamByCode, stadiumById, allGroups } from "@/lib/data";
import type { Stage } from "@/types/wm";

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ phase?: string; gruppe?: string }>;
}

const STAGE_LABELS: Record<Stage, string> = {
  group: "Gruppenphase",
  round_of_32: "Achtelfinale (32)",
  round_of_16: "Achtelfinale",
  quarter_final: "Viertelfinale",
  semi_final: "Halbfinale",
  third_place: "Spiel um Platz 3",
  final: "Finale",
};

function formatKickoff(utc: string): string {
  const d = new Date(utc);
  return d.toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }) + " Uhr";
}

function getTeamLabel(code: string | null, placeholder: string | null): string {
  if (code) {
    const t = teamByCode.get(code);
    return t ? `${t.flag} ${t.name}` : code;
  }
  return placeholder ? `[${placeholder}]` : "?";
}

export default async function SpielePage({ params, searchParams }: Props) {
  const { code } = await params;
  const { phase, gruppe } = await searchParams;

  const filtered = matches.filter((m) => {
    if (phase && m.stage !== phase) return false;
    if (gruppe && m.group !== gruppe) return false;
    return true;
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/runde/${code}`} className="text-gray-400 hover:text-white text-sm">
          ← Zurück
        </Link>
        <h1 className="text-xl font-bold">Spiele</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/runde/${code}/spiele`}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${!phase && !gruppe ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          Alle
        </Link>
        <Link
          href={`/runde/${code}/spiele?phase=group`}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${phase === "group" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          Gruppe
        </Link>
        <Link
          href={`/runde/${code}/spiele?phase=round_of_32`}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${phase === "round_of_32" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          Round of 32
        </Link>
        <Link
          href={`/runde/${code}/spiele?phase=round_of_16`}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${phase === "round_of_16" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          Achtelfinale
        </Link>
        <Link
          href={`/runde/${code}/spiele?phase=quarter_final`}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${phase === "quarter_final" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
        >
          Viertelfinale
        </Link>
      </div>

      {/* Gruppe-Filter */}
      {(!phase || phase === "group") && (
        <div className="flex gap-1.5 flex-wrap">
          {allGroups.map((g) => (
            <Link
              key={g}
              href={`/runde/${code}/spiele?phase=group&gruppe=${g}`}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-mono font-bold transition-colors ${gruppe === g ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              {g}
            </Link>
          ))}
        </div>
      )}

      {/* Spielliste */}
      <div className="space-y-2">
        {filtered.map((match) => {
          const stadium = stadiumById.get(match.stadium_id);
          const homeLabel = getTeamLabel(match.home.code, match.home.placeholder);
          const awayLabel = getTeamLabel(match.away.code, match.away.placeholder);
          const isResolved = match.home.code !== null && match.away.code !== null;

          return (
            <Link
              key={match.id}
              href={`/runde/${code}/match/${match.id}`}
              className="block bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {STAGE_LABELS[match.stage]}
                  {match.group ? ` · Gruppe ${match.group}` : ""}
                  {match.matchday ? ` · Spieltag ${match.matchday}` : ""}
                </span>
                {!isResolved && (
                  <span className="text-xs text-yellow-500">Paarung offen</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium flex-1">{homeLabel}</span>
                <span className="text-gray-500 text-sm font-mono">vs</span>
                <span className="text-sm font-medium flex-1 text-right">{awayLabel}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formatKickoff(match.kickoff_utc)}
                {stadium ? ` · ${stadium.city}` : ""}
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-8">Keine Spiele gefunden.</p>
        )}
      </div>
    </main>
  );
}

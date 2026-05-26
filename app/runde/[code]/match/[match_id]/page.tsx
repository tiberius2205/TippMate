import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatch, teamByCode, stadiumById } from "@/lib/data";
import { getResolvedTeams } from "@/lib/matchResolver";
import { createClient } from "@/lib/supabase/server";
import MatchTippClient from "@/components/MatchTippClient";
import GroupStandingsTable from "@/components/GroupStandingsTable";
import TippVerteilung from "@/components/TippVerteilung";
import type { Group } from "@/types/wm";

interface Props {
  params: Promise<{ code: string; match_id: string }>;
}

const STAGE_LABELS: Record<string, string> = {
  group: "Gruppenphase",
  round_of_32: "Round of 32",
  round_of_16: "Achtelfinale",
  quarter_final: "Viertelfinale",
  semi_final: "Halbfinale",
  third_place: "Spiel um Platz 3",
  final: "Finale",
};

function formatKickoff(utc: string): string {
  return new Date(utc).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " Uhr MEZ";
}

export default async function MatchPage({ params }: Props) {
  const { code, match_id } = await params;
  const match = getMatch(match_id);
  if (!match) notFound();

  // Gruppe laden (für groupId bei TippVerteilung)
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("code", code.toUpperCase())
    .single();

  // KO-Teams aus DB auflösen
  const { homeCode, awayCode, isResolved } = await getResolvedTeams(match);

  const stadium = stadiumById.get(match.stadium_id);
  const homeTeam = homeCode ? teamByCode.get(homeCode) : null;
  const awayTeam = awayCode ? teamByCode.get(awayCode) : null;

  const homeDisplay = homeTeam
    ? { flag: homeTeam.flag, name: homeTeam.name, confederation: homeTeam.confederation }
    : { flag: "❓", name: match.home.placeholder ?? "?", confederation: null };
  const awayDisplay = awayTeam
    ? { flag: awayTeam.flag, name: awayTeam.name, confederation: awayTeam.confederation }
    : { flag: "❓", name: match.away.placeholder ?? "?", confederation: null };

  // Ergebnis aus DB laden (Realtime kommt später)
  const { data: result } = await supabase
    .from("results")
    .select("*")
    .eq("match_id", match.id)
    .single();

  const hasResult = result !== null;

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href={`/runde/${code}/spiele`} className="text-gray-400 hover:text-white">
          ← Spiele
        </Link>
        <span className="text-gray-700">·</span>
        <span className="text-gray-500">
          {STAGE_LABELS[match.stage]}
          {match.group ? ` Gruppe ${match.group}` : ""}
        </span>
      </div>

      {/* Match Header */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-around gap-4">
          <div className="text-center flex-1 min-w-0">
            <div className="text-4xl mb-2">{homeDisplay.flag}</div>
            <div className="font-semibold text-sm leading-tight">{homeDisplay.name}</div>
          </div>
          <div className="text-center shrink-0">
            {hasResult ? (
              <div>
                <div className="text-3xl font-bold font-mono tabular-nums">
                  {result.home_90}:{result.away_90}
                </div>
                {result.home_final !== null && result.home_final !== result.home_90 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {result.home_final}:{result.away_final} n.V./E.
                  </div>
                )}
                <div className="text-xs text-green-400 mt-1">Abgepfiffen</div>
              </div>
            ) : (
              <div className="text-gray-500 text-2xl font-mono">vs</div>
            )}
          </div>
          <div className="text-center flex-1 min-w-0">
            <div className="text-4xl mb-2">{awayDisplay.flag}</div>
            <div className="font-semibold text-sm leading-tight">{awayDisplay.name}</div>
          </div>
        </div>
      </div>

      {/* Tipp-Formular */}
      {isResolved ? (
        <MatchTippClient
          matchId={match.id}
          groupCode={code}
          deadline={match.kickoff_utc}
          stage={match.stage}
          homeCode={homeCode!}
          awayCode={awayCode!}
          homeName={homeDisplay.name}
          awayName={awayDisplay.name}
          hasResult={hasResult}
        />
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-center">
          <p className="text-yellow-400 font-medium">Paarung noch nicht bekannt</p>
          <p className="text-gray-500 text-xs mt-2">
            Tippen wird freigeschaltet sobald beide Teams feststehen.
          </p>
        </div>
      )}

      {/* Tipp-Verteilung der Runde */}
      {isResolved && group && (
        <TippVerteilung
          matchId={match.id}
          groupId={group.id}
          homeName={homeDisplay.name}
          awayName={awayDisplay.name}
        />
      )}

      {/* Daten-Tab */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Spielinfos</h2>

        {/* Stadion + Zeit */}
        <div className="bg-gray-900 rounded-xl p-4 text-sm space-y-2">
          <InfoRow label="Anstoß" value={formatKickoff(match.kickoff_utc)} />
          {stadium && (
            <>
              <InfoRow label="Stadion" value={stadium.name} />
              <InfoRow label="Stadt" value={stadium.city} />
              <InfoRow label="Kapazität" value={stadium.capacity.toLocaleString("de-DE")} />
              <InfoRow label="Zeitzone" value={stadium.timezone_offset} />
            </>
          )}
          {homeDisplay.confederation && awayDisplay.confederation && (
            <InfoRow
              label="Konföderationen"
              value={`${homeDisplay.confederation} · ${awayDisplay.confederation}`}
            />
          )}
        </div>

        {/* Gruppenтabelle */}
        {match.group && (
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Gruppe {match.group}
            </p>
            <GroupStandingsTable
              group={match.group as Group}
              highlightCode={homeCode ?? undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

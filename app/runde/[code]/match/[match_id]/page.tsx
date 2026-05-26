import { notFound } from "next/navigation";
import Link from "next/link";
import { getMatch, teamByCode, stadiumById } from "@/lib/data";
import MatchTippClient from "@/components/MatchTippClient";

interface Props {
  params: Promise<{ code: string; match_id: string }>;
}

function formatKickoff(utc: string): string {
  const d = new Date(utc);
  return d.toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " Uhr MEZ";
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

export default async function MatchPage({ params }: Props) {
  const { code, match_id } = await params;
  const match = getMatch(match_id);
  if (!match) notFound();

  const stadium = stadiumById.get(match.stadium_id);
  const homeTeam = match.home.code ? teamByCode.get(match.home.code) : null;
  const awayTeam = match.away.code ? teamByCode.get(match.away.code) : null;
  const isResolved = match.home.code !== null && match.away.code !== null;

  const homeDisplay = homeTeam
    ? { flag: homeTeam.flag, name: homeTeam.name, code: homeTeam.code }
    : { flag: "❓", name: match.home.placeholder ?? "?", code: null };
  const awayDisplay = awayTeam
    ? { flag: awayTeam.flag, name: awayTeam.name, code: awayTeam.code }
    : { flag: "❓", name: match.away.placeholder ?? "?", code: null };

  const deadline = new Date(match.kickoff_utc);

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/runde/${code}/spiele`} className="text-gray-400 hover:text-white text-sm">
          ← Spiele
        </Link>
        <span className="text-gray-500 text-sm">
          {STAGE_LABELS[match.stage]}
          {match.group ? ` · Gruppe ${match.group}` : ""}
        </span>
      </div>

      {/* Match Header */}
      <div className="bg-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-around gap-4">
          <div className="text-center flex-1">
            <div className="text-4xl mb-2">{homeDisplay.flag}</div>
            <div className="font-semibold text-sm">{homeDisplay.name}</div>
          </div>
          <div className="text-center">
            {match.result ? (
              <div>
                <div className="text-3xl font-bold font-mono">
                  {match.result.home_90}:{match.result.away_90}
                </div>
                {match.result.home_final !== null && match.result.home_final !== match.result.home_90 && (
                  <div className="text-xs text-gray-400 mt-1">
                    ({match.result.home_final}:{match.result.away_final} n.V./E.)
                  </div>
                )}
                <div className="text-xs text-green-400 mt-1">Abgepfiffen</div>
              </div>
            ) : (
              <div className="text-gray-500 text-2xl font-mono">vs</div>
            )}
          </div>
          <div className="text-center flex-1">
            <div className="text-4xl mb-2">{awayDisplay.flag}</div>
            <div className="font-semibold text-sm">{awayDisplay.name}</div>
          </div>
        </div>
      </div>

      {/* Stadion + Zeit */}
      <div className="bg-gray-900 rounded-xl p-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Anstoß</span>
          <span>{formatKickoff(match.kickoff_utc)}</span>
        </div>
        {stadium && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Stadion</span>
              <span>{stadium.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stadt</span>
              <span>{stadium.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Kapazität</span>
              <span>{stadium.capacity.toLocaleString("de-DE")}</span>
            </div>
          </>
        )}
        {homeTeam && awayTeam && (
          <div className="flex justify-between pt-1 border-t border-gray-800">
            <span className="text-gray-400">Konföderationen</span>
            <span>{homeTeam.confederation} · {awayTeam.confederation}</span>
          </div>
        )}
      </div>

      {/* Tipp-Formular */}
      {isResolved ? (
        <MatchTippClient
          matchId={match.id}
          groupCode={code}
          deadline={deadline.toISOString()}
          stage={match.stage}
          homeCode={match.home.code!}
          awayCode={match.away.code!}
          homeName={homeDisplay.name}
          awayName={awayDisplay.name}
          hasResult={match.result !== null}
        />
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 text-center">
          <p className="text-yellow-400 font-medium">Paarung noch nicht bekannt</p>
          <p className="text-yellow-600 text-sm mt-1">
            {match.home.placeholder
              ? `Heimteam: ${match.home.placeholder}`
              : ""}
            {match.away.placeholder
              ? ` · Auswärtsteam: ${match.away.placeholder}`
              : ""}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Tippen wird freigeschaltet sobald beide Teams feststehen.
          </p>
        </div>
      )}
    </main>
  );
}

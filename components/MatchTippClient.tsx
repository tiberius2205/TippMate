"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId } from "@/lib/user";
import { saveTip, getTip } from "@/lib/tipActions";
import type { Stage } from "@/types/wm";

interface Props {
  matchId: string;
  groupCode: string;
  deadline: string;
  stage: Stage;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  hasResult: boolean;
}

const isKnockout = (stage: Stage) => stage !== "group";

export default function MatchTippClient({
  matchId,
  groupCode,
  deadline,
  stage,
  homeCode,
  awayCode,
  homeName,
  awayName,
  hasResult,
}: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>("");
  const [awayScore, setAwayScore] = useState<string>("");
  const [winnerCode, setWinnerCode] = useState<string>("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasTip, setHasTip] = useState(false);

  const isPast = new Date() >= new Date(deadline);
  const ko = isKnockout(stage);

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) {
      router.push("/");
      return;
    }
    setUserId(id);

    // Vorhandenen Tipp laden
    getTip(id, matchId).then((tip) => {
      if (tip) {
        setHomeScore(String(tip.home_score));
        setAwayScore(String(tip.away_score));
        setWinnerCode(tip.knockout_winner_code ?? "");
        setHasTip(true);
      }
    });
  }, [matchId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const hs = parseInt(homeScore);
    const as_ = parseInt(awayScore);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      setError("Bitte gültige Ergebnisse eingeben.");
      return;
    }
    if (ko && !winnerCode) {
      setError("Bitte wähle den Sieger (Weiterkommender).");
      return;
    }

    setLoading(true);
    setError("");
    const result = await saveTip({
      userId,
      matchId,
      homeScore: hs,
      awayScore: as_,
      knockoutWinnerCode: ko ? winnerCode : null,
    });
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setHasTip(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  }

  if (!userId) return null;

  if (hasResult) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 text-center">
        <p className="text-gray-400 text-sm">Spiel ist abgepfiffen.</p>
        {hasTip ? (
          <p className="text-green-400 text-sm mt-1">Dein Tipp wurde gewertet.</p>
        ) : (
          <p className="text-red-400 text-sm mt-1">Kein Tipp abgegeben.</p>
        )}
      </div>
    );
  }

  if (isPast) {
    return (
      <div className="bg-gray-900 rounded-xl p-4 text-center">
        <p className="text-yellow-400 font-medium">Tippabgabe geschlossen</p>
        {hasTip ? (
          <p className="text-gray-400 text-sm mt-1">Dein Tipp wurde gespeichert.</p>
        ) : (
          <p className="text-red-400 text-sm mt-1">Kein Tipp abgegeben.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold">Dein Tipp</h2>

      {/* Ergebnis-Eingabe */}
      <div className="flex items-center gap-3 justify-center">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1 truncate max-w-[80px]">{homeName}</div>
          <input
            type="number"
            min={0}
            max={99}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            className="w-16 h-16 text-center text-2xl font-bold bg-gray-700 border-2 border-gray-600 focus:border-blue-500 rounded-xl text-white focus:outline-none"
            placeholder="–"
          />
        </div>
        <div className="text-gray-500 text-xl font-mono pb-5">:</div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1 truncate max-w-[80px]">{awayName}</div>
          <input
            type="number"
            min={0}
            max={99}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            className="w-16 h-16 text-center text-2xl font-bold bg-gray-700 border-2 border-gray-600 focus:border-blue-500 rounded-xl text-white focus:outline-none"
            placeholder="–"
          />
        </div>
      </div>

      {/* K.O.-Weiterkommender */}
      {ko && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Weiterkommender (nach Verl./Elfm.):</p>
          <div className="grid grid-cols-2 gap-2">
            {[homeCode, awayCode].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setWinnerCode(code)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                  winnerCode === code
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {code === homeCode ? homeName : awayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? "Wird gespeichert…" : saved ? "✓ Gespeichert!" : hasTip ? "Tipp aktualisieren" : "Tipp abgeben"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Deadline: {new Date(deadline).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr
      </p>
    </form>
  );
}

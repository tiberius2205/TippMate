"use client";

import { useState } from "react";
import type { Match, Team, DbResult, DbKoResolution } from "@/types/wm";
import { saveResult, saveKoResolution } from "@/lib/adminActions";

interface Props {
  koMatches: Match[];
  allMatches: Match[];
  teams: Team[];
  existingResults: DbResult[];
  existingKoResolutions: DbKoResolution[];
}

export default function AdminClient({
  koMatches,
  allMatches,
  teams,
  existingResults,
  existingKoResolutions,
}: Props) {
  const [tab, setTab] = useState<"paarungen" | "ergebnisse">("ergebnisse");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("ergebnisse")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "ergebnisse" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}
        >
          Ergebnisse eintragen
        </button>
        <button
          onClick={() => setTab("paarungen")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "paarungen" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"}`}
        >
          KO-Paarungen setzen
        </button>
      </div>

      {tab === "ergebnisse" && (
        <ErgebnisseTab
          matches={allMatches}
          teams={teams}
          existingResults={existingResults}
        />
      )}
      {tab === "paarungen" && (
        <PaarungenTab
          koMatches={koMatches}
          teams={teams}
          existingResolutions={existingKoResolutions}
        />
      )}
    </div>
  );
}

function ErgebnisseTab({
  matches,
  teams,
  existingResults,
}: {
  matches: Match[];
  teams: Team[];
  existingResults: DbResult[];
}) {
  const [selected, setSelected] = useState<string>("");
  const [h90, setH90] = useState("");
  const [a90, setA90] = useState("");
  const [hFin, setHFin] = useState("");
  const [aFin, setAFin] = useState("");
  const [winnerCode, setWinnerCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const match = matches.find((m) => m.id === selected);
  const isKo = match && match.stage !== "group";
  const teamMap = new Map(teams.map((t) => [t.code, t]));

  const resultMap = new Map(existingResults.map((r) => [r.match_id, r]));

  async function handleSave() {
    if (!selected) return;
    const result = await saveResult({
      matchId: selected,
      home90: parseInt(h90),
      away90: parseInt(a90),
      homeFinal: hFin ? parseInt(hFin) : null,
      awayFinal: aFin ? parseInt(aFin) : null,
      winnerCode: winnerCode || null,
    });
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setError("");
    }
  }

  return (
    <div className="space-y-4">
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          const existing = resultMap.get(e.target.value);
          if (existing) {
            setH90(String(existing.home_90));
            setA90(String(existing.away_90));
            setHFin(existing.home_final !== null ? String(existing.home_final) : "");
            setAFin(existing.away_final !== null ? String(existing.away_final) : "");
            setWinnerCode(existing.winner_code ?? "");
          } else {
            setH90(""); setA90(""); setHFin(""); setAFin(""); setWinnerCode("");
          }
        }}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
      >
        <option value="">— Spiel auswählen —</option>
        {matches.map((m) => {
          const home = m.home.code ? (teamMap.get(m.home.code)?.name ?? m.home.code) : m.home.placeholder;
          const away = m.away.code ? (teamMap.get(m.away.code)?.name ?? m.away.code) : m.away.placeholder;
          const hasResult = resultMap.has(m.id);
          return (
            <option key={m.id} value={m.id}>
              {m.match_number}. {home} vs {away} {hasResult ? "✓" : ""}
            </option>
          );
        })}
      </select>

      {selected && (
        <div className="space-y-3 bg-gray-800 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Heim 90 Min</label>
              <input type="number" min={0} value={h90} onChange={(e) => setH90(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Auswärts 90 Min</label>
              <input type="number" min={0} value={a90} onChange={(e) => setA90(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
            </div>
          </div>

          {isKo && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Heim (Endstand inkl. V./E.)</label>
                  <input type="number" min={0} value={hFin} onChange={(e) => setHFin(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Auswärts (Endstand)</label>
                  <input type="number" min={0} value={aFin} onChange={(e) => setAFin(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Weiterkommender (Team-Code)</label>
                <select
                  value={winnerCode}
                  onChange={(e) => setWinnerCode(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                >
                  <option value="">— Sieger —</option>
                  {match?.home.code && <option value={match.home.code}>{match.home.code}</option>}
                  {match?.away.code && <option value={match.away.code}>{match.away.code}</option>}
                </select>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleSave}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {saved ? "✓ Gespeichert!" : "Ergebnis speichern"}
          </button>
        </div>
      )}
    </div>
  );
}

function PaarungenTab({
  koMatches,
  teams,
  existingResolutions,
}: {
  koMatches: Match[];
  teams: Team[];
  existingResolutions: DbKoResolution[];
}) {
  const [selected, setSelected] = useState<string>("");
  const [homeCode, setHomeCode] = useState("");
  const [awayCode, setAwayCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const resMap = new Map(existingResolutions.map((r) => [r.match_id, r]));

  async function handleSave() {
    if (!selected || !homeCode || !awayCode) return;
    const result = await saveKoResolution({ matchId: selected, homeCode, awayCode });
    if ("error" in result) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setError("");
    }
  }

  return (
    <div className="space-y-4">
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          const existing = resMap.get(e.target.value);
          if (existing) {
            setHomeCode(existing.home_code);
            setAwayCode(existing.away_code);
          } else {
            setHomeCode(""); setAwayCode("");
          }
        }}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
      >
        <option value="">— KO-Spiel auswählen —</option>
        {koMatches.map((m) => (
          <option key={m.id} value={m.id}>
            {m.match_number}. {m.home.placeholder ?? "?"} vs {m.away.placeholder ?? "?"} {resMap.has(m.id) ? "✓" : ""}
          </option>
        ))}
      </select>

      {selected && (
        <div className="space-y-3 bg-gray-800 rounded-xl p-4">
          {["Heimteam", "Auswärtsteam"].map((label, idx) => (
            <div key={label}>
              <label className="text-xs text-gray-400">{label}</label>
              <select
                value={idx === 0 ? homeCode : awayCode}
                onChange={(e) => idx === 0 ? setHomeCode(e.target.value) : setAwayCode(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
              >
                <option value="">— Team wählen —</option>
                {teams.map((t) => (
                  <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
                ))}
              </select>
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleSave}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {saved ? "✓ Gespeichert!" : "Paarung speichern"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getStoredUserId } from "@/lib/user";
import { getTip } from "@/lib/tipActions";

interface Props {
  matchId: string;
  groupId: string;
  homeName: string;
  awayName: string;
}

interface Tip {
  home_score: number;
  away_score: number;
}

type Tendency = "home" | "draw" | "away";

function tendency(h: number, a: number): Tendency {
  if (h > a) return "home";
  if (h < a) return "away";
  return "draw";
}

async function loadGroupTips(matchId: string, groupId: string): Promise<Tip[]> {
  const res = await fetch(`/api/group-tips?matchId=${matchId}&groupId=${groupId}`);
  if (!res.ok) return [];
  return res.json();
}

export default function TippVerteilung({ matchId, groupId, homeName, awayName }: Props) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [hasTipped, setHasTipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getStoredUserId();
    if (!userId) { setLoading(false); return; }

    Promise.all([
      getTip(userId, matchId),
      loadGroupTips(matchId, groupId),
    ]).then(([myTip, groupTips]) => {
      if (myTip) {
        setHasTipped(true);
        setTips(groupTips);
      }
      setLoading(false);
    });
  }, [matchId, groupId]);

  if (loading || !hasTipped || tips.length === 0) return null;

  const counts = { home: 0, draw: 0, away: 0 };
  for (const t of tips) counts[tendency(t.home_score, t.away_score)]++;
  const total = tips.length;
  const pct = (n: number) => Math.round((n / total) * 100);

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">Wie tippt deine Runde?</h3>
      <p className="text-xs text-gray-500">{total} Tipp{total !== 1 ? "s" : ""} abgegeben</p>
      <div className="space-y-2">
        {([["home", homeName], ["draw", "Unentschieden"], ["away", awayName]] as const).map(
          ([key, label]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-300">{counts[key]} ({pct(counts[key])}%)</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${key === "home" ? "bg-blue-500" : key === "draw" ? "bg-gray-500" : "bg-red-500"}`}
                  style={{ width: `${pct(counts[key])}%` }}
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

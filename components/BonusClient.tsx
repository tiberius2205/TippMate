"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId } from "@/lib/user";
import { saveBonusTip, getBonusTips } from "@/lib/tipActions";
import type { BonusQuestion, Team } from "@/types/wm";

interface Props {
  questions: BonusQuestion[];
  teams: Team[];
  groupCode: string;
  isOpen: boolean;
}

export default function BonusClient({ questions, teams, groupCode: _groupCode, isOpen }: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) { router.push("/"); return; }
    setUserId(id);
    getBonusTips(id).then((tips) => {
      const map: Record<string, string> = {};
      for (const t of tips) map[t.bonus_id] = t.answer;
      setAnswers(map);
    });
  }, [router]);

  async function handleSave(bonusId: string) {
    if (!userId || !answers[bonusId]) return;
    setLoading((p) => ({ ...p, [bonusId]: true }));
    const result = await saveBonusTip(userId, bonusId, answers[bonusId]);
    if (!("error" in result)) {
      setSaved((p) => ({ ...p, [bonusId]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [bonusId]: false })), 2500);
    }
    setLoading((p) => ({ ...p, [bonusId]: false }));
  }

  if (!userId) return null;

  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="bg-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{q.label}</p>
              <p className="text-xs text-blue-400 mt-0.5">+{q.points} Punkte</p>
            </div>
          </div>

          {q.type === "team" ? (
            <select
              disabled={!isOpen}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">— Team auswählen —</option>
              {teams.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              disabled={!isOpen}
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder="Name des Spielers"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          )}

          {isOpen && (
            <button
              onClick={() => handleSave(q.id)}
              disabled={!answers[q.id] || loading[q.id]}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading[q.id] ? "Wird gespeichert…" : saved[q.id] ? "✓ Gespeichert!" : "Speichern"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

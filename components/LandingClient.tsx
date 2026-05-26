"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId, setStoredUserId } from "@/lib/user";
import { createUser, createGroup, joinGroup } from "@/lib/actions";

type Step = "nickname" | "home" | "create" | "join";

export default function LandingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("nickname");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Formfelder
  const [nickname, setNickname] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const id = getStoredUserId();
    if (id) {
      setUserId(id);
      setStep("home");
    }
  }, []);

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError("Nickname muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createUser(nickname.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setStoredUserId(result.id);
      setUserId(result.id);
      setStep("home");
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (groupName.trim().length < 2) {
      setError("Name muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createGroup(groupName.trim(), userId);
    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/runde/${result.code}`);
    }
    setLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError("");
    const result = await joinGroup(joinCode.trim(), userId);
    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/runde/${joinCode.toUpperCase()}`);
    }
    setLoading(false);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold tracking-tight">TippMate</h1>
          <p className="text-gray-400 mt-1">WM 2026 Tippspiel</p>
          <p className="text-xs text-gray-600 mt-1">
            11. Juni – 19. Juli 2026 · USA, Kanada, Mexiko
          </p>
        </div>

        {/* Nickname */}
        {step === "nickname" && (
          <form onSubmit={handleNickname} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Willkommen!</h2>
            <p className="text-gray-400 text-sm text-center">
              Wähle deinen Anzeigenamen für die Tipprunde.
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Dein Nickname"
              maxLength={30}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird angelegt…" : "Los geht's"}
            </button>
          </form>
        )}

        {/* Home */}
        {step === "home" && (
          <div className="space-y-3">
            <button
              onClick={() => { setStep("create"); setError(""); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
            >
              Neue Tipprunde erstellen
            </button>
            <button
              onClick={() => { setStep("join"); setError(""); }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl transition-colors text-lg border border-gray-700"
            >
              Tipprunde beitreten
            </button>
          </div>
        )}

        {/* Create */}
        {step === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-xl font-semibold">Neue Tipprunde</h2>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Name der Runde (z.B. Büro-WM)"
              maxLength={60}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird erstellt…" : "Erstellen"}
            </button>
            <button
              type="button"
              onClick={() => setStep("home")}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm"
            >
              Zurück
            </button>
          </form>
        )}

        {/* Join */}
        {step === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <h2 className="text-xl font-semibold">Tipprunde beitreten</h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="6-stelliger Code (z.B. BVB123)"
              maxLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-widest uppercase"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird gesucht…" : "Beitreten"}
            </button>
            <button
              type="button"
              onClick={() => setStep("home")}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm"
            >
              Zurück
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

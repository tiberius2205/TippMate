"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId, setStoredUserId, clearStoredUserId } from "@/lib/user";
import {
  createUser,
  getUser,
  createGroup,
  joinGroup,
  lookupGroup,
  getMyGroups,
} from "@/lib/actions";

type Step = "nickname" | "home" | "create" | "join" | "join-confirm";

interface MyGroup {
  code: string;
  name: string;
  alias: string;
}

interface GroupPreview {
  name: string;
  memberCount: number;
}

export default function LandingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("nickname");
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [myGroups, setMyGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [nickname, setNickname] = useState("");
  const [groupName, setGroupName] = useState("");
  const [createAlias, setCreateAlias] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinAlias, setJoinAlias] = useState("");
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);

  useEffect(() => {
    const id = getStoredUserId();
    if (!id) return;
    (async () => {
      await loadHome(id);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadHome(id: string) {
    setLoading(true);
    try {
      const [user, groups] = await Promise.all([getUser(id), getMyGroups(id)]);
      if (!user) {
        clearStoredUserId();
        setStep("nickname");
        return;
      }
      setProfileName(user.nickname);
      setUserId(id);
      setMyGroups(groups ?? []);
      setStep("home");
    } catch {
      setError("Verbindungsfehler. Bitte Seite neu laden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError("Name muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createUser(nickname.trim());
      if ("error" in result) {
        setError(result.error);
        setLoading(false);
      } else {
        setStoredUserId(result.id);
        setProfileName(nickname.trim());
        await loadHome(result.id);
        // loadHome manages loading state itself
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (groupName.trim().length < 2) {
      setError("Name muss mindestens 2 Zeichen lang sein.");
      return;
    }
    if (createAlias.trim().length < 2) {
      setError("Alias muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createGroup(groupName.trim(), userId, createAlias.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/runde/${result.code}`);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await lookupGroup(joinCode.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        setGroupPreview(result);
        setStep("join-confirm");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (joinAlias.trim().length < 2) {
      setError("Alias muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await joinGroup(joinCode.trim(), userId, joinAlias.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/runde/${joinCode.toUpperCase()}`);
      }
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  function goHome() {
    setError("");
    setGroupName("");
    setCreateAlias("");
    setJoinCode("");
    setJoinAlias("");
    setGroupPreview(null);
    setStep("home");
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

        {/* Step: Nickname (Erster Besuch) */}
        {step === "nickname" && (
          <form onSubmit={handleNickname} className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Willkommen!</h2>
            <p className="text-gray-400 text-sm text-center">
              Wie heißt du? Dieser Name ist nur für dich sichtbar.
            </p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Dein Name"
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
              {loading ? "Wird angelegt…" : "Profil erstellen"}
            </button>
          </form>
        )}

        {/* Step: Home */}
        {step === "home" && (
          <div className="space-y-5">
            <div className="text-center pb-4 border-b border-gray-800">
              <p className="text-blue-400 text-sm">Hey, {profileName}!</p>
            </div>

            {myGroups.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Deine Runden</p>
                {myGroups.map((g) => (
                  <button
                    key={g.code}
                    onClick={() => router.push(`/runde/${g.code}`)}
                    className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-3 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-white">{g.name}</p>
                      <p className="text-xs text-blue-400">als {g.alias}</p>
                    </div>
                    <span className="text-gray-400 text-lg">›</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                Du bist noch in keiner Tipprunde. Erstelle eine oder tritt einer bei!
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => { setError(""); setStep("create"); }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                + Erstellen
              </button>
              <button
                onClick={() => { setError(""); setStep("join"); }}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors border border-gray-700"
              >
                Beitreten
              </button>
            </div>
          </div>
        )}

        {/* Step: Create */}
        {step === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="text-xl font-semibold">Neue Tipprunde</h2>
            <div className="space-y-1">
              <label htmlFor="groupName" className="text-xs text-gray-400">Name der Runde</label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="z.B. Büro-WM 2026"
                maxLength={60}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="createAlias" className="text-xs text-gray-400">Dein Alias in dieser Runde</label>
              <input
                id="createAlias"
                type="text"
                value={createAlias}
                onChange={(e) => setCreateAlias(e.target.value)}
                placeholder="Wie sollen dich andere sehen?"
                maxLength={30}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird erstellt…" : "Runde erstellen"}
            </button>
            <button type="button" onClick={goHome} className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm">
              Zurück
            </button>
          </form>
        )}

        {/* Step: Join (Schritt 1 — Code) */}
        {step === "join" && (
          <form onSubmit={handleJoinLookup} className="space-y-4">
            <h2 className="text-xl font-semibold">Tipprunde beitreten</h2>
            <div className="space-y-1">
              <label htmlFor="joinCode" className="text-xs text-gray-400">Einladungscode</label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="z.B. BVB123"
                maxLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-widest uppercase text-center"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || joinCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird gesucht…" : "Runde suchen →"}
            </button>
            <button type="button" onClick={goHome} className="w-full text-gray-400 hover:text-white py-2 transition-colors text-sm">
              Zurück
            </button>
          </form>
        )}

        {/* Step: Join Confirm (Schritt 2 — Alias) */}
        {step === "join-confirm" && groupPreview && (
          <form onSubmit={handleJoinConfirm} className="space-y-4">
            <h2 className="text-xl font-semibold">Tipprunde beitreten</h2>
            <div className="bg-gray-800 rounded-xl px-4 py-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gefunden</p>
              <p className="text-white font-bold text-lg">{groupPreview.name}</p>
              <p className="text-xs text-gray-500 mt-1">{groupPreview.memberCount} Mitspieler</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="joinAlias" className="text-xs text-gray-400">Dein Alias in dieser Runde</label>
              <input
                id="joinAlias"
                type="text"
                value={joinAlias}
                onChange={(e) => setJoinAlias(e.target.value)}
                placeholder="Wie sollen dich andere sehen?"
                maxLength={30}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Wird beigetreten…" : "Beitreten"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("join"); setError(""); setGroupPreview(null); }}
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

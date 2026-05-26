# Profile + Per-Gruppe-Alias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persistentes Nutzerprofil (interner Name) + pro Tipprunde ein frei wählbarer, fixer Alias.

**Architecture:** Eine neue `alias`-Spalte in `group_members` ersetzt die bisherige Nutzung von `users.nickname` in Gruppen-Kontexten. `LandingClient` wird zur zentralen Profil/Home-Seite umgebaut (5 Steps). Neue Server Actions `lookupGroup` und `getMyGroups` versorgen den neuen Flow.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (PostgreSQL + RLS), TypeScript, Tailwind CSS v4

---

## Dateiübersicht

| Datei | Aktion | Inhalt |
|---|---|---|
| `supabase/migrations/003_alias.sql` | Erstellen | `ALTER TABLE group_members ADD COLUMN alias` |
| `lib/actions.ts` | Modifizieren | `createGroup` + `joinGroup` mit alias; neue `lookupGroup`, `getMyGroups` |
| `components/LandingClient.tsx` | Komplett neu | 5-Step Flow: nickname / home / create / join / join-confirm |
| `app/runde/[code]/page.tsx` | Modifizieren | Mitgliederliste: `alias` statt `users.nickname` |
| `app/runde/[code]/tabelle/page.tsx` | Modifizieren | Rangliste: `alias` statt `users.nickname` |

---

## Task 1: DB-Migration erstellen und einspielen

**Files:**
- Create: `supabase/migrations/003_alias.sql`

- [ ] **Schritt 1: Migration-Datei erstellen**

```sql
-- supabase/migrations/003_alias.sql
ALTER TABLE group_members
  ADD COLUMN alias text NOT NULL DEFAULT ''
  CHECK (char_length(alias) BETWEEN 2 AND 30);

ALTER TABLE group_members
  ALTER COLUMN alias DROP DEFAULT;
```

> `DEFAULT ''` ist nur für den `ALTER TABLE`-Befehl nötig (bestehende Zeilen), wird danach sofort entfernt.

- [ ] **Schritt 2: Migration in Supabase einspielen**

Im [Supabase SQL Editor](https://supabase.com/dashboard/project/pjwfedtkbfcixtltnndl/sql/new) exakt diesen SQL ausführen:

```sql
ALTER TABLE group_members
  ADD COLUMN alias text NOT NULL DEFAULT ''
  CHECK (char_length(alias) BETWEEN 2 AND 30);

ALTER TABLE group_members
  ALTER COLUMN alias DROP DEFAULT;
```

Erwartetes Ergebnis: `Success. No rows returned.`

- [ ] **Schritt 3: Commit**

```bash
git add supabase/migrations/003_alias.sql
git commit -m "feat: add alias column to group_members"
```

---

## Task 2: Server Actions aktualisieren (`lib/actions.ts`)

**Files:**
- Modify: `lib/actions.ts`

- [ ] **Schritt 1: `createGroup` um `alias`-Parameter erweitern**

Aktuelle Signatur in `lib/actions.ts` (Zeile 31):
```ts
export async function createGroup(
  name: string,
  userId: string
): Promise<{ code: string } | { error: string }>
```

Ersetzen mit:
```ts
export async function createGroup(
  name: string,
  userId: string,
  alias: string
): Promise<{ code: string } | { error: string }>
```

Den `group_members`-Insert (aktuell Zeile 58) ersetzen mit:
```ts
await supabase
  .from("group_members")
  .insert({ group_id: data.id, user_id: userId, alias: alias.trim() });
```

- [ ] **Schritt 2: `joinGroup` auf Alias umstellen**

Aktuelle Signatur (Zeile 63):
```ts
export async function joinGroup(
  code: string,
  userId: string
): Promise<{ success: true; groupName: string } | { error: string }>
```

Komplett ersetzen mit:
```ts
export async function joinGroup(
  code: string,
  userId: string,
  alias: string
): Promise<{ success: true; groupName: string } | { error: string }> {
  const supabase = await createClient();

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .select("id, name")
    .eq("code", code.toUpperCase())
    .single();

  if (gErr || !group) return { error: "Tipprunde nicht gefunden." };

  const { data: existing } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existing) return { error: "Du bist bereits Mitglied dieser Runde." };

  const { error: mErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, alias: alias.trim() });

  if (mErr) return { error: mErr.message };
  return { success: true, groupName: group.name };
}
```

- [ ] **Schritt 3: `lookupGroup` hinzufügen**

Am Ende von `lib/actions.ts` einfügen:
```ts
export async function lookupGroup(
  code: string
): Promise<{ name: string; memberCount: number } | { error: string }> {
  const supabase = await createClient();
  const { data: group, error } = await supabase
    .from("groups")
    .select("name, group_members(user_id)")
    .eq("code", code.toUpperCase())
    .single();
  if (error || !group) return { error: "Tipprunde nicht gefunden." };
  return {
    name: group.name,
    memberCount: (group.group_members as Array<{ user_id: string }>).length,
  };
}
```

- [ ] **Schritt 4: `getMyGroups` hinzufügen**

Direkt nach `lookupGroup` einfügen:
```ts
export async function getMyGroups(
  userId: string
): Promise<Array<{ code: string; name: string; alias: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("alias, groups(code, name)")
    .eq("user_id", userId);
  return (data ?? []).map((m) => {
    const g = m.groups as { code: string; name: string };
    return { alias: m.alias, code: g.code, name: g.name };
  });
}
```

- [ ] **Schritt 5: TypeScript prüfen**

```bash
cd TippMate && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehlerausgabe.

- [ ] **Schritt 6: Commit**

```bash
git add lib/actions.ts
git commit -m "feat: actions — alias in createGroup/joinGroup, add lookupGroup/getMyGroups"
```

---

## Task 3: `LandingClient.tsx` neu schreiben

**Files:**
- Modify: `components/LandingClient.tsx`

- [ ] **Schritt 1: Kompletten Inhalt von `LandingClient.tsx` ersetzen**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUserId, setStoredUserId } from "@/lib/user";
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
    if (id) loadHome(id);
  }, []);

  async function loadHome(id: string) {
    const [user, groups] = await Promise.all([getUser(id), getMyGroups(id)]);
    if (user) setProfileName(user.nickname);
    setUserId(id);
    setMyGroups(groups);
    setStep("home");
  }

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError("Name muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createUser(nickname.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setStoredUserId(result.id);
      setProfileName(nickname.trim());
      await loadHome(result.id);
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
    if (createAlias.trim().length < 2) {
      setError("Alias muss mindestens 2 Zeichen lang sein.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await createGroup(groupName.trim(), userId, createAlias.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/runde/${result.code}`);
    }
    setLoading(false);
  }

  async function handleJoinLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await lookupGroup(joinCode.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      setGroupPreview(result);
      setStep("join-confirm");
    }
    setLoading(false);
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
    const result = await joinGroup(joinCode.trim(), userId, joinAlias.trim());
    if ("error" in result) {
      setError(result.error);
    } else {
      router.push(`/runde/${joinCode.toUpperCase()}`);
    }
    setLoading(false);
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
              <label className="text-xs text-gray-400">Name der Runde</label>
              <input
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
              <label className="text-xs text-gray-400">Dein Alias in dieser Runde</label>
              <input
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
              <label className="text-xs text-gray-400">Einladungscode</label>
              <input
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
              <label className="text-xs text-gray-400">Dein Alias in dieser Runde</label>
              <input
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
```

- [ ] **Schritt 2: TypeScript prüfen**

```bash
cd TippMate && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehlerausgabe.

- [ ] **Schritt 3: Commit**

```bash
git add components/LandingClient.tsx
git commit -m "feat: redesign LandingClient — profile home + per-group alias flow"
```

---

## Task 4: Mitgliederliste in `/runde/[code]/page.tsx` auf Alias umstellen

**Files:**
- Modify: `app/runde/[code]/page.tsx`

- [ ] **Schritt 1: Supabase-Query anpassen**

Zeile 14 — aktuelle Query:
```ts
const group = await getGroupByCode(code);
```

Die Funktion `getGroupByCode` in `lib/actions.ts` (Zeile 85) liefert aktuell `group_members(user_id, users(nickname))`. Diese Zeile ersetzen:

```ts
export async function getGroupByCode(code: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("*, group_members(user_id, alias)")
    .eq("code", code.toUpperCase())
    .single();
  return data;
}
```

- [ ] **Schritt 2: Mitglieder-Mapping in der Page anpassen**

In `app/runde/[code]/page.tsx` Zeile 14–16 ersetzen:

```ts
// ALT:
const members: Array<{ nickname: string }> =
  (group.group_members as Array<{ users: { nickname: string } }>)
    ?.map((m) => ({ nickname: m.users?.nickname ?? "?" })) ?? [];

// NEU:
const members: Array<{ nickname: string }> =
  (group.group_members as Array<{ alias: string }>)
    ?.map((m) => ({ nickname: m.alias ?? "?" })) ?? [];
```

- [ ] **Schritt 3: TypeScript prüfen**

```bash
cd TippMate && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehlerausgabe.

- [ ] **Schritt 4: Commit**

```bash
git add lib/actions.ts app/runde/[code]/page.tsx
git commit -m "feat: group page — show alias instead of nickname"
```

---

## Task 5: Rangliste in `/runde/[code]/tabelle/page.tsx` auf Alias umstellen

**Files:**
- Modify: `app/runde/[code]/tabelle/page.tsx`

- [ ] **Schritt 1: Supabase-Query anpassen**

Zeile 35–38 — aktuell:
```ts
const { data: members } = await supabase
  .from("group_members")
  .select("user_id, users(nickname)")
  .eq("group_id", group.id);
```

Ersetzen mit:
```ts
const { data: members } = await supabase
  .from("group_members")
  .select("user_id, alias")
  .eq("group_id", group.id);
```

- [ ] **Schritt 2: Alias in Rangliste verwenden**

Zeile 85 — aktuell:
```ts
nickname: (member.users as unknown as { nickname: string } | null)?.nickname ?? "?",
```

Ersetzen mit:
```ts
nickname: (member as unknown as { alias: string }).alias ?? "?",
```

- [ ] **Schritt 3: TypeScript prüfen**

```bash
cd TippMate && npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehlerausgabe.

- [ ] **Schritt 4: Commit**

```bash
git add app/runde/[code]/tabelle/page.tsx
git commit -m "feat: tabelle — show alias instead of nickname"
```

---

## Task 6: Build, Push und Deploy

- [ ] **Schritt 1: Produktions-Build testen**

```bash
cd TippMate && npx next build
```

Erwartetes Ergebnis: alle Routen grün, kein Fehler. Der Build-Output zeigt `✓ Compiled successfully`.

- [ ] **Schritt 2: Auf GitHub pushen**

```bash
git push origin main
```

Vercel deployed automatisch sobald der Push ankommt (GitHub-Integration ist bereits verknüpft).

- [ ] **Schritt 3: Manuell testen auf https://tippmate.vercel.app**

Checkliste:
1. Erster Besuch → Profilname-Formular erscheint
2. Name eingeben → Home erscheint mit "Hey, [Name]!"
3. "+ Erstellen" → Gruppenname + Alias → Runde wird erstellt, Weiterleitung zu `/runde/[code]`
4. Home → "Beitreten" → Code eingeben → Gruppeninfo erscheint → Alias eingeben → Beitreten → Weiterleitung
5. Home zeigt Runden mit Alias
6. Rangliste (`/runde/[code]/tabelle`) zeigt Alias statt internem Namen
7. Seite neu laden → Home erscheint direkt (kein erneuter Profilname-Screen)

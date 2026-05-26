# Design: Persistentes Profil + Per-Gruppe-Alias

**Datum:** 2026-05-26  
**Status:** Approved

## Zusammenfassung

Nutzer erstellen einmalig ein persönliches Profil (interner Name, nur für sie selbst sichtbar). Mit diesem Profil können sie beliebig vielen Tipprunden beitreten und dabei pro Runde einen eigenen Alias wählen, unter dem sie in der Rangliste erscheinen.

---

## 1. Datenmodell

### Änderung: `group_members`

```sql
-- migration: supabase/migrations/003_alias.sql
ALTER TABLE group_members
  ADD COLUMN alias text NOT NULL
  CHECK (char_length(alias) BETWEEN 2 AND 30);
```

- `users.nickname` bleibt als **interner Profilname** — wird nur dem Nutzer selbst angezeigt (Begrüßungszeile auf der Homeseite).
- `group_members.alias` ist der **Anzeigename in einer Runde** — erscheint in Rangliste und Mitgliederliste.
- Alias ist nach dem Beitreten **unveränderlich**.
- UUID in localStorage bleibt Identifikationsmechanismus. Die Struktur ist bewusst so gehalten, dass Supabase Auth (`auth.users`) später ohne Schema-Umbau drüber gelegt werden kann.

### Kein Email-Feld jetzt

Auth-Erweiterung ist bewusst verschoben. Die `users.id` (UUID) ist Auth-agnostisch — ob sie aus localStorage oder aus `auth.uid()` kommt, ändert sich nur in `lib/user.ts`, nicht im Schema.

---

## 2. User Flow

### Erster Besuch
1. `/` → Kein `tippmate_user_id` in localStorage
2. Formular: **Profilname eingeben** (Label: "Nur für dich sichtbar")
3. Server Action `createUser(nickname)` → UUID in localStorage → weiter zu **Home**

### Wiederkehrender Besuch
1. `/` → `tippmate_user_id` vorhanden → direkt **Home**

### Home (Layout B)
- Begrüßung: "Hey, [Profilname]!"
- Liste aller Runden mit jeweiligem Alias ("als [Alias]") → Klick → `/runde/[code]`
- Zwei Buttons: **+ Erstellen** | **Beitreten**
- Leerer Zustand: einladender Hinweis, erster Button prominent

### Runde erstellen
- Ein Formular: **Rundenname** + **Eigener Alias**
- Server Action `createGroup(name, userId, alias)`
- → Weiterleitung zu `/runde/[code]`

### Runde beitreten — Schritt 1
- Code-Eingabe (6 Zeichen, Monospace)
- Button erst aktiv bei 6 Zeichen
- Server Action `lookupGroup(code)` → gibt `{ name, memberCount }` zurück

### Runde beitreten — Schritt 2
- Zeigt: Gruppenname + Mitgliederzahl
- Alias-Eingabe (Placeholder: "Wie sollen dich andere sehen?")
- Server Action `joinGroup(code, userId, alias)`
- → Weiterleitung zu `/runde/[code]`

---

## 3. Geänderte Dateien

| Datei | Änderung |
|---|---|
| `supabase/migrations/003_alias.sql` | Neu: `alias`-Spalte zu `group_members` |
| `lib/actions.ts` | `createGroup` + `joinGroup` nehmen `alias`; neue Funktionen `getMyGroups(userId)` + `lookupGroup(code)` |
| `components/LandingClient.tsx` | Komplett neu: Steps `nickname \| home \| create \| join \| join-confirm` |
| `app/runde/[code]/page.tsx` | Mitgliederliste zeigt `alias` statt `users.nickname` |
| `app/runde/[code]/tabelle/page.tsx` | Rangliste zeigt `alias` statt `users.nickname` |

### `getMyGroups(userId)`

Neue Server Action, lädt alle Runden eines Users:

```ts
// Rückgabetyp
Array<{ code: string; name: string; alias: string }>
```

### `LandingClient` Steps

```
"nickname" | "home" | "create" | "join" | "join-confirm"
```

`join-confirm` erhält den Gruppen-Preview aus Schritt 1 via lokalen State (kein URL-Parameter).

---

## 4. Gruppen-Kontext: Alias-Anzeige

Überall wo bisher `users.nickname` für Mitglieder gezeigt wurde, wird künftig `group_members.alias` verwendet:

- `/runde/[code]` — Mitgliederliste im Info-Panel
- `/runde/[code]/tabelle` — Rangliste
- `/api/group-tips` — **nicht betroffen** (gibt nur Scores zurück, keine Namen)

---

## 5. Auth-Erweiterung (future)

Wenn später Email-Auth ergänzt wird:
1. Supabase Auth aktivieren
2. `lib/user.ts` anpassen: `getStoredUserId()` nutzt `supabase.auth.getUser()` statt localStorage
3. `users`-Tabelle bekommt `email`-Spalte oder wird durch `auth.users` ersetzt
4. Kein Schema-Umbau bei `groups`, `group_members`, `tips` nötig

---

## 6. Out of Scope

- Alias nachträglich ändern
- Profilname nachträglich ändern
- Email-Registrierung / Login
- Profilbild / Avatar

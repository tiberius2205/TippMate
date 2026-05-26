/**
 * Löst Knockout-Placeholders in Team-Codes auf.
 *
 * Typen:
 *   "1A"          → Gruppensieger A
 *   "2B"          → Gruppenzweiter B
 *   "3A/B/C/D/F"  → Bester Drittplatzierter aus Gruppen A/B/C/D/F (manuell)
 *   "W101"        → Sieger Match 101
 *   "L101"        → Verlierer Match 101 (Spiel um Platz 3)
 */

import type { DbResult, DbKoResolution } from "@/types/wm";
import { calcGroupStandings } from "@/lib/standings";
import { matchByNumber } from "@/lib/data";
import type { Group } from "@/types/wm";

export interface ResolutionContext {
  results: Map<string, DbResult>;
  koResolutions: Map<string, DbKoResolution>; // match_id → resolution
}

export function resolvePlaceholder(
  placeholder: string,
  ctx: ResolutionContext
): string | null {
  // 1A / 2A / … / 1L / 2L
  const groupWinnerMatch = placeholder.match(/^([12])([A-L])$/);
  if (groupWinnerMatch) {
    const pos = parseInt(groupWinnerMatch[1]) - 1; // 0-indexed
    const group = groupWinnerMatch[2] as Group;
    const standings = calcGroupStandings(group, ctx.results);
    return standings[pos]?.team.code ?? null;
  }

  // 3A/B/C/... → manuell via ko_resolutions
  if (placeholder.startsWith("3")) {
    // Suche nach einer passenden manuellen Auflösung
    // In ko_resolutions wird die match_id gespeichert, nicht der placeholder
    // → wird vom Admin direkt als home_code/away_code gesetzt
    return null; // immer manuell
  }

  // W101, W102, … → Sieger des jeweiligen Matches
  const winnerMatch = placeholder.match(/^W(\d+)$/);
  if (winnerMatch) {
    const matchNum = parseInt(winnerMatch[1]);
    const match = matchByNumber.get(matchNum);
    if (!match) return null;
    const result = ctx.results.get(match.id);
    return result?.winner_code ?? null;
  }

  // L101, L102 → Verlierer (für Spiel um Platz 3)
  const loserMatch = placeholder.match(/^L(\d+)$/);
  if (loserMatch) {
    const matchNum = parseInt(loserMatch[1]);
    const match = matchByNumber.get(matchNum);
    if (!match) return null;
    const result = ctx.results.get(match.id);
    if (!result?.winner_code) return null;
    // Verlierer = nicht der Sieger
    const homeCode = match.home.code;
    const awayCode = match.away.code;
    if (!homeCode || !awayCode) return null;
    return result.winner_code === homeCode ? awayCode : homeCode;
  }

  return null;
}

export function resolveMatch(
  matchId: string,
  homePlaceholder: string | null,
  awayPlaceholder: string | null,
  ctx: ResolutionContext
): { home: string | null; away: string | null } {
  // Admin-Override hat Priorität
  const override = ctx.koResolutions.get(matchId);
  if (override) {
    return { home: override.home_code, away: override.away_code };
  }

  const home = homePlaceholder ? resolvePlaceholder(homePlaceholder, ctx) : null;
  const away = awayPlaceholder ? resolvePlaceholder(awayPlaceholder, ctx) : null;
  return { home, away };
}

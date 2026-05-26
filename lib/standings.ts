import type { GroupStanding, Team, DbResult } from "@/types/wm";
import { getTeamsByGroup, getMatchesByGroup } from "@/lib/data";
import type { Group } from "@/types/wm";

interface HeadToHead {
  points: number;
  goal_diff: number;
  goals_for: number;
}

function emptyRow(team: Team): GroupStanding {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0,
    position: 0,
  };
}

export function calcGroupStandings(
  group: Group,
  results: Map<string, DbResult>
): GroupStanding[] {
  const groupTeams = getTeamsByGroup(group);
  const groupMatches = getMatchesByGroup(group);

  const rows = new Map<string, GroupStanding>(
    groupTeams.map((t) => [t.code, emptyRow(t)])
  );

  for (const match of groupMatches) {
    const result = results.get(match.id);
    if (!result || match.home.code === null || match.away.code === null) continue;

    const home = rows.get(match.home.code);
    const away = rows.get(match.away.code);
    if (!home || !away) continue;

    const { home_90: gh, away_90: ga } = result;

    home.played++;
    away.played++;
    home.goals_for += gh;
    home.goals_against += ga;
    away.goals_for += ga;
    away.goals_against += gh;
    home.goal_diff = home.goals_for - home.goals_against;
    away.goal_diff = away.goals_for - away.goals_against;

    if (gh > ga) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (gh < ga) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const sorted = Array.from(rows.values()).sort((a, b) => {
    // 1. Punkte
    if (b.points !== a.points) return b.points - a.points;
    // 2. Tordifferenz
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    // 3. Erzielte Tore
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    // 4. Direkter Vergleich (vereinfacht: h2h Punkte)
    const h2h = calcH2H([a.team.code, b.team.code], groupMatches, results);
    const ha = h2h.get(a.team.code)!;
    const hb = h2h.get(b.team.code)!;
    if (hb.points !== ha.points) return hb.points - ha.points;
    if (hb.goal_diff !== ha.goal_diff) return hb.goal_diff - ha.goal_diff;
    if (hb.goals_for !== ha.goals_for) return hb.goals_for - ha.goals_for;
    // 5+6: Fair-Play + Losentscheid → manuell via Admin
    return 0;
  });

  sorted.forEach((row, i) => {
    row.position = i + 1;
  });

  return sorted;
}

function calcH2H(
  codes: string[],
  groupMatches: ReturnType<typeof getMatchesByGroup>,
  results: Map<string, DbResult>
): Map<string, HeadToHead> {
  const map = new Map<string, HeadToHead>(
    codes.map((c) => [c, { points: 0, goal_diff: 0, goals_for: 0 }])
  );

  for (const match of groupMatches) {
    const { code: hc } = match.home;
    const { code: ac } = match.away;
    if (!hc || !ac) continue;
    if (!codes.includes(hc) || !codes.includes(ac)) continue;

    const result = results.get(match.id);
    if (!result) continue;

    const { home_90: gh, away_90: ga } = result;
    const hRow = map.get(hc)!;
    const aRow = map.get(ac)!;

    hRow.goals_for += gh;
    hRow.goal_diff += gh - ga;
    aRow.goals_for += ga;
    aRow.goal_diff += ga - gh;

    if (gh > ga) {
      hRow.points += 3;
    } else if (gh < ga) {
      aRow.points += 3;
    } else {
      hRow.points += 1;
      aRow.points += 1;
    }
  }

  return map;
}

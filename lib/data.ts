import type { WC2026Data, Team, Stadium, Match, BonusQuestion, Group, Stage } from "@/types/wm";
import rawData from "@/data/wc2026_data.json";

const data = rawData as WC2026Data;

export const tournament = data.tournament;
export const scoring = data.scoring;
export const teams: Team[] = data.teams;
export const stadiums: Stadium[] = data.stadiums;
export const matches: Match[] = data.matches;
export const bonusQuestions: BonusQuestion[] = data.bonus_questions;

// Lookups
export const teamByCode = new Map(teams.map((t) => [t.code, t]));
export const stadiumById = new Map(stadiums.map((s) => [s.id, s]));
export const matchById = new Map(matches.map((m) => [m.id, m]));
export const matchByNumber = new Map(matches.map((m) => [m.match_number, m]));

export function getTeam(code: string): Team | undefined {
  return teamByCode.get(code);
}

export function getStadium(id: string): Stadium | undefined {
  return stadiumById.get(id);
}

export function getMatch(id: string): Match | undefined {
  return matchById.get(id);
}

export function getMatchesByGroup(group: Group): Match[] {
  return matches.filter((m) => m.group === group);
}

export function getMatchesByStage(stage: Stage): Match[] {
  return matches.filter((m) => m.stage === stage);
}

export function getTeamsByGroup(group: Group): Team[] {
  return teams.filter((t) => t.group === group);
}

export const allGroups: Group[] = ["A","B","C","D","E","F","G","H","I","J","K","L"];

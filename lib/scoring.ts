import type { DbTip, DbResult, Stage } from "@/types/wm";
import { scoring } from "@/lib/data";

const { exact_result, correct_goal_difference, correct_tendency, wrong, knockout_winner_bonus } =
  scoring.rules;

function tendency(home: number, away: number): "home" | "draw" | "away" {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

export function calcPoints(
  tip: Pick<DbTip, "home_score" | "away_score" | "knockout_winner_code">,
  result: DbResult,
  stage: Stage
): number {
  const th = tip.home_score;
  const ta = tip.away_score;
  const rh = result.home_90;
  const ra = result.away_90;

  let points: number;

  if (th === rh && ta === ra) {
    points = exact_result;
  } else if (th - ta === rh - ra) {
    // Korrekte Tordifferenz (inkl. Sieger), aber nicht exaktes Ergebnis
    points = correct_goal_difference;
  } else if (tendency(th, ta) === tendency(rh, ra)) {
    points = correct_tendency;
  } else {
    points = wrong;
  }

  // K.O.-Bonus: +1 wenn Weiterkommender richtig getippt
  if (stage !== "group" && result.winner_code && tip.knockout_winner_code) {
    if (tip.knockout_winner_code === result.winner_code) {
      points += knockout_winner_bonus;
    }
  }

  return points;
}

export function calcTotalPoints(
  tips: Array<Pick<DbTip, "home_score" | "away_score" | "knockout_winner_code" | "match_id">>,
  results: Map<string, DbResult>,
  stageByMatchId: Map<string, Stage>
): number {
  let total = 0;
  for (const tip of tips) {
    const result = results.get(tip.match_id);
    const stage = stageByMatchId.get(tip.match_id);
    if (result && stage) {
      total += calcPoints(tip, result, stage);
    }
  }
  return total;
}

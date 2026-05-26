import { calcGroupStandings } from "@/lib/standings";
import { getAllResults } from "@/lib/matchResolver";
import type { Group } from "@/types/wm";

interface Props {
  group: Group;
  highlightCode?: string;
}

export default async function GroupStandingsTable({ group, highlightCode }: Props) {
  const results = await getAllResults();
  const standings = calcGroupStandings(group, results);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs border-b border-gray-800">
            <th className="text-left py-2 w-6">#</th>
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2 w-8">Sp</th>
            <th className="text-center py-2 w-8">S</th>
            <th className="text-center py-2 w-8">U</th>
            <th className="text-center py-2 w-8">N</th>
            <th className="text-center py-2 w-10">TD</th>
            <th className="text-center py-2 w-8 font-bold text-gray-300">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const isHighlighted = highlightCode && row.team.code === highlightCode;
            const isTop2 = row.position <= 2;
            return (
              <tr
                key={row.team.code}
                className={`border-b border-gray-800/50 ${isHighlighted ? "bg-blue-900/30" : ""}`}
              >
                <td className={`py-2 text-xs font-bold ${isTop2 ? "text-green-400" : "text-gray-500"}`}>
                  {row.position}
                </td>
                <td className="py-2">
                  <span className="mr-1">{row.team.flag}</span>
                  <span className={isHighlighted ? "text-blue-300 font-medium" : ""}>{row.team.name}</span>
                </td>
                <td className="text-center py-2 text-gray-400">{row.played}</td>
                <td className="text-center py-2 text-gray-400">{row.won}</td>
                <td className="text-center py-2 text-gray-400">{row.drawn}</td>
                <td className="text-center py-2 text-gray-400">{row.lost}</td>
                <td className="text-center py-2 text-gray-400">
                  {row.goal_diff > 0 ? "+" : ""}{row.goal_diff}
                </td>
                <td className="text-center py-2 font-bold">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

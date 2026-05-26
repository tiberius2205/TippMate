import { getGroupByCode } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function RundePage({ params }: Props) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const members: Array<{ nickname: string }> =
    (group.group_members as Array<{ users: { nickname: string } }>)
      ?.map((m) => ({ nickname: m.users?.nickname ?? "?" })) ?? [];

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-400 text-sm">Tipprunde</p>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="font-mono text-blue-400 text-sm mt-1">Code: {group.code}</p>
      </div>

      {/* Navigation */}
      <nav className="grid grid-cols-2 gap-3">
        <Link
          href={`/runde/${code}/spiele`}
          className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-1">📅</div>
          <div className="font-semibold">Spiele</div>
          <div className="text-xs text-gray-400">Alle 104 Spiele tippen</div>
        </Link>
        <Link
          href={`/runde/${code}/tabelle`}
          className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-semibold">Tabelle</div>
          <div className="text-xs text-gray-400">Aktuelle Rangliste</div>
        </Link>
        <Link
          href={`/runde/${code}/bonus`}
          className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-1">🎯</div>
          <div className="font-semibold">Bonusfragen</div>
          <div className="text-xs text-gray-400">Bis 11. Juni 16:00 UTC</div>
        </Link>
        <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
          <div className="text-2xl mb-1">👥</div>
          <div className="font-semibold text-gray-400">{members.length} Mitspieler</div>
          <div className="text-xs text-gray-600 truncate">
            {members.map((m) => m.nickname).join(", ")}
          </div>
        </div>
      </nav>

      {/* Code teilen */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-sm text-gray-400 mb-2">Freunde einladen mit Code:</p>
        <p className="font-mono text-2xl font-bold text-blue-400 tracking-widest text-center">
          {group.code}
        </p>
      </div>
    </main>
  );
}

import { bonusQuestions, teams } from "@/lib/data";
import Link from "next/link";
import BonusClient from "@/components/BonusClient";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function BonusPage({ params }: Props) {
  const { code } = await params;
  const now = new Date();
  const deadline = new Date(bonusQuestions[0]?.deadline ?? "2026-06-11T16:00:00Z");
  const isOpen = now < deadline;

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/runde/${code}`} className="text-gray-400 hover:text-white text-sm">
          ← Zurück
        </Link>
        <h1 className="text-xl font-bold">Bonusfragen</h1>
      </div>

      <div className={`rounded-xl p-3 text-sm text-center ${isOpen ? "bg-green-900/30 border border-green-700 text-green-400" : "bg-red-900/30 border border-red-700 text-red-400"}`}>
        {isOpen
          ? `Offen bis ${deadline.toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} Uhr MEZ`
          : "Deadline abgelaufen — Tipps sind gesperrt"}
      </div>

      <BonusClient
        questions={bonusQuestions}
        teams={teams}
        groupCode={code}
        isOpen={isOpen}
      />
    </main>
  );
}

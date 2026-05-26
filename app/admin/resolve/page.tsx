import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { matches, teamByCode } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import AdminClient from "@/components/AdminClient";

export default async function AdminResolvePage() {
  // Einfacher Basic-Auth via Header (Passwort via ENV)
  const hdrs = await headers();
  const auth = hdrs.get("x-admin-auth");
  const validPassword = process.env.ADMIN_PASSWORD ?? "wm2026admin";

  if (auth !== validPassword) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  const { data: results } = await supabase.from("results").select("*");
  const { data: koResolutions } = await supabase.from("ko_resolutions").select("*");

  const koMatches = matches.filter((m) => m.home.code === null || m.away.code === null);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">Admin — Paarungen & Ergebnisse</h1>

      <AdminClient
        koMatches={koMatches}
        allMatches={matches}
        teams={Array.from(teamByCode.values())}
        existingResults={results ?? []}
        existingKoResolutions={koResolutions ?? []}
      />
    </main>
  );
}

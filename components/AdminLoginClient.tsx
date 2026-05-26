"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Passwort wird als custom Header gesetzt — Redirect zu /admin/resolve
    // Da Next.js Server Components den Header lesen, verwenden wir hier einen einfachen
    // Ansatz: Passwort in sessionStorage, dann fetch mit Header
    if (!pw) return;
    sessionStorage.setItem("admin_pw", pw);
    // Reload der Seite — der Middleware-Aufruf passiert via fetch below
    router.push(`/admin/resolve?pw=${encodeURIComponent(pw)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Admin-Passwort"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        Einloggen
      </button>
    </form>
  );
}

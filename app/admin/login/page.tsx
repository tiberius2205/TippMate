import AdminLoginClient from "@/components/AdminLoginClient";

export default function AdminLoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Admin-Zugang</h1>
        <AdminLoginClient />
      </div>
    </main>
  );
}

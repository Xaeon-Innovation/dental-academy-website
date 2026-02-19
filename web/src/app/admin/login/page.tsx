import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/90 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.85)]">
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight text-white">
            Admin Login
        </h1>
        <p className="mt-2 text-sm text-white/70">
            Sign in to access the admin dashboard
        </p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}

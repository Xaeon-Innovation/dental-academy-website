import AdminEmailManager from "@/components/admin/AdminEmailManager";
import ContactInfoEditor from "@/components/admin/ContactInfoEditor";
import BlogNavToggle from "@/components/admin/BlogNavToggle";
import CourseMaterialsEditor from "@/components/admin/CourseMaterialsEditor";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-playfair)] text-2xl tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Manage site settings and admin access
        </p>
      </div>

      <BlogNavToggle />

      <ContactInfoEditor />

      <AdminEmailManager />

      <CourseMaterialsEditor />
    </div>
  );
}

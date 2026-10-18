import { redirect } from "next/navigation";

export default function AdminMenusRedirectPage() {
  // Navigation menus are cleanly hardcoded per modern design.
  // Global site identity, branding, and footer copyright are managed in Settings.
  redirect("/admin/settings");
}

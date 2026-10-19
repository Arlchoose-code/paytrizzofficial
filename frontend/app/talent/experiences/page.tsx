import { redirect } from "next/navigation";

export default function TalentExperiencesPage() {
  // Consolidate editing into Talent Profile (/talent/profile?tab=experience)
  redirect("/talent/profile?tab=experience");
}

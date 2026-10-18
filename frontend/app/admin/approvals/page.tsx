import { redirect } from "next/navigation";

export default function AdminApprovalsRedirect() {
  // Approvals are streamlined directly inside the Blog editorial interface (/admin/blog)
  // where pending articles can be approved with 1 click.
  redirect("/admin/blog?status=pending");
}

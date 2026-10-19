import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Mail,
  Settings,
  ShieldCheck,
  FolderOpen,
  HelpCircle,
  Send,
  Inbox,
  Image as ImageIcon,
  UserCog,
  ScrollText,
  SlidersHorizontal,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

export interface NavBadgeCounts {
  messages?: number;
  applications?: number;
  approvals?: number;
  mail?: number;
}

/** Admin sidebar groups per UI_REFERENCE 6.1 */
export function buildAdminNavGroups(counts: NavBadgeCounts): DashboardNavGroup[] {
  const format = (n?: number) => (n && n > 0 ? String(n) : undefined);
  return [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      label: "Inbox",
      items: [
        { label: "Messages", href: "/admin/messages", icon: Inbox, badge: format(counts.messages) },
        { label: "Applications", href: "/admin/applications", icon: Users, badge: format(counts.applications) },
      ],
    },
    {
      label: "People",
      items: [
        { label: "Talents", href: "/admin/talents", icon: Users },
        { label: "Users", href: "/admin/users", icon: UserCog },
      ],
    },
    {
      label: "Content",
      items: [
        { label: "Pages", href: "/admin/pages", icon: FolderOpen },
        { label: "Services", href: "/admin/services", icon: Briefcase },
        { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
        { label: "Projects", href: "/admin/projects", icon: Briefcase },
        { label: "Blog", href: "/admin/blog", icon: FileText, badge: format(counts.approvals) },
        { label: "Media", href: "/admin/media", icon: ImageIcon },
      ],
    },
    {
      label: "Mail",
      items: [
        { label: "Company Mail", href: "/webmail", icon: Mail, badge: format(counts.mail) },
        { label: "Mail Monitor", href: "/admin/mail-monitor", icon: ShieldCheck },
        { label: "Mail Logs", href: "/admin/mail-logs", icon: ScrollText },
        { label: "Mail Settings", href: "/admin/mail-settings", icon: SlidersHorizontal },
        { label: "Email Templates", href: "/admin/email-templates", icon: Mail },
        { label: "Email Outbox", href: "/admin/email-outbox", icon: Send },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
      ],
    },
  ];
}

/** Talent sidebar per UI_REFERENCE 6.2 */
export function buildTalentNavGroups(counts: NavBadgeCounts): DashboardNavGroup[] {
  const format = (n?: number) => (n && n > 0 ? String(n) : undefined);
  return [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/talent", icon: LayoutDashboard },
        { label: "Profile", href: "/talent/profile", icon: Users },
        { label: "Blog", href: "/talent/blog", icon: FileText },
        { label: "Projects", href: "/talent/projects", icon: Briefcase },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Messages", href: "/talent/messages", icon: Inbox, badge: format(counts.messages) },
        { label: "Mail", href: "/webmail", icon: Mail, badge: format(counts.mail) },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Account", href: "/talent/account", icon: Settings }],
    },
  ];
}

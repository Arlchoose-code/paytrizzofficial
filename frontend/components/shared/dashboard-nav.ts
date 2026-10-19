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

export interface SearchResultItem {
  title: string;
  category: string;
  href: string;
  description?: string;
}

export const ADMIN_SEARCH_ROUTES: SearchResultItem[] = [
  { title: "Dashboard Overview", category: "Navigation", href: "/admin", description: "System metrics and telemetry" },
  { title: "Contact Inquiries", category: "Navigation", href: "/admin/messages", description: "Incoming client messages" },
  { title: "Applications", category: "Navigation", href: "/admin/applications", description: "Project intake and squad requests" },
  { title: "Talents Directory", category: "Navigation", href: "/admin/talents", description: "Manage specialist rosters" },
  { title: "Admin Users", category: "Navigation", href: "/admin/users", description: "Admin accounts and access" },
  { title: "Projects & Cases", category: "Navigation", href: "/admin/projects", description: "Portfolio and case studies" },
  { title: "Blog & Editorial", category: "Navigation", href: "/admin/blog", description: "Publish articles and review submissions" },
  { title: "Services Catalog", category: "Navigation", href: "/admin/services", description: "Offerings and service cards" },
  { title: "Media Library", category: "Navigation", href: "/admin/media", description: "Uploaded images and documents" },
  { title: "Pages CMS", category: "Navigation", href: "/admin/pages", description: "Visual section editor" },
  { title: "Company Webmail", category: "Navigation", href: "/webmail", description: "Company webmail inbox" },
  { title: "Mail Settings", category: "Navigation", href: "/admin/mail-settings", description: "Reserved names, limits, retention" },
  { title: "Mail Monitor", category: "Navigation", href: "/admin/mail-monitor", description: "Audit talent mailboxes" },
  { title: "Mail Logs", category: "Navigation", href: "/admin/mail-logs", description: "Audit events & exports" },
  { title: "Email Outbox", category: "Navigation", href: "/admin/email-outbox", description: "Outbox transaction queues" },
  { title: "Platform Settings", category: "Navigation", href: "/admin/settings", description: "Branding, SEO, robots, toggles" },
  { title: "Audit Logs", category: "Navigation", href: "/admin/audit-logs", description: "Every admin action, recorded" },
];

export const TALENT_SEARCH_ROUTES: SearchResultItem[] = [
  { title: "Talent Dashboard", category: "Navigation", href: "/talent", description: "Overview and metrics" },
  { title: "My Profile", category: "Navigation", href: "/talent/profile", description: "Edit bio, skills, CV, links" },
  { title: "Experience & Education", category: "Navigation", href: "/talent/experiences", description: "Work history and degrees" },
  { title: "My Blog", category: "Navigation", href: "/talent/blog", description: "Draft and submit articles" },
  { title: "My Projects", category: "Navigation", href: "/talent/projects", description: "Manage case studies and projects" },
  { title: "Client Messages", category: "Navigation", href: "/talent/messages", description: "Direct contact inquiries" },
  { title: "Personal Webmail", category: "Navigation", href: "/webmail", description: "Webmail inbox" },
  { title: "Account Settings", category: "Navigation", href: "/talent/account", description: "Security & password" },
];

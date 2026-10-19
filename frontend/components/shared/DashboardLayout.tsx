"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X, Bell, Search, ArrowRight, Mail } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import {
  buildAdminNavGroups,
  buildTalentNavGroups,
  type NavBadgeCounts,
  type SearchResultItem,
  ADMIN_SEARCH_ROUTES,
  TALENT_SEARCH_ROUTES,
} from "./dashboard-nav";
import { User } from "@/types/user";
import { getMeApi, logoutApi, refreshApi } from "@/lib/api/auth";
import { MailPolicyDialog } from "./MailPolicyDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/settings";

import { navigateToWebmail } from "@/lib/subdomain";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "admin" | "talent";
  title?: string;
}

interface NotificationItem {
  id: number;
  title: string;
  subtitle: string;
  time: string;
  href: string;
  status?: string;
}

export function DashboardLayout({ children, role = "admin", title = "PayTrizz" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<NavBadgeCounts>({});
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const routes = role === "admin" ? ADMIN_SEARCH_ROUTES : TALENT_SEARCH_ROUTES;
    return routes.filter(
      (r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );
  }, [searchQuery, role]);

  useEffect(() => {
    fetch("/api/proxy/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setSiteSettings(json.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        let res = await getMeApi();
        if (!res.success) {
          // Attempt silent token refresh before redirecting to login
          const refreshRes = await refreshApi().catch(() => null);
          if (refreshRes && refreshRes.success) {
            res = await getMeApi();
          }
        }

        if (cancelled) return;

        if (res.success && res.data) {
          // An admin-issued temporary password blocks the dashboard and webmail
          // until the user sets their own (PRD 4.1).
          if (res.data.must_change_password) {
            router.replace("/change-password");
            return;
          }
          setUser(res.data);
          if (res.data.role !== role) {
            router.push(res.data.role === "admin" ? "/admin" : "/talent");
          }
        } else {
          router.push("/login");
        }
      } catch {
        if (!cancelled) {
          router.push("/login");
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [role, router]);

  // Live badge counts + notifications popover data
  useEffect(() => {
    if (role === "admin") {
      const fetchAdminCounts = async () => {
        try {
          const [msgRes, appRes, revRes, postRes, projRes, mailRes] = await Promise.all([
            fetch("/api/proxy/admin/messages?status=new&per_page=5").then((r) => r.json()).catch(() => null),
            fetch("/api/proxy/admin/applications?status=new&per_page=1").then((r) => r.json()).catch(() => null),
            fetch("/api/proxy/admin/revisions?status=pending&per_page=1").then((r) => r.json()).catch(() => null),
            fetch("/api/proxy/admin/posts?status=pending&per_page=1").then((r) => r.json()).catch(() => null),
            fetch("/api/proxy/admin/projects?status=pending&per_page=1").then((r) => r.json()).catch(() => null),
            fetch("/api/proxy/mail/counts").then((r) => r.json()).catch(() => null),
          ]);

          const msgTotal = msgRes?.data?.total ?? 0;
          setBadgeCounts({
            messages: msgTotal,
            applications: appRes?.data?.total ?? 0,
            approvals:
              (revRes?.data?.total ?? 0) + (postRes?.data?.total ?? 0) + (projRes?.data?.total ?? 0),
            mail: mailRes?.data?.inbox ?? 0,
          });

          if (Array.isArray(msgRes?.data?.data)) {
            setNotifications(
              msgRes.data.data.map((m: any) => ({
                id: m.id,
                title: m.name || "Client Inquiry",
                subtitle: m.subject || "New contact message received",
                time: m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Just now",
                href: `/admin/messages`,
                status: m.status,
              }))
            );
          }
        } catch {}
      };

      fetchAdminCounts();
      const interval = setInterval(fetchAdminCounts, 30000);
      return () => clearInterval(interval);
    } else if (role === "talent") {
      const fetchTalentCounts = async () => {
        try {
          const [mailRes, msgRes] = await Promise.all([
            fetch("/api/proxy/mail/counts"),
            fetch("/api/proxy/talent/messages?status=new"),
          ]);
          const mailJson = await mailRes.json().catch(() => ({}));
          const msgJson = await msgRes.json().catch(() => ({}));

          const msgList = Array.isArray(msgJson?.data?.data)
            ? msgJson.data.data
            : Array.isArray(msgJson?.data)
              ? msgJson.data
              : [];

          setBadgeCounts({
            mail: mailJson?.data?.inbox ?? 0,
            messages: msgList.length,
          });

          setNotifications(
            msgList.slice(0, 5).map((m: any) => ({
              id: m.id,
              title: m.name || "Direct Inquiry",
              subtitle: m.subject || "Prospective client contacted you",
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Recent",
              href: `/talent/messages`,
              status: m.status,
            }))
          );
        } catch {}
      };
      fetchTalentCounts();
      const interval = setInterval(fetchTalentCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd+K / Ctrl+K focuses global search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        const input = document.getElementById("global-dashboard-search") as HTMLInputElement | null;
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);


  const handleLogout = async () => {
    await logoutApi();
    toast.success("Logged out");
    router.push("/login");
  };

  const navGroups = role === "admin" ? buildAdminNavGroups(badgeCounts) : buildTalentNavGroups(badgeCounts);
  const totalAlerts = (badgeCounts.messages || 0) + (badgeCounts.applications || 0) + (badgeCounts.approvals || 0);

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    const root = role === "admin" ? "/admin" : "/talent";
    if (href === root) return false;
    return pathname.startsWith(href + "/");
  };

  const renderNavGroup = (compact = false) => (
    <>
      {navGroups.map((group) => (
        <div key={group.label} className={compact ? "mb-1" : "mb-2"}>
          <p className="px-3.5 pt-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-400 select-none">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;
              const isWebmail = item.href === "/webmail";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (isWebmail) {
                      e.preventDefault();
                      navigateToWebmail();
                    } else if (compact) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2 rounded-2xl text-sm font-semibold transition-all relative",
                    isActive
                      ? "bg-brand-100 text-ink-900 font-bold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-brand-500 before:rounded-r"
                      : "text-ink-700 hover:bg-ink-100/70 hover:text-ink-900"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4", isActive ? "text-ink-900" : "text-ink-500")} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="bg-brand-500 text-ink-900 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#FAFAFA]">
      {/* First sign-in consent for talent mailboxes (PRD 4.1) */}
      {role === "talent" && user && !user.mail_policy_accepted_at && (
        <MailPolicyDialog
          onAccepted={() =>
            setUser((prev) =>
              prev ? { ...prev, mail_policy_accepted_at: new Date().toISOString() } : prev
            )
          }
          onSignOut={handleLogout}
        />
      )}
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-[268px] h-full bg-white border-r border-ink-100 flex-shrink-0 select-none z-30">
        <div className="p-5 border-b border-ink-100 flex items-center justify-between flex-shrink-0">
          <BrandLogo
            href="/"
            logoUrl={siteSettings?.logo_url || siteSettings?.site_logo_light}
            siteName={siteSettings?.site_name}
          />
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
              role === "admin" ? "bg-ink-900 text-white" : "bg-brand-500 text-ink-900"
            )}
          >
            {role}
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {renderNavGroup()}
        </nav>

        <div className="p-4 border-t border-ink-100 flex-shrink-0 bg-white">
          <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-ink-100/60 transition">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center font-bold text-ink-900 text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink-900 truncate">{user?.name || "Loading..."}</p>
                <p className="text-[11px] text-ink-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-ink-500 hover:text-danger rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-ink-900 rounded-lg hover:bg-ink-100 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs text-ink-500 hidden sm:inline whitespace-nowrap">
              PayTrizz / {role} /
            </span>
            <span className="text-xs font-bold text-ink-900 truncate">{title}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global search */}
            <div className="relative" ref={searchRef}>
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-500" />
                <input
                  id="global-dashboard-search"
                  type="text"
                  placeholder="Search (Ctrl+K)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  className="w-44 lg:w-64 h-9 pl-9 pr-3 rounded-full border border-ink-300 text-xs text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>

              {searchOpen && searchQuery.trim() && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-ink-100 py-3 z-50 overflow-hidden">
                  <div className="px-4 pb-2 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                      Results ({searchResults.length})
                    </span>
                    <button onClick={() => setSearchOpen(false)} className="text-ink-400 hover:text-ink-900 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {searchResults.length > 0 ? (
                      searchResults.map((r, i) => (
                        <Link
                          key={i}
                          href={r.href}
                          onClick={(e) => {
                            if (r.href === "/webmail") {
                              e.preventDefault();
                              setSearchOpen(false);
                              setSearchQuery("");
                              navigateToWebmail();
                            } else {
                              setSearchOpen(false);
                              setSearchQuery("");
                            }
                          }}
                          className="px-4 py-2.5 hover:bg-neutral-50 flex items-center justify-between group transition"
                        >
                          <div>
                            <p className="text-xs font-bold text-ink-900">{r.title}</p>
                            {r.description && <p className="text-[11px] text-ink-500">{r.description}</p>}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-ink-300 group-hover:text-ink-900 transition" />
                        </Link>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-ink-400">
                        No matches found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-ink-700 hover:text-ink-900 hover:bg-ink-100 rounded-full transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-500 text-ink-900 text-[9px] font-extrabold flex items-center justify-center">
                    {totalAlerts > 9 ? "9+" : totalAlerts}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-ink-100 py-3 z-50 overflow-hidden">
                  <div className="px-4 pb-2 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-900">Notifications</span>
                    {totalAlerts > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500 text-ink-900">
                        {totalAlerts} pending
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-ink-50 py-1">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => setNotificationsOpen(false)}
                          className="px-4 py-3 hover:bg-neutral-50 flex items-start gap-3 transition"
                        >
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-ink-900 flex-shrink-0 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-ink-900 truncate">{n.title}</p>
                              <span className="text-[10px] text-ink-400 flex-shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-ink-600 truncate mt-0.5">{n.subtitle}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-ink-400">No new notifications</div>
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-ink-100 text-center">
                    <Link
                      href={role === "admin" ? "/admin/messages" : "/talent/messages"}
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      View all messages
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile drawer with smooth backdrop and slide-over transition */}
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden flex transition-all duration-300",
            mobileMenuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
          )}
        >
          {/* Backdrop fade */}
          <div
            className={cn(
              "fixed inset-0 bg-ink-900/50 transition-opacity duration-300 ease-in-out",
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer slide-in */}
          <div
            className={cn(
              "relative w-72 bg-white flex flex-col z-10 shadow-2xl transition-transform duration-300 ease-in-out",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="p-4 border-b border-ink-100 flex items-center justify-between">
              <BrandLogo
                href="/"
                logoUrl={siteSettings?.logo_url || siteSettings?.site_logo_light}
                siteName={siteSettings?.site_name}
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-ink-500 hover:text-ink-900 cursor-pointer rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 flex-1 overflow-y-auto">{renderNavGroup(true)}</nav>

            {/* Mobile Drawer Footer: User Profile & Logout */}
            <div className="p-4 border-t border-ink-100 flex-shrink-0 bg-white">
              <div className="flex items-center justify-between p-2 rounded-2xl bg-neutral-50 border border-ink-100/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center font-bold text-ink-900 text-sm flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink-900 truncate">{user?.name || "Loading..."}</p>
                    <p className="text-[11px] text-ink-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  title="Logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger hover:bg-danger/20 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

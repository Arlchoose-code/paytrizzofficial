"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TalentFormModal,
  TalentItem,
  TalentFormState,
  BadgeItem,
  SpecialtyItem,
} from "@/components/admin/TalentFormModal";
import { TalentPasswordModal } from "@/components/admin/TalentPasswordModal";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { TalentsDirectoryTable } from "@/components/admin/talents/TalentsDirectoryTable";

type ModuleTab = "talents" | "skills" | "specialties" | "badges";

const EMPTY_FORM: TalentFormState = {
  name: "",
  email: "",
  password: "",
  force_change_password: true,
  send_welcome_email: true,
  headline: "",
  bio: "",
  location: "",
  years_experience: 0,
  availability: "available",
  hourly_rate_usd: "",
  is_published: false,
  is_featured: false,
  sort_order: 0,
  badge_ids: [],
  specialty_ids: [],
  avatar_media_id: null,
  avatar_preview_url: "",
};

function generateStrongPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%&*";
  let out = "";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 14; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export default function AdminTalentsPage() {
  const [mainTab, setMainTab] = useState<ModuleTab>("talents");
  const [talents, setTalents] = useState<TalentItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TalentItem | null>(null);
  const [form, setForm] = useState<TalentFormState>(EMPTY_FORM);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TalentItem | null>(null);
  const [resetTarget, setResetTarget] = useState<TalentItem | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);

  const fetchMeta = useCallback(async () => {
    const [badgeRes, specRes] = await Promise.all([
      fetch("/api/proxy/admin/badges").then((r) => r.json()).catch(() => null),
      fetch("/api/proxy/admin/specialties").then((r) => r.json()).catch(() => null),
    ]);
    if (badgeRes?.data) setBadges(badgeRes.data);
    if (specRes?.data) setSpecialties(specRes.data);
  }, []);

  const fetchTalents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "12" });
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(`/api/proxy/admin/talents?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setTalents(json.data?.data || []);
        setLastPage(json.data?.last_page || 1);
        setTotal(json.data?.total || 0);
      }
    } catch {
      toast.error("Failed to load talents");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchTalents();
  }, [fetchTalents]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, password: generateStrongPassword() });
    setCreatedCredentials(null);
    setModalOpen(true);
  };

  const openEdit = (t: TalentItem) => {
    setEditing(t);
    setForm({
      name: t.name,
      email: t.user_email || "",
      password: "",
      force_change_password: true,
      send_welcome_email: false,
      headline: t.headline || "",
      bio: t.bio || "",
      location: t.location || "",
      years_experience: t.years_experience ?? 0,
      availability: t.availability || "available",
      hourly_rate_usd: t.hourly_rate_usd !== undefined && t.hourly_rate_usd !== null ? String(t.hourly_rate_usd) : "",
      is_published: t.is_published,
      is_featured: t.is_featured,
      sort_order: t.sort_order || 0,
      badge_ids: (t.badges || []).map((b) => b.id),
      specialty_ids: (t.specialties || []).map((s) => s.id),
      avatar_media_id: t.avatar_media_id || (t.avatar_media as any)?.id || null,
      avatar_preview_url:
        t.avatar_media?.path_medium ||
        t.avatar_media?.path_original ||
        t.avatar_media?.path_thumb ||
        "",
    });
    setCreatedCredentials(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const res = await fetch(`/api/proxy/admin/talents/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            headline: form.headline,
            bio: form.bio,
            location: form.location,
            years_experience: Number(form.years_experience) || 0,
            hourly_rate_usd: form.hourly_rate_usd ? Number(form.hourly_rate_usd) : null,
            availability: form.availability,
            is_published: form.is_published,
            is_featured: form.is_featured,
            sort_order: Number(form.sort_order) || 0,
            badge_ids: form.badge_ids,
            specialty_ids: form.specialty_ids,
            avatar_media_id: form.avatar_media_id || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
        toast.success("Talent updated");
        setModalOpen(false);
        fetchTalents();
      } else {
        const res = await fetch("/api/proxy/admin/talents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password || undefined,
            force_change_password: form.force_change_password,
            send_welcome_email: form.send_welcome_email,
            headline: form.headline,
            bio: form.bio,
            location: form.location,
            years_experience: Number(form.years_experience) || 0,
            availability: form.availability,
            hourly_rate_usd: form.hourly_rate_usd ? Number(form.hourly_rate_usd) : null,
            is_featured: form.is_featured,
            badge_ids: form.badge_ids,
            specialty_ids: form.specialty_ids,
            avatar_media_id: form.avatar_media_id || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Create failed");
        setCreatedCredentials({
          email: form.email,
          password: json.data?.temp_password || form.password,
        });
        toast.success("Talent created", {
          description: form.send_welcome_email
            ? "Welcome email sent with login instructions."
            : "Copy the credentials and share them securely.",
        });
        fetchTalents();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/talents/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("Talent deleted");
      setDeleteTarget(null);
      fetchTalents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete talent");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/talents/${resetTarget.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_email: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Reset failed");
      setResetResult({
        email: resetTarget.user_email || "",
        password: json.data?.temp_password || "",
      });
      setResetTarget(null);
      toast.success("Password reset", { description: "New credentials emailed to the talent." });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (t: TalentItem) => {
    try {
      const res = await fetch(`/api/proxy/admin/talents/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: t.name,
          headline: t.headline,
          bio: t.bio || "",
          location: "",
          years_experience: 0,
          hourly_rate_usd: null,
          availability: t.availability,
          is_published: !t.is_published,
          is_featured: t.is_featured,
          sort_order: t.sort_order,
          badge_ids: (t.badges || []).map((b) => b.id),
          specialty_ids: (t.specialties || []).map((s) => s.id),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
      toast.success(t.is_published ? "Talent hidden from directory" : "Talent published");
      fetchTalents();
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility");
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials && !resetResult) return;
    const creds = createdCredentials || resetResult!;
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`);
    setCopied(true);
    toast.success("Credentials copied");
    setTimeout(() => setCopied(false), 2000);
  };



  return (
    <DashboardLayout role="admin" title="Talents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Roster
              </span>
              <span className="text-[11px] font-semibold text-ink-500">{total} specialists on record</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Talents Management</h1>
            <p className="text-sm text-ink-500 mt-1">
              Onboard specialists, assign badges, control visibility, and manage login accounts.
            </p>
          </div>
          {mainTab === "talents" && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Talent</span>
            </button>
          )}
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-ink-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setMainTab("talents")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap",
              mainTab === "talents" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Talents Directory
          </button>
          <button
            onClick={() => setMainTab("skills")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap",
              mainTab === "skills" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Skills
          </button>
          <button
            onClick={() => setMainTab("specialties")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap",
              mainTab === "specialties" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Specialties
          </button>
          <button
            onClick={() => setMainTab("badges")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap",
              mainTab === "badges" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Badges
          </button>
        </div>

        {mainTab === "talents" && (
          <>
            {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-ink-100 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-ink-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search talents by name or headline..."
            className="w-full text-sm outline-none text-ink-900 placeholder:text-ink-400 bg-transparent"
          />
          <button
            onClick={fetchTalents}
            className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Table */}
        <TalentsDirectoryTable
          loading={loading}
          talents={talents}
          togglePublished={togglePublished}
          openEdit={openEdit}
          setResetTarget={setResetTarget}
          setDeleteTarget={setDeleteTarget}
          page={page}
          lastPage={lastPage}
          total={total}
          setPage={setPage}
        />
      </>
    )}

    {mainTab === "skills" && (
      <TaxonomyManager
        key="talent-skills"
        title="Skill"
        description="Manage technical skills assigned to specialists and filterable in the talent directory."
        endpoint="/admin/skills"
        addLabel="Add Skill"
        emptyLabel="No skills yet."
        fields={[
          { key: "name", label: "Skill Name", type: "text", required: true, placeholder: "React.js" },
          { key: "category", label: "Category", type: "text", required: true, placeholder: "frontend" },
        ]}
        columns={[
          { key: "name", label: "Skill" },
          { key: "category", label: "Category" },
          { key: "slug", label: "Slug" },
        ]}
      />
    )}

    {mainTab === "specialties" && (
      <TaxonomyManager
        key="talent-specialties"
        title="Specialty"
        description="Core engineering specializations and squad roles."
        endpoint="/admin/specialties"
        addLabel="Add Specialty"
        emptyLabel="No specialties yet."
        fields={[
          { key: "key", label: "Specialty Key", type: "text", required: true, placeholder: "fullstack_architect" },
          { key: "name", label: "Display Name", type: "text", required: true, placeholder: "Full-Stack Architect" },
          { key: "icon", label: "Icon (Lucide name)", type: "text", required: true, defaultValue: "Code", placeholder: "Code" },
          { key: "description", label: "Description", type: "textarea", placeholder: "Brief summary of role scope" },
          { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
        ]}
        columns={[
          { key: "name", label: "Specialty" },
          { key: "key", label: "Key" },
          { key: "icon", label: "Icon" },
        ]}
      />
    )}

    {mainTab === "badges" && (
      <TaxonomyManager
        key="talent-badges"
        title="Badge"
        description="Verification, vetting, and performance badges assigned to top specialists."
        endpoint="/admin/badges"
        addLabel="Add Badge"
        emptyLabel="No badges yet."
        fields={[
          { key: "key", label: "Badge Key", type: "text", required: true, placeholder: "top_rated" },
          { key: "label", label: "Label", type: "text", required: true, placeholder: "Top Rated Specialist" },
          { key: "color", label: "Color (Hex or Tailwind)", type: "text", required: true, defaultValue: "#F59E0B" },
          { key: "icon", label: "Icon (Lucide name)", type: "text", required: true, defaultValue: "Star" },
          { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
        ]}
        columns={[
          { key: "label", label: "Badge" },
          { key: "key", label: "Key" },
          {
            key: "color",
            label: "Color",
            render: (row) => (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: `${row.color}20`, color: row.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                {row.color}
              </span>
            ),
          },
        ]}
      />
    )}
  </div>

      {/* Create / Edit modal */}
      <TalentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        saving={saving}
        badges={badges}
        specialties={specialties}
        createdCredentials={createdCredentials}
        copyCredentials={copyCredentials}
        copied={copied}
        generatePassword={() => setForm({ ...form, password: generateStrongPassword() })}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Reset password result */}
      <TalentPasswordModal
        result={resetResult}
        copied={copied}
        onCopy={copyCredentials}
        onClose={() => setResetResult(null)}
      />

      <ConfirmDialog
        open={Boolean(resetTarget)}
        title="Reset talent password?"
        description={
          <>
            A new password will be generated for <strong>{resetTarget?.user_email || resetTarget?.name}</strong>,
            emailed to them, and all their active sessions will be signed out.
          </>
        }
        confirmLabel="Reset Password"
        loading={saving}
        onCancel={() => setResetTarget(null)}
        onConfirm={handleResetPassword}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete talent?"
        description={
          <>
            <strong>{deleteTarget?.name}</strong> and their login account will be removed. Their mailboxes become
            disabled. This cannot be undone.
          </>
        }
        confirmLabel="Delete Talent"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

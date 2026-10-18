"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Search,
  ShieldCheck,
  UserCog,
  Check,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserItem {
  id: number;
  role: string;
  name: string;
  email: string;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at?: string | null;
  created_at: string;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  force_change_password: boolean;
  is_active: boolean;
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  password: "",
  force_change_password: true,
  is_active: true,
};

function generateStrongPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%&*";
  let out = "";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 14; i++) out += chars[bytes[i] % chars.length];
  return out;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "admin", per_page: "50" });
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(`/api/proxy/admin/users?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers(json.data?.data || []);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, password: generateStrongPassword() });
    setCreatedPassword(null);
    setModalOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      force_change_password: user.must_change_password,
      is_active: user.is_active,
    });
    setCreatedPassword(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const res = await fetch(`/api/proxy/admin/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, is_active: form.is_active }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
        toast.success("User updated");
        setModalOpen(false);
        fetchUsers();
      } else {
        const res = await fetch("/api/proxy/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: "admin",
            force_change_password: form.force_change_password,
            send_welcome_email: false,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Create failed");
        setCreatedPassword(json.data?.initial_password || form.password);
        toast.success("Account created", { description: "Copy the password and share it securely." });
        fetchUsers();
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
      const res = await fetch(`/api/proxy/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("User deleted");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/proxy/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, is_active: !user.is_active }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
      toast.success(user.is_active ? "Account deactivated" : "Account activated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update account");
    }
  };

  const copyPassword = () => {
    if (!createdPassword) return;
    navigator.clipboard.writeText(createdPassword);
    setCopied(true);
    toast.success("Password copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout role="admin" title="Users">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-ink-900 text-white">
                Access Control
              </span>
              <span className="text-[11px] font-semibold text-ink-500">Login accounts & status</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Admin Accounts</h1>
            <p className="text-sm text-ink-500 mt-1">
              Login accounts for the PayTrizz team. Talent accounts are created from the Talents page — each one
              provisions the login, public profile, and welcome email in a single step.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Admin Account</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-ink-50 border border-ink-100 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
          </div>
          <span className="text-xs text-ink-500 font-semibold px-2">
            {users.length} admin account(s)
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-ink-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <UserCog className="w-10 h-10 text-ink-300 mx-auto mb-3" />
              <p className="font-bold text-ink-700 text-sm">No admin accounts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50/60 border-b border-ink-100 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Last Login</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-ink-50/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-500 text-ink-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink-900">{u.name}</p>
                            <p className="text-[11px] text-ink-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                            u.role === "admin" ? "bg-ink-900 text-white" : "bg-brand-100 text-ink-900"
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => toggleActive(u)}
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer",
                            u.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-50 text-danger hover:bg-red-100"
                          )}
                          title={u.is_active ? "Click to deactivate" : "Click to activate"}
                        >
                          {u.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-ink-500">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
          <ShieldCheck className="w-5 h-5 text-ink-900 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-700 leading-relaxed">
            Admin accounts never get a talent profile or personal mailbox. Founder/CEO who also performs as a talent
            must use <strong>two separate accounts</strong> with different login emails.
          </p>
        </div>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-ink-900">
              {editing ? "Edit Account" : "New Admin Account"}
            </h3>

            {createdPassword ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <Check className="w-5 h-5" />
                    <span>Account created successfully</span>
                  </div>
                  <p className="text-xs text-ink-700">
                    Share this password securely. The user will be asked to change it on first login.
                  </p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-ink-200">
                    <span className="font-mono text-sm font-bold text-ink-900 flex-1 break-all">
                      {createdPassword}
                    </span>
                    <button
                      onClick={copyPassword}
                      className="p-1.5 rounded-lg bg-ink-100 hover:bg-brand-500 text-ink-700 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-2.5 bg-ink-900 text-white rounded-full text-xs font-bold hover:bg-black cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Personal Email (login) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                  />
                  <p className="text-[11px] text-ink-500 mt-1">
                    Personal email for login & notifications — not the @paytrizz.com mailbox.
                  </p>
                </div>

                {!editing && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                      Initial Password
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, password: generateStrongPassword() })}
                        className="px-3.5 py-2.5 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-900 font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                    <p className="text-[11px] text-ink-500 mt-1">Minimum 10 characters.</p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {!editing && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.force_change_password}
                        onChange={(e) => setForm({ ...form, force_change_password: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-ink-800">
                        Force password change on first login
                      </span>
                    </label>
                  )}
                  {editing && (
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-ink-800">Account active</span>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editing ? "Save Changes" : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete account?"
        description={
          <>
            <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) will be permanently removed. Talent
            profiles linked to this account are removed as well.
          </>
        }
        confirmLabel="Delete Account"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

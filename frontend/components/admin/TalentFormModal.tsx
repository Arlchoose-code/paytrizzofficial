"use client";

import { useState } from "react";
import {
  X,
  Check,
  Copy,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { ImagePickerDialog } from "@/components/shared/ImagePickerDialog";
import { cn } from "@/lib/utils";

export interface BadgeItem {
  id: number;
  label: string;
  color: string;
}

export interface SpecialtyItem {
  id: number;
  name: string;
}

export interface TalentItem {
  id: number;
  name: string;
  slug: string;
  headline: string;
  bio?: string;
  location?: string;
  years_experience?: number;
  hourly_rate_usd?: number | null;
  availability: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  user_email?: string;
  user_is_active?: boolean;
  user_last_login_at?: string | null;
  avatar_media_id?: number | null;
  avatar_media?: { path_thumb?: string; path_medium?: string; path_original?: string } | null;
  badges?: BadgeItem[];
  specialties?: SpecialtyItem[];
}

export interface TalentFormState {
  name: string;
  email: string;
  password: string;
  force_change_password: boolean;
  send_welcome_email: boolean;
  headline: string;
  bio: string;
  location: string;
  years_experience: number;
  availability: string;
  hourly_rate_usd: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  badge_ids: number[];
  specialty_ids: number[];
  avatar_media_id?: number | null;
  avatar_preview_url?: string;
}

interface TalentFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: TalentItem | null;
  form: TalentFormState;
  setForm: React.Dispatch<React.SetStateAction<TalentFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  badges: BadgeItem[];
  specialties: SpecialtyItem[];
  createdCredentials: { email: string; password: string } | null;
  copyCredentials: () => void;
  copied: boolean;
  generatePassword: () => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export function TalentFormModal({
  open,
  onClose,
  editing,
  form,
  setForm,
  onSubmit,
  saving,
  badges,
  specialties,
  createdCredentials,
  copyCredentials,
  copied,
  generatePassword,
  showPassword,
  setShowPassword,
}: TalentFormModalProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  if (!open) return null;

  const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter((i) => i !== id) : [...list, id];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-extrabold text-ink-900">
          {editing ? `Edit ${editing.name}` : "Onboard New Specialist"}
        </h3>

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-brand-50 border border-brand-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Check className="w-5 h-5" />
                <span>Account created successfully</span>
              </div>
              <p className="text-xs text-ink-700">
                Share these credentials securely. The talent must set a new password on first login.
              </p>
              <div className="bg-white p-3.5 rounded-xl border border-ink-200 space-y-1.5">
                <p className="text-[11px] text-ink-500">
                  Login email: <span className="font-bold text-ink-900">{createdCredentials.email}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-ink-900 flex-1 break-all">
                    {createdCredentials.password}
                  </span>
                  <button
                    onClick={copyCredentials}
                    className="p-1.5 rounded-lg bg-ink-100 hover:bg-brand-500 text-ink-700 transition cursor-pointer"
                    title="Copy credentials"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-ink-900 text-white rounded-full text-xs font-bold hover:bg-black cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Login Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="alex@paytrizz.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                  />
                </div>
              )}

              {editing && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Account Email
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editing.user_email || "Managed Account"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-xs text-ink-500 cursor-not-allowed"
                  />
                </div>
              )}
            </div>

            {/* Profile Photo / Avatar Picker Card */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
                Profile Photo (Avatar &amp; Directory Card)
              </label>
              <div className="flex items-center gap-4 p-3.5 rounded-2xl border border-ink-100 bg-ink-50/50">
                <div className="w-14 h-14 rounded-full border-2 border-brand-500/40 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {form.avatar_preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatar_preview_url}
                      alt={form.name || "Talent Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-extrabold text-ink-700">
                      {(form.name || "T").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImagePickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer shadow-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{form.avatar_preview_url ? "Change Photo" : "Upload / Select Photo"}</span>
                  </button>
                  {form.avatar_preview_url && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          avatar_media_id: null,
                          avatar_preview_url: "",
                        })
                      }
                      className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-danger hover:bg-red-50 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!editing && (
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-800">Initial Password</span>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Generate random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                    className="w-full px-3.5 py-2 rounded-xl border border-ink-200 bg-white text-xs font-mono text-ink-900 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.force_change_password}
                      onChange={(e) => setForm({ ...form, force_change_password: e.target.checked })}
                      className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Force password change on first login</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.send_welcome_email}
                      onChange={(e) => setForm({ ...form, send_welcome_email: e.target.checked })}
                      className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Send welcome email with credentials</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Headline <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="Senior Full Stack Engineer & Cloud Architect"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Availability
                </label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.hourly_rate_usd}
                  onChange={(e) => setForm({ ...form, hourly_rate_usd: e.target.value })}
                  placeholder="75"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Years Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.years_experience}
                  onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) || 0 })}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Jakarta, Indonesia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-6 p-3 rounded-xl bg-ink-50 border border-ink-100 text-xs">
                <label className="flex items-center gap-2 text-ink-800 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span>Published on Directory</span>
                </label>

                <label className="flex items-center gap-2 text-ink-800 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span>Featured Specialist</span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Bio / Summary
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Short professional summary..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              />
            </div>

            {/* Badges */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-2">
                Badges
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Admin only
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => {
                  const selected = form.badge_ids.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setForm({ ...form, badge_ids: toggleId(form.badge_ids, b.id) })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer",
                        selected
                          ? "border-ink-900 text-ink-900"
                          : "border-ink-200 text-ink-600 hover:border-ink-400"
                      )}
                      style={selected ? { backgroundColor: `${b.color}33` } : undefined}
                    >
                      {b.label}
                    </button>
                  );
                })}
                {badges.length === 0 && (
                  <span className="text-[11px] text-ink-400">
                    No badges defined yet — add some in Taxonomy.
                  </span>
                )}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-2">
                Specialties
              </label>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => {
                  const selected = form.specialty_ids.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, specialty_ids: toggleId(form.specialty_ids, s.id) })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer",
                        selected
                          ? "bg-brand-500 text-ink-900"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })}
                {specialties.length === 0 && (
                  <span className="text-[11px] text-ink-400">No specialties defined yet.</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
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
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Talent"}
              </button>
            </div>
          </form>
        )}
      </div>

      <ImagePickerDialog
        open={imagePickerOpen}
        title="Select Talent Profile Photo"
        module="talent"
        onSelect={(media) => {
          setForm({
            ...form,
            avatar_media_id: media.id,
            avatar_preview_url: media.path_medium || media.path_original,
          });
          setImagePickerOpen(false);
        }}
        onClose={() => setImagePickerOpen(false)}
      />
    </div>
  );
}

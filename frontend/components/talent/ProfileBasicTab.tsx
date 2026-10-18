"use client";

import { Upload, FileText, Mail, Image as ImageIcon } from "lucide-react";

interface ProfileBasicTabProps {
  avatarPreviewUrl: string;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingAvatar: boolean;
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cvFileName: string;
  cvInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingCV: boolean;
  handleCVFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  headline: string;
  setHeadline: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  hourlyRateUSD: number | "";
  setHourlyRateUSD: (v: number | "") => void;
  yearsExperience: number;
  setYearsExperience: (v: number) => void;
  availability: string;
  setAvailability: (v: string) => void;
  cvIsPublic: boolean;
  setCvIsPublic: (v: boolean) => void;
  contactEnabled: boolean;
  setContactEnabled: (v: boolean) => void;
}

export function ProfileBasicTab({
  avatarPreviewUrl,
  avatarInputRef,
  uploadingAvatar,
  handleAvatarFileChange,
  cvFileName,
  cvInputRef,
  uploadingCV,
  handleCVFileChange,
  headline,
  setHeadline,
  location,
  setLocation,
  hourlyRateUSD,
  setHourlyRateUSD,
  yearsExperience,
  setYearsExperience,
  availability,
  setAvailability,
  cvIsPublic,
  setCvIsPublic,
  contactEnabled,
  setContactEnabled,
}: ProfileBasicTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
        Identity, Photo &amp; Rates
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-neutral-50 border border-ink-100">
        <div className="flex items-center gap-4">
          <div className="w-20 h-24 rounded-2xl bg-ink-100 border-2 border-dashed border-ink-300 overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreviewUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-ink-400" />
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-ink-900">Profile Photo</p>
            <p className="text-[11px] text-ink-500">4:5 ratio · converted to WebP automatically</p>
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingAvatar ? "Uploading..." : avatarPreviewUrl ? "Replace Photo" : "Upload Photo"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-24 rounded-2xl bg-ink-100 border-2 border-dashed border-ink-300 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-ink-400" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-ink-900">CV Resume (PDF)</p>
            <p className="text-[11px] text-ink-500">
              {cvFileName ? `Current: ${cvFileName}` : "Upload PDF resume (max 5 MB)"}
            </p>
            <input
              type="file"
              ref={cvInputRef}
              accept="application/pdf"
              onChange={handleCVFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              disabled={uploadingCV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploadingCV ? "Uploading..." : cvFileName ? "Replace CV" : "Upload CV"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Professional Headline <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Senior Full-Stack Engineer & Cloud Architect"
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Jakarta, Indonesia (Remote)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Hourly Rate (USD)
          </label>
          <input
            type="number"
            value={hourlyRateUSD}
            onChange={(e) => setHourlyRateUSD(e.target.value ? Number(e.target.value) : "")}
            placeholder="e.g. 75"
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Years of Experience
          </label>
          <input
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Availability
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          >
            <option value="available">Available for new projects</option>
            <option value="limited">Limited (part-time)</option>
            <option value="unavailable">Unavailable (fully booked)</option>
          </select>
        </div>
      </div>

      {/* Visibility toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-ink-100">
        <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAFAFA] border border-ink-100 cursor-pointer">
          <span className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-ink-500" />
            <span>
              <span className="block text-xs font-bold text-ink-900">Public CV download</span>
              <span className="block text-[11px] text-ink-500">
                Show a Download CV button on your profile
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={cvIsPublic}
            onChange={(e) => setCvIsPublic(e.target.checked)}
            className="w-4 h-4 accent-brand-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAFAFA] border border-ink-100 cursor-pointer">
          <span className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-ink-500" />
            <span>
              <span className="block text-xs font-bold text-ink-900">Contact form enabled</span>
              <span className="block text-[11px] text-ink-500">
                Let visitors message you from your profile page
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            checked={contactEnabled}
            onChange={(e) => setContactEnabled(e.target.checked)}
            className="w-4 h-4 accent-brand-500 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

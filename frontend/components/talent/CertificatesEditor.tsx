"use client";

import React from "react";
import { Award, Plus, Trash2, ExternalLink } from "lucide-react";
import { ItemSkillsEditor, ItemMediaEditor, type ItemMediaAttachment } from "./ItemSkillsMediaEditor";

export interface CertificateItem {
  id?: number;
  name: string;
  issuing_org: string;
  issue_date?: string;
  expiration_date?: string | null;
  does_not_expire: boolean;
  credential_id?: string;
  credential_url?: string;
  skills?: string;
  media_url?: string;
  media?: string;
}

interface CertificatesEditorProps {
  certificates: CertificateItem[];
  onChange: (items: CertificateItem[]) => void;
}

function parseJSON<T>(str: any, fallback: T): T {
  if (!str) return fallback;
  if (typeof str !== "string") return str as T;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function CertificatesEditor({ certificates = [], onChange }: CertificatesEditorProps) {
  const addCertificate = () => {
    onChange([
      {
        name: "",
        issuing_org: "",
        issue_date: new Date().toISOString().slice(0, 7), // YYYY-MM
        expiration_date: null,
        does_not_expire: true,
        credential_id: "",
        credential_url: "",
        skills: "[]",
        media: "[]",
      },
      ...certificates,
    ]);
  };

  const removeCertificate = (idx: number) => {
    onChange(certificates.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof CertificateItem, value: any) => {
    const updated = [...certificates];
    (updated[idx] as any)[field] = value;
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
        <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-brand-600" />
          <span>Licenses & Certifications ({certificates.length})</span>
        </h3>
        <button
          type="button"
          onClick={addCertificate}
          className="text-xs font-bold text-ink-900 hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500/20 hover:bg-brand-500/30 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Certificate</span>
        </button>
      </div>

      <div className="space-y-4">
        {certificates.length === 0 ? (
          <p className="text-xs text-ink-400">
            No certifications added yet. Showcase your verified credentials, cloud certifications, and licenses.
          </p>
        ) : (
          certificates.map((cert, idx) => {
            const parsedSkills: string[] = parseJSON(cert.skills, []);
            const parsedMedia: ItemMediaAttachment[] = parseJSON(cert.media, []);

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-ink-50/50 border border-ink-200 space-y-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeCertificate(idx)}
                  className="absolute top-4 right-4 text-ink-400 hover:text-danger p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Delete certificate"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Name & Issuing Org */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      Certificate Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AWS Certified Solutions Architect - Professional"
                      value={cert.name}
                      onChange={(e) => updateItem(idx, "name", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      Issuing Organization *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amazon Web Services, Google Cloud, Coursera"
                      value={cert.issuing_org}
                      onChange={(e) => updateItem(idx, "issuing_org", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>
                </div>

                {/* Dates & Does not expire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">Issue Date</label>
                    <input
                      type="month"
                      value={cert.issue_date || ""}
                      onChange={(e) => updateItem(idx, "issue_date", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-ink-600 uppercase">Expiration Date</label>
                      <label className="flex items-center gap-1.5 text-[11px] text-ink-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cert.does_not_expire}
                          onChange={(e) => updateItem(idx, "does_not_expire", e.target.checked)}
                          className="accent-brand-500 rounded"
                        />
                        This credential does not expire
                      </label>
                    </div>
                    <input
                      type="month"
                      disabled={cert.does_not_expire}
                      value={cert.expiration_date || ""}
                      onChange={(e) => updateItem(idx, "expiration_date", e.target.value || null)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Credential ID & URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      Credential ID (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWS-PSA-123456"
                      value={cert.credential_id || ""}
                      onChange={(e) => updateItem(idx, "credential_id", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-ink-600 uppercase">
                        Credential URL (Verification Link)
                      </label>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://www.credly.com/badges/..."
                      value={cert.credential_url || ""}
                      onChange={(e) => updateItem(idx, "credential_url", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>
                </div>

                {/* Associated Skills */}
                <ItemSkillsEditor
                  skills={parsedSkills}
                  onChange={(newSkills) => updateItem(idx, "skills", JSON.stringify(newSkills))}
                  label="Associated Skills (e.g. AWS Architecture, Cloud Security)"
                />

                {/* Media Proofs */}
                <ItemMediaEditor
                  media={parsedMedia}
                  onChange={(newMedia) => updateItem(idx, "media", JSON.stringify(newMedia))}
                  label="Certificate Media / Proof (Upload badge image, PDF certificate, or link)"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

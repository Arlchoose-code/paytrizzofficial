"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ExperienceEditor, ExperienceItem } from "@/components/talent/ExperienceEditor";
import { EducationEditor, EducationItem } from "@/components/talent/EducationEditor";
import { toast } from "sonner";
import { Save, Briefcase, GraduationCap, RefreshCw, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "experience" | "education";

export default function TalentExperiencesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("experience");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Full profile snapshot so the PUT does not wipe other fields
  const [profileBase, setProfileBase] = useState<Record<string, any> | null>(null);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/proxy/talent/profile").then((r) => r.json());
        if (res?.data) {
          const t = res.data;
          setProfileBase(t);
          setExperiences(
            (t.experiences || []).map((exp: any) => ({
              id: exp.id,
              role_title: exp.role_title,
              company: exp.company,
              location: exp.location || "",
              start_date: exp.start_date || "2024-01-01",
              end_date: exp.end_date || null,
              is_current: exp.is_current ?? false,
              description: exp.description || "",
            }))
          );
          setEducations(
            (t.educations || []).map((edu: any) => ({
              id: edu.id,
              degree: edu.degree,
              institution: edu.institution,
              field_of_study: edu.field_of_study || "",
              start_year: edu.start_year || 2014,
              end_year: edu.end_year || null,
            }))
          );
        }
      } catch {
        toast.error("Failed to load your experience data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profileBase) return;
    setSaving(true);

    try {
      const payload = {
        headline: profileBase.headline,
        bio: profileBase.bio || "",
        location: profileBase.location || "",
        years_experience: profileBase.years_experience || 0,
        hourly_rate_usd: profileBase.hourly_rate_usd ?? null,
        avatar_media_id: profileBase.avatar_media_id ?? null,
        cv_media_id: profileBase.cv_media_id ?? null,
        cv_is_public: profileBase.cv_is_public ?? false,
        contact_enabled: profileBase.contact_enabled ?? true,
        availability: profileBase.availability || "available",
        specialty_ids: (profileBase.specialties || []).map((s: any) => s.id),
        skills: (profileBase.skills || []).map((s: any) => ({
          skill_id: s.skill_id,
          skill_name: s.skill_name,
          proficiency: s.proficiency,
          years: s.years,
        })),
        experiences: experiences.map((exp, idx) => ({
          role_title: exp.role_title,
          company: exp.company,
          location: exp.location,
          start_date: exp.start_date || "2024-01-01",
          end_date: exp.is_current ? null : exp.end_date,
          is_current: exp.is_current,
          description: exp.description,
          sort_order: idx + 1,
        })),
        educations: educations.map((edu, idx) => ({
          degree: edu.degree,
          institution: edu.institution,
          field_of_study: edu.field_of_study,
          start_year: Number(edu.start_year) || 2014,
          end_year: edu.end_year ? Number(edu.end_year) : null,
          sort_order: idx + 1,
        })),
        links: (profileBase.links || []).map((l: any, idx: number) => ({
          platform: l.platform,
          label: l.label,
          url: l.url,
          sort_order: idx + 1,
        })),
      };

      const res = await fetch("/api/proxy/talent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save");

      toast.success("Experience & education saved", {
        description: "Your public profile is updated immediately.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "experience" as TabType, label: "Work Experience", icon: Briefcase, count: experiences.length },
    { id: "education" as TabType, label: "Education", icon: GraduationCap, count: educations.length },
  ];

  return (
    <DashboardLayout role="talent" title="Experience & Education">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Timeline
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                Changes go live immediately and are audit-logged
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Experience & Education
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Build a credible timeline — clients see this on your public profile page.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading || !profileBase}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : "Save Timeline"}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-ink-50 rounded-2xl w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2",
                  activeTab === t.id ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                    activeTab === t.id ? "bg-ink-900 text-white" : "bg-ink-200 text-ink-700"
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-ink-100 p-16 text-center text-xs text-ink-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading your timeline...
          </div>
        ) : (
          <>
            {activeTab === "experience" && (
              <ExperienceEditor experiences={experiences} onChange={setExperiences} />
            )}
            {activeTab === "education" && (
              <EducationEditor educations={educations} onChange={setEducations} />
            )}
          </>
        )}

        {/* Locked info note */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-ink-50 border border-ink-100">
          <Lock className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-600 leading-relaxed">
            Badges and directory visibility are managed by the PayTrizz team. Email{" "}
            <a href="mailto:hello@paytrizz.com" className="font-bold text-ink-900 hover:underline">
              hello@paytrizz.com
            </a>{" "}
            if something looks wrong.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { toast } from "sonner";
import {
  Save,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Share2,
  RefreshCw,
  Lock,
  Eye,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExperienceEditor, ExperienceItem } from "@/components/talent/ExperienceEditor";
import { EducationEditor, EducationItem } from "@/components/talent/EducationEditor";
import { CertificatesEditor, CertificateItem } from "@/components/talent/CertificatesEditor";
import { ProfilePreviewCard } from "@/components/talent/ProfilePreviewCard";
import { ProfileSkillsTab, SkillItem, CatalogSkill } from "@/components/talent/ProfileSkillsTab";
import { ProfileLinksTab, LinkItem } from "@/components/talent/ProfileLinksTab";
import { ProfileBasicTab } from "@/components/talent/ProfileBasicTab";
import { ProfileBioTab } from "@/components/talent/ProfileBioTab";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";

type ProfileTab = "basic" | "bio" | "skills" | "experience" | "education" | "certificates" | "links";

const MAX_SPECIALTIES = 3;

function TalentProfileEditorContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: ProfileTab =
    tabParam === "experience" ||
    tabParam === "education" ||
    tabParam === "certificates" ||
    tabParam === "skills" ||
    tabParam === "bio" ||
    tabParam === "links"
      ? tabParam
      : "basic";

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [cvPickerOpen, setCvPickerOpen] = useState(false);

  const [avatarMediaId, setAvatarMediaId] = useState<number | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const [cvMediaId, setCvMediaId] = useState<number | null>(null);
  const [cvFileName, setCvFileName] = useState<string>("");
  const [cvIsPublic, setCvIsPublic] = useState(false);
  const [contactEnabled, setContactEnabled] = useState(true);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [hourlyRateUSD, setHourlyRateUSD] = useState<number | "">("");
  const [availability, setAvailability] = useState("available");
  const [specialtyIDs, setSpecialtyIDs] = useState<number[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [talentData, setTalentData] = useState<any>(null);
  const [allSpecialties, setAllSpecialties] = useState<any[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<CatalogSkill[]>([]);
  const [loginEmail, setLoginEmail] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, specRes, catalogRes] = await Promise.all([
          fetch("/api/proxy/talent/profile").then((r) => r.json()).catch(() => null),
          fetch("/api/proxy/specialties").then((r) => r.json()).catch(() => null),
          fetch("/api/proxy/talent/skills").then((r) => r.json()).catch(() => null),
        ]);

        if (specRes?.data) setAllSpecialties(specRes.data);
        if (catalogRes?.data) setSkillCatalog(catalogRes.data);

        if (profileRes?.data) {
          const t = profileRes.data;
          setTalentData(t);
          setLoginEmail(t.user_email || "");
          setHeadline(t.headline || "");
          setBio(t.bio || "");
          setLocation(t.location || "");
          setYearsExperience(t.years_experience || 0);
          setHourlyRateUSD(t.hourly_rate_usd ?? "");
          setAvailability(t.availability || "available");
          setCvIsPublic(Boolean(t.cv_is_public));
          setContactEnabled(t.contact_enabled ?? true);
          setSpecialtyIDs((t.specialties || []).map((s: any) => s.id));
          setSkills(t.skills || []);

          if (t.avatar_media) {
            setAvatarMediaId(t.avatar_media.id);
            setAvatarPreviewUrl(t.avatar_media.path_medium || t.avatar_media.path_original);
          } else if (t.avatar_media_id) {
            setAvatarMediaId(t.avatar_media_id);
          }

          if (t.cv_media) {
            setCvMediaId(t.cv_media.id);
            setCvFileName(t.cv_media.original_name || "Resume.pdf");
          } else if (t.cv_media_id) {
            setCvMediaId(t.cv_media_id);
          }

          setExperiences(
            (t.experiences || []).map((exp: any) => ({
              id: exp.id,
              role_title: exp.role_title,
              company: exp.company,
              employment_type: exp.employment_type || "Full-time",
              location: exp.location || "",
              start_date: exp.start_date || "2024-01-01",
              end_date: exp.end_date || null,
              is_current: exp.is_current ?? true,
              description: exp.description || "",
              skills: exp.skills || "[]",
              media: exp.media || "[]",
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
              grade: edu.grade || "",
              activities: edu.activities || "",
              description: edu.description || "",
              skills: edu.skills || "[]",
              media: edu.media || "[]",
            }))
          );
          setCertificates(
            (t.certificates || []).map((c: any) => ({
              id: c.id,
              name: c.name,
              issuing_org: c.issuing_org,
              issue_date: c.issue_date || "",
              expiration_date: c.expiration_date || null,
              does_not_expire: Boolean(c.does_not_expire),
              credential_id: c.credential_id || "",
              credential_url: c.credential_url || "",
              skills: c.skills || "[]",
              media_url: c.media_url || "",
              media: c.media || "[]",
            }))
          );
          setLinks(t.links || []);
        }
      } catch {
        toast.error("Failed to load your profile");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAvatarSelect = (media: PickedMedia) => {
    setAvatarMediaId(media.id);
    setAvatarPreviewUrl(media.path_medium || media.path_original || "");
    toast.success("Profile photo selected");
  };

  const handleCVSelect = (media: PickedMedia) => {
    setCvMediaId(media.id);
    setCvFileName(media.original_name || "Resume.pdf");
    toast.success("CV document selected");
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        headline,
        bio,
        location,
        years_experience: Number(yearsExperience) || 0,
        hourly_rate_usd: hourlyRateUSD !== "" ? Number(hourlyRateUSD) : null,
        avatar_media_id: avatarMediaId,
        cv_media_id: cvMediaId,
        cv_is_public: cvIsPublic,
        contact_enabled: contactEnabled,
        availability,
        specialty_ids: specialtyIDs,
        skills: skills.map((s) => ({
          skill_id: s.skill_id,
          skill_name: s.skill_name,
          proficiency: s.proficiency,
          years: s.years,
        })),
        experiences: experiences.map((exp, idx) => ({
          role_title: exp.role_title,
          company: exp.company,
          employment_type: exp.employment_type || "Full-time",
          location: exp.location,
          start_date: exp.start_date || "2024-01-01",
          end_date: exp.is_current ? null : exp.end_date,
          is_current: exp.is_current,
          description: exp.description,
          skills: exp.skills || "[]",
          media: exp.media || "[]",
          sort_order: idx + 1,
        })),
        educations: educations.map((edu, idx) => ({
          degree: edu.degree,
          institution: edu.institution,
          field_of_study: edu.field_of_study,
          start_year: Number(edu.start_year) || 2014,
          end_year: edu.end_year ? Number(edu.end_year) : null,
          grade: edu.grade || "",
          activities: edu.activities || "",
          description: edu.description || "",
          skills: edu.skills || "[]",
          media: edu.media || "[]",
          sort_order: idx + 1,
        })),
        certificates: certificates.map((c, idx) => ({
          name: c.name,
          issuing_org: c.issuing_org,
          issue_date: c.issue_date || null,
          expiration_date: c.does_not_expire ? null : c.expiration_date || null,
          does_not_expire: Boolean(c.does_not_expire),
          credential_id: c.credential_id || "",
          credential_url: c.credential_url || "",
          skills: c.skills || "[]",
          media_url: c.media_url || "",
          media: c.media || "[]",
          sort_order: idx + 1,
        })),
        links: links.map((l, idx) => ({
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
      if (!res.ok) throw new Error(json.message || "Failed to update profile");

      toast.success("Profile saved", {
        description: "Your public showcase changes are live immediately.",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (id: number) => {
    setSpecialtyIDs((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= MAX_SPECIALTIES) {
        toast.error(`Maximum ${MAX_SPECIALTIES} specialties (one primary + two more)`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const specialtiesById = useMemo(() => {
    const map = new Map<number, string>();
    allSpecialties.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [allSpecialties]);

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: "basic", label: "Basic & Media", icon: User },
    { id: "bio", label: "Bio & Specialties", icon: FileText },
    { id: "skills", label: "Skills", icon: Briefcase },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certificates", label: "Certifications", icon: Award },
    { id: "links", label: "Links", icon: Share2 },
  ];

  return (
    <DashboardLayout role="talent" title="Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Live Profile
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                Edits publish instantly and are audit-logged
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Edit Profile</h1>
            <p className="text-sm text-ink-500 mt-1">
              Photo, headline, bio, specialties, skills, credentials and links — everything clients see.
            </p>
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left: tabs + forms */}
          <div className="space-y-5 min-w-0">
            <div className="flex items-center gap-1.5 p-1 bg-ink-50 rounded-2xl overflow-x-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap",
                      active ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab: Basic */}
            {activeTab === "basic" && (
              <ProfileBasicTab
                avatarPreviewUrl={avatarPreviewUrl}
                onOpenAvatarPicker={() => setAvatarPickerOpen(true)}
                onRemoveAvatar={() => {
                  setAvatarMediaId(null);
                  setAvatarPreviewUrl("");
                }}
                cvFileName={cvFileName}
                onOpenCVPicker={() => setCvPickerOpen(true)}
                onRemoveCV={() => {
                  setCvMediaId(null);
                  setCvFileName("");
                }}
                headline={headline}
                setHeadline={setHeadline}
                location={location}
                setLocation={setLocation}
                hourlyRateUSD={hourlyRateUSD}
                setHourlyRateUSD={setHourlyRateUSD}
                yearsExperience={yearsExperience}
                setYearsExperience={setYearsExperience}
                availability={availability}
                setAvailability={setAvailability}
                cvIsPublic={cvIsPublic}
                setCvIsPublic={setCvIsPublic}
                contactEnabled={contactEnabled}
                setContactEnabled={setContactEnabled}
              />
            )}

            {/* Tab: Bio */}
            {activeTab === "bio" && (
              <ProfileBioTab
                bio={bio}
                setBio={setBio}
                allSpecialties={allSpecialties}
                specialtyIDs={specialtyIDs}
                toggleSpecialty={toggleSpecialty}
                maxSpecialties={MAX_SPECIALTIES}
              />
            )}

            {/* Tab: Skills */}
            {activeTab === "skills" && (
              <ProfileSkillsTab skills={skills} catalog={skillCatalog} onChange={setSkills} />
            )}

            {/* Tab: Experience */}
            {activeTab === "experience" && (
              <ExperienceEditor experiences={experiences} onChange={setExperiences} />
            )}

            {/* Tab: Education */}
            {activeTab === "education" && (
              <EducationEditor educations={educations} onChange={setEducations} />
            )}

            {/* Tab: Certifications */}
            {activeTab === "certificates" && (
              <CertificatesEditor certificates={certificates} onChange={setCertificates} />
            )}

            {/* Tab: Links */}
            {activeTab === "links" && (
              <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
                  Portfolio & Social Links
                </h3>
                <ProfileLinksTab links={links} setLinks={setLinks} />
              </div>
            )}
          </div>

          {/* Right: live preview (sticky) */}
          <div className="xl:sticky xl:top-6">
            <ProfilePreviewCard
              data={{
                name: talentData?.name || "",
                headline,
                location,
                yearsExperience: Number(yearsExperience) || 0,
                availability,
                avatarUrl: avatarPreviewUrl,
                specialties: specialtyIDs.map((id) => specialtiesById.get(id) || "").filter(Boolean),
                badges: talentData?.badges || [],
                isPublished: Boolean(talentData?.is_published),
                isFeatured: Boolean(talentData?.is_featured),
              }}
            />

            <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-ink-50 border border-ink-100">
              <Lock className="w-3.5 h-3.5 text-ink-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-600 leading-relaxed">
                Login email: <span className="font-bold text-ink-900">{loginEmail || "—"}</span>
                <br />
                Email changes are handled by admin.
              </p>
            </div>

            <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-2xl bg-brand-50 border border-brand-100">
              <Eye className="w-3.5 h-3.5 text-ink-900 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-ink-700 leading-relaxed">
                Profile edits go live immediately (no approval) and are recorded in the audit log.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Image Picker */}
      <ImagePickerDialog
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        title="Choose Profile Avatar"
        module="talent"
        libraryModule="talent"
        kind="image"
        onSelect={handleAvatarSelect}
      />

      {/* CV Document Picker */}
      <ImagePickerDialog
        open={cvPickerOpen}
        onClose={() => setCvPickerOpen(false)}
        title="Choose or Upload CV Document (PDF)"
        module="talent"
        libraryModule="talent"
        kind="document"
        onSelect={handleCVSelect}
      />
    </DashboardLayout>
  );
}

export default function TalentProfileEditorPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="talent" title="Edit Profile">
          <div className="p-12 text-center text-xs text-neutral-400">Loading profile...</div>
        </DashboardLayout>
      }
    >
      <TalentProfileEditorContent />
    </Suspense>
  );
}

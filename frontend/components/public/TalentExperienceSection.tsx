import React from "react";
import { Briefcase, GraduationCap, Award, ExternalLink, Image as ImageIcon, Paperclip } from "lucide-react";

interface MediaAttachment {
  id?: number;
  title: string;
  url: string;
  type?: string;
}

interface ExperienceItem {
  id: number;
  role_title: string;
  company: string;
  employment_type?: string | null;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
  skills?: string | null;
  media?: string | null;
}

interface EducationItem {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year?: number | null;
  grade?: string | null;
  activities?: string | null;
  description?: string | null;
  skills?: string | null;
  media?: string | null;
}

interface CertificateItem {
  id: number;
  name: string;
  issuing_org: string;
  issue_date?: string | null;
  expiration_date?: string | null;
  does_not_expire?: boolean;
  credential_id?: string | null;
  credential_url?: string | null;
  skills?: string | null;
  media_url?: string | null;
  media?: string | null;
}

interface TalentExperienceSectionProps {
  experiences?: ExperienceItem[];
  educations?: EducationItem[];
  certificates?: CertificateItem[];
}

function parseSkillsList(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseMediaList(raw?: string | null): MediaAttachment[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object" && item.url)
          .map((item) => ({
            id: item.id,
            title: item.title || "Attachment",
            url: item.url,
            type: item.type || "image",
          }));
      }
    } catch {}
  }
  return [];
}

function formatExpDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const d = new Date(year, month);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function TalentExperienceSection({
  experiences,
  educations,
  certificates,
}: TalentExperienceSectionProps) {
  const sortedExperiences = [...(experiences || [])].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    const timeA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const timeB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return timeB - timeA;
  });

  const sortedEducations = [...(educations || [])].sort((a, b) => {
    const endA = a.end_year || 9999;
    const endB = b.end_year || 9999;
    if (endB !== endA) return endB - endA;
    return b.start_year - a.start_year;
  });

  const sortedCertificates = [...(certificates || [])];

  return (
    <>
      {/* Work Experience */}
      {sortedExperiences.length > 0 && (
        <div id="experience" className="space-y-6">
          <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-brand-600" />
            <span>Work Experience</span>
          </h2>

          <div className="relative pl-6 border-l-2 border-brand-500 space-y-8">
            {sortedExperiences.map((exp) => {
              const skills = parseSkillsList(exp.skills);
              const media = parseMediaList(exp.media);

              return (
                <div key={exp.id} className="relative space-y-2.5">
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-ink-900 ring-4 ring-white" />
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">
                      {exp.role_title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <p className="text-sm font-semibold text-brand-600">
                        {exp.company} {exp.location ? `· ${exp.location}` : ""}
                      </p>
                      {exp.employment_type && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-ink-900 border border-brand-300">
                          {exp.employment_type}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 pt-0.5">
                      {formatExpDate(exp.start_date)} –{" "}
                      {exp.is_current ? "Present" : exp.end_date ? formatExpDate(exp.end_date) : "Present"}
                    </p>
                  </div>

                  {exp.description && (
                    <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line pt-0.5">
                      {exp.description}
                    </p>
                  )}

                  {/* Attached Skills */}
                  {skills.length > 0 && (
                    <div className="pt-1.5">
                      <p className="text-xs font-bold text-ink-800 mb-1.5">
                        Skills:{" "}
                        <span className="font-normal text-ink-600">
                          {skills.join(" · ")}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-ink-800 border border-neutral-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attached Media */}
                  {media.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-ink-800 mb-2">Media & Proofs:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {media.map((m, mIdx) => (
                          <a
                            key={mIdx}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-2.5 p-2 rounded-xl bg-white border border-neutral-200 hover:border-brand-500 hover:shadow-xs transition"
                          >
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center shrink-0">
                              {m.type === "image" || m.url.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.url}
                                  alt={m.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Paperclip className="w-4 h-4 text-neutral-400 group-hover:text-brand-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-ink-900 truncate group-hover:text-brand-600">
                                {m.title}
                              </p>
                              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                <span>View proof</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Licenses & Certifications */}
      {sortedCertificates.length > 0 && (
        <div id="certifications" className="space-y-6">
          <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-600" />
            <span>Licenses & Certifications</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedCertificates.map((cert) => {
              const skills = parseSkillsList(cert.skills);
              const media = parseMediaList(cert.media);

              return (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs hover:border-brand-300 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-ink-900 leading-snug">
                            {cert.name}
                          </h4>
                          <p className="text-sm font-semibold text-neutral-700">
                            {cert.issuing_org}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500">
                      {cert.issue_date ? `Issued ${formatExpDate(cert.issue_date)}` : "Verified Credential"}
                      {cert.does_not_expire
                        ? " · No Expiration Date"
                        : cert.expiration_date
                        ? ` · Expires ${formatExpDate(cert.expiration_date)}`
                        : ""}
                    </p>

                    {cert.credential_id && (
                      <p className="text-xs text-neutral-500 font-mono">
                        Credential ID: <span className="font-semibold text-ink-800">{cert.credential_id}</span>
                      </p>
                    )}

                    {/* Attached Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 text-ink-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Attached Media / Proofs */}
                    {media.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {media.map((m, mIdx) => (
                          <a
                            key={mIdx}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-brand-500 text-xs font-semibold text-ink-800 hover:text-brand-600 transition"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="truncate max-w-[140px]">{m.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {cert.credential_url && (
                    <div className="pt-2 border-t border-neutral-100">
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-xs"
                      >
                        <span>Show credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Education */}
      {sortedEducations.length > 0 && (
        <div id="education" className="space-y-6">
          <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            <span>Education</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedEducations.map((edu) => {
              const skills = parseSkillsList(edu.skills);
              const media = parseMediaList(edu.media);

              return (
                <div
                  key={edu.id}
                  className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-ink-900">
                      {edu.degree} in {edu.field_of_study}
                    </h4>
                    <p className="text-sm font-semibold text-ink-700">{edu.institution}</p>
                    <p className="text-xs text-ink-500">
                      Class of {edu.start_year} {edu.end_year ? `– ${edu.end_year}` : ""}
                    </p>

                    {edu.grade && (
                      <p className="text-xs font-semibold text-brand-700">
                        Grade: <span className="font-normal text-ink-800">{edu.grade}</span>
                      </p>
                    )}

                    {edu.activities && (
                      <p className="text-xs text-ink-700">
                        <span className="font-semibold text-ink-900">Activities and societies: </span>
                        {edu.activities}
                      </p>
                    )}

                    {edu.description && (
                      <p className="text-xs text-ink-600 whitespace-pre-line leading-relaxed pt-1">
                        {edu.description}
                      </p>
                    )}

                    {/* Attached Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-ink-800 border border-neutral-200"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Attached Media */}
                    {media.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {media.map((m, mIdx) => (
                          <a
                            key={mIdx}
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-brand-500 text-xs font-semibold text-ink-800 hover:text-brand-600 transition"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="truncate max-w-[130px]">{m.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

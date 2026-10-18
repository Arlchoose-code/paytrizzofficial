import { Briefcase, GraduationCap } from "lucide-react";

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
}

interface EducationItem {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year?: number | null;
}

interface TalentExperienceSectionProps {
  experiences?: ExperienceItem[];
  educations?: EducationItem[];
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
            {sortedExperiences.map((exp) => (
              <div key={exp.id} className="relative space-y-2">
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
                    {formatExpDate(exp.start_date)} – {exp.is_current ? "Present" : exp.end_date ? formatExpDate(exp.end_date) : "Present"}
                  </p>
                </div>
                {exp.description && (
                  <p className="text-sm text-ink-700 leading-relaxed pt-1">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
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
            {sortedEducations.map((edu) => (
              <div
                key={edu.id}
                className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-1.5"
              >
                <h4 className="text-base font-bold text-ink-900">
                  {edu.degree} in {edu.field_of_study}
                </h4>
                <p className="text-sm font-semibold text-ink-700">{edu.institution}</p>
                <p className="text-xs text-ink-500">
                  Class of {edu.start_year} {edu.end_year ? `– ${edu.end_year}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

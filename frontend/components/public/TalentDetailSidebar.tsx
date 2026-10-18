import { Mail, Download } from "lucide-react";

interface TalentDetailSidebarProps {
  talent: {
    name: string;
    hourly_rate_usd?: number | string | null;
    availability?: string;
    location?: string | null;
    years_experience?: number;
    projects?: any[];
    posts?: any[];
    cv_is_public?: boolean;
    cv_media?: {
      path_file?: string;
      path_original?: string;
    } | null;
  };
}

export function TalentDetailSidebar({ talent }: TalentDetailSidebarProps) {
  return (
    <div className="lg:col-span-4 sticky top-24 space-y-6">
      <div className="bg-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            Engagement Rate
          </span>
          <div className="text-3xl font-extrabold text-ink-900">
            {talent.hourly_rate_usd ? `$${talent.hourly_rate_usd}/hr` : "Custom Scope"}
          </div>
          <p className="text-xs text-ink-500">
            Sprint milestone or full-time monthly retainer
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Status</span>
            <span className="font-semibold text-ink-900 capitalize">{talent.availability}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Location</span>
            <span className="font-semibold text-ink-900">{talent.location || "Remote"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Experience</span>
            <span className="font-semibold text-ink-900">{talent.years_experience} Years</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Portfolio</span>
            <span className="font-semibold text-ink-900">{talent.projects?.length || 0} Shipped Works</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">Articles</span>
            <span className="font-semibold text-ink-900">{talent.posts?.length || 0} Published</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <a
            href="#contact"
            className="w-full py-3.5 inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold rounded-full hover:bg-brand-600 transition-all text-sm shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Hire {talent.name}</span>
          </a>

          {talent.cv_is_public && talent.cv_media && (
            <a
              href={talent.cv_media.path_file || talent.cv_media.path_original}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 inline-flex items-center justify-center gap-2 bg-white text-ink-900 border border-neutral-300 font-semibold rounded-full hover:bg-neutral-100 transition-colors text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Resume (PDF)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

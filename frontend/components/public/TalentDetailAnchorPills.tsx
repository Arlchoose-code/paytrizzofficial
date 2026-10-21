"use client";

import React from "react";
import { ArrowRight, BookOpen, FolderGit2 } from "lucide-react";

interface TalentDetailAnchorPillsProps {
  talentName?: string;
  contactEnabled: boolean;
  projectsCount: number;
  articlesCount: number;
  hasSkills: boolean;
  hasExperiences: boolean;
  hasCertificates?: boolean;
}

export function TalentDetailContactButton({
  talentName,
  contactEnabled,
}: {
  talentName: string;
  contactEnabled: boolean;
}) {
  if (!contactEnabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", "#contact");
      }
    }
  };

  const firstName = talentName ? talentName.trim().split(" ")[0] : "Talent";

  return (
    <a
      href="#contact"
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-5 sm:px-7 py-3 rounded-full text-sm hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] active:scale-[0.98] cursor-pointer max-w-full"
      title={`Contact ${talentName}`}
    >
      <span className="truncate">Contact {firstName}</span>
      <ArrowRight className="w-4 h-4 flex-shrink-0" />
    </a>
  );
}

export function TalentDetailAnchorPills({
  contactEnabled,
  projectsCount,
  articlesCount,
  hasSkills,
  hasExperiences,
  hasCertificates,
}: TalentDetailAnchorPillsProps) {
  const smoothScrollTo = (targetId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  return (
    <div className="pt-4 flex flex-wrap items-center gap-2 border-t border-brand-200/60">
      <a
        href="#about"
        onClick={smoothScrollTo("about")}
        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
      >
        Overview
      </a>
      <a
        href="#projects"
        onClick={smoothScrollTo("projects")}
        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600 hover:bg-brand-600 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <FolderGit2 className="w-3.5 h-3.5" />
        <span>Projects ({projectsCount})</span>
      </a>
      <a
        href="#articles"
        onClick={smoothScrollTo("articles")}
        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600 hover:bg-brand-600 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Articles ({articlesCount})</span>
      </a>
      {hasSkills && (
        <a
          href="#skills"
          onClick={smoothScrollTo("skills")}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
        >
          Tech Stack
        </a>
      )}
      {hasExperiences && (
        <a
          href="#experience"
          onClick={smoothScrollTo("experience")}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
        >
          Experience
        </a>
      )}
      {hasCertificates && (
        <a
          href="#certifications"
          onClick={smoothScrollTo("certifications")}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
        >
          Certifications
        </a>
      )}
      {contactEnabled && (
        <a
          href="#contact"
          onClick={smoothScrollTo("contact")}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs cursor-pointer"
        >
          Contact
        </a>
      )}
    </div>
  );
}

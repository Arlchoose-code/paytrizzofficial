"use client";

import { useEffect, useState } from "react";

export interface StatsBandProps {
  initialTalentsCount?: number;
  initialProjectsCount?: number;
  initialSpecialtiesCount?: number;
  clientSatisfaction?: string;
}

export function StatsBand({
  initialTalentsCount = 3,
  initialProjectsCount = 3,
  initialSpecialtiesCount = 6,
  clientSatisfaction = "4.9/5",
}: StatsBandProps) {
  const [talentsCount, setTalentsCount] = useState<number>(initialTalentsCount);
  const [projectsCount, setProjectsCount] = useState<number>(initialProjectsCount);
  const [specialtiesCount, setSpecialtiesCount] = useState<number>(initialSpecialtiesCount);

  useEffect(() => {
    // Dynamic real-time fetch from existing public APIs via Next.js proxy
    Promise.all([
      fetch("/api/proxy/talents?per_page=1")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/proxy/projects?per_page=1")
        .then((r) => r.json())
        .catch(() => null),
      fetch("/api/proxy/specialties")
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([talentsRes, projectsRes, specialtiesRes]) => {
      if (talentsRes?.data?.total !== undefined) {
        setTalentsCount(talentsRes.data.total);
      }
      if (projectsRes?.data?.total !== undefined) {
        setProjectsCount(projectsRes.data.total);
      }
      if (Array.isArray(specialtiesRes?.data)) {
        setSpecialtiesCount(specialtiesRes.data.length);
      }
    });
  }, []);

  return (
    <section className="px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-20">
      <div className="max-w-[1200px] mx-auto bg-brand-500 text-ink-900 rounded-[28px] sm:rounded-[36px] p-8 sm:p-12 shadow-[0_16px_50px_rgba(252,207,0,0.30)] border border-brand-600/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-ink-900/15">
          <div className="pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-black text-ink-900 tracking-tight">
              {talentsCount}+
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-900/80 mt-1.5">
              Vetted Talents
            </p>
          </div>

          <div className="pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-black text-ink-900 tracking-tight">
              {projectsCount}+
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-900/80 mt-1.5">
              Projects Delivered
            </p>
          </div>

          <div className="pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-black text-ink-900 tracking-tight">
              {specialtiesCount}
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-900/80 mt-1.5">
              Core Specialties
            </p>
          </div>

          <div className="pt-4 md:pt-0">
            <span className="text-4xl sm:text-5xl font-black text-ink-900 tracking-tight">
              {clientSatisfaction}
            </span>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-900/80 mt-1.5">
              Client Satisfaction
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

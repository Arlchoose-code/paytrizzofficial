"use client";

import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface LinkItem {
  id?: number;
  platform: string;
  label: string;
  url: string;
}

interface ProfileLinksTabProps {
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
}

export function ProfileLinksTab({ links, setLinks }: ProfileLinksTabProps) {
  const [newPlatform, setNewPlatform] = useState("github");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const handleAddLink = () => {
    if (!newUrl.trim()) {
      toast.error("Please enter a link URL");
      return;
    }
    try {
      new URL(newUrl);
    } catch {
      toast.error("Invalid URL format (include https://)");
      return;
    }
    setLinks([{ platform: newPlatform, label: newLabel.trim(), url: newUrl.trim() }, ...links]);
    setNewLabel("");
    setNewUrl("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select
          value={newPlatform}
          onChange={(e) => setNewPlatform(e.target.value)}
          className="px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70 bg-white"
        >
          <option value="github">GitHub</option>
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">X / Twitter</option>
          <option value="blogger">Blogger</option>
          <option value="medium">Medium</option>
          <option value="youtube">YouTube</option>
          <option value="threads">Threads</option>
          <option value="tiktok">TikTok</option>
          <option value="substack">Substack</option>
          <option value="telegram">Telegram</option>
          <option value="discord">Discord</option>
          <option value="gitlab">GitLab</option>
          <option value="dribbble">Dribbble</option>
          <option value="behance">Behance</option>
          <option value="portfolio">Portfolio</option>
          <option value="website">Personal Website</option>
          <option value="other">Other</option>
        </select>
        <input
          type="text"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70 bg-white"
        >
        </input>
        <input
          type="url"
          placeholder="https://..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70 bg-white"
        >
        </input>
        <button
          type="button"
          onClick={handleAddLink}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition cursor-pointer"
        >
          + Add Link
        </button>
      </div>

      <div className="space-y-2">
        {links.map((l, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-neutral-50 border border-ink-100 flex items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-bold text-ink-900 capitalize">{l.platform}</span>
              <span className="text-ink-500">{l.label}</span>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 hover:underline flex items-center gap-1 font-mono text-[11px] truncate"
              >
                <span className="truncate">{l.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <button
              type="button"
              onClick={() => setLinks(links.filter((_, i) => i !== idx))}
              className="text-ink-400 hover:text-danger cursor-pointer flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-4">
            No links yet. Add your GitHub, LinkedIn or portfolio.
          </p>
        )}
      </div>
    </div>
  );
}

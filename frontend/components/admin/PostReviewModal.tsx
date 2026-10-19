"use client";

import React from "react";
import { X, Check, Edit2, ExternalLink, BookOpen, Clock, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostItem } from "./PostFormModal";

interface PostReviewModalProps {
  post: PostItem | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (post: PostItem) => Promise<void>;
  onEdit?: (post: PostItem) => void;
  approving?: boolean;
}

export function PostReviewModal({
  post,
  open,
  onClose,
  onApprove,
  onEdit,
  approving = false,
}: PostReviewModalProps) {
  if (!open || !post) return null;

  const coverUrl =
    post.cover_media?.path_original ||
    post.cover_media?.path_medium ||
    post.cover_media?.path_thumb;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl border border-neutral-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-ink-900 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-ink-900">
                  Editorial Article Review
                </span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                    post.status === "published" && "bg-green-100 text-green-800 border border-green-200",
                    post.status === "pending" && "bg-amber-100 text-amber-900 border border-amber-300",
                    post.status === "draft" && "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  )}
                >
                  {post.status === "pending" ? "Awaiting Admin Approval" : post.status}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Review article copy, formatting, author credentials, and cover image before live publishing.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-ink-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Article Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-neutral-50/50">
          {/* Cover Media */}
          {coverUrl && (
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Meta */}
          <div className="space-y-3 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full font-bold bg-brand-500 text-ink-900">
                {post.category?.name || "General"}
              </span>
              <span className="flex items-center gap-1 text-neutral-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.reading_minutes || 3} min read</span>
              </span>
              <span className="text-neutral-400">·</span>
              <span className="font-mono text-neutral-400 text-[11px]">
                /blog/{post.slug}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink-900 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-sm font-medium text-neutral-600 italic border-l-2 border-brand-500 pl-3">
                &ldquo;{post.excerpt}&rdquo;
              </p>
            )}

            {/* Author Card */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-ink-900 font-bold flex items-center justify-center border border-brand-200 shrink-0">
                  {post.author_talent?.name ? (
                    post.author_talent.name.charAt(0)
                  ) : (
                    <User className="w-5 h-5 text-ink-700" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-ink-900">
                    {post.author_talent?.name || "PayTrizz Editorial"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {post.author_talent?.headline || "Verified Talent Specialist"}
                  </div>
                </div>
              </div>

              {post.author_talent && (
                <a
                  href={`/talents/${post.author_talent.slug || ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <span>View Author Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Formatted Article Body */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-100">
              Formatted Article Content
            </h3>
            <div
              className="prose prose-neutral max-w-none text-ink-900 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <span>Tagged:</span>
              </span>
              {post.tags.map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-0.5 rounded-md bg-neutral-100 text-ink-800 text-xs font-semibold"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 border-t border-neutral-200 bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(post);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold border border-neutral-200 hover:border-neutral-300 bg-white text-ink-800 transition shadow-xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Edit Article</span>
              </button>
            )}

            {post.status === "published" && (
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold bg-neutral-900 text-white hover:bg-ink-800 transition shadow-xs cursor-pointer"
              >
                <span>View Live</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {post.status === "pending" && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(post)}
                disabled={approving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{approving ? "Publishing..." : "Approve & Publish Live"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

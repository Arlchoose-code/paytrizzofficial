"use client";

import { CheckCircle2, XCircle, Clock, X } from "lucide-react";

export interface RevisionItem {
  id: number;
  entity_type: "project" | "post";
  entity_id: number;
  submitted_by: number;
  payload: Record<string, any>;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: number | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  submitter?: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewer?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface RevisionDetail {
  revision: RevisionItem;
  payload: Record<string, any>;
  live_content?: Record<string, any> | null;
}

interface RevisionInspectionModalProps {
  selectedRevision: RevisionItem | null;
  detailData: RevisionDetail | null;
  loadingDetail: boolean;
  reviewNote: string;
  setReviewNote: (note: string) => void;
  actionLoading: boolean;
  onClose: () => void;
  onReviewAction: (status: "approved" | "rejected") => void;
}

export function RevisionInspectionModal({
  selectedRevision,
  detailData,
  loadingDetail,
  reviewNote,
  setReviewNote,
  actionLoading,
  onClose,
  onReviewAction,
}: RevisionInspectionModalProps) {
  if (!selectedRevision) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-ink-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-ink-100 flex items-center justify-between bg-ink-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
                {selectedRevision.entity_type} Revision #{selectedRevision.id}
              </span>
              <span className="text-xs text-ink-500">
                Submitted by <strong>{selectedRevision.submitter?.name}</strong> (
                {selectedRevision.submitter?.email})
              </span>
            </div>
            <h2 className="text-xl font-black text-ink-900">Side-by-Side Comparison</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink-400 hover:text-ink-900 rounded-full hover:bg-ink-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Diff Canvas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingDetail ? (
            <div className="py-16 text-center text-ink-400 flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 animate-spin text-brand-500" />
              <p className="text-xs font-medium">Loading diff snapshot...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Version Column */}
                <div className="bg-ink-50 rounded-2xl p-5 border border-ink-100 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-ink-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Current Live Version
                    </span>
                    <span className="text-xs font-mono text-ink-400">
                      ID: {selectedRevision.entity_id}
                    </span>
                  </div>

                  {detailData?.live_content ? (
                    <div className="space-y-4 text-xs text-ink-800">
                      <div>
                        <span className="font-bold text-ink-500 uppercase tracking-wider block text-[10px]">
                          Title
                        </span>
                        <p className="font-semibold text-sm mt-0.5 text-ink-900">
                          {detailData.live_content.title}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-ink-500 uppercase tracking-wider block text-[10px]">
                          Excerpt
                        </span>
                        <p className="mt-0.5 text-ink-700 leading-relaxed">
                          {detailData.live_content.excerpt}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-ink-500 uppercase tracking-wider block text-[10px]">
                          Status
                        </span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-ink-200 text-ink-800 font-bold">
                          {detailData.live_content.status}
                        </span>
                      </div>
                      {detailData.live_content.content && (
                        <div>
                          <span className="font-bold text-ink-500 uppercase tracking-wider block text-[10px]">
                            Content Body
                          </span>
                          <div
                            className="mt-1 p-3 bg-white rounded-xl border border-ink-200 max-h-48 overflow-y-auto text-[11px] prose prose-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: detailData.live_content.content,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-ink-400 text-xs">
                      No active live version found (Entity may be newly drafted).
                    </div>
                  )}
                </div>

                {/* Proposed Revision Column */}
                <div className="bg-brand-50/40 rounded-2xl p-5 border border-brand-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-900">
                      Proposed Changes (Payload)
                    </span>
                    <span className="text-xs font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">
                      Pending Approval
                    </span>
                  </div>

                  <div className="space-y-4 text-xs text-ink-800">
                    {Object.entries(selectedRevision.payload || {}).map(([key, val]) => (
                      <div key={key}>
                        <span className="font-bold text-brand-700 uppercase tracking-wider block text-[10px]">
                          {key.replace(/_/g, " ")}
                        </span>
                        {key === "content" ? (
                          <div
                            className="mt-1 p-3 bg-white rounded-xl border border-brand-200 max-h-48 overflow-y-auto text-[11px] prose prose-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: String(val) }}
                          />
                        ) : typeof val === "object" ? (
                          <pre className="mt-1 p-2 bg-white rounded-xl border border-brand-200 font-mono text-[10px] overflow-x-auto">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          <p className="font-semibold text-sm mt-0.5 text-ink-900 bg-white/80 p-2 rounded-lg border border-brand-100">
                            {String(val)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Note Box */}
              <div className="bg-ink-50 rounded-2xl p-4 border border-ink-100">
                <label className="block text-xs font-bold text-ink-700 mb-1.5">
                  Review Note / Feedback (sent to submitter)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  disabled={selectedRevision.status !== "pending"}
                  rows={2}
                  placeholder="Add reason for rejection or approval remarks..."
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-6 border-t border-ink-100 bg-ink-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs transition"
          >
            Close
          </button>

          {selectedRevision.status === "pending" ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onReviewAction("rejected")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-danger border border-red-200 font-bold text-xs transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject Revision
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onReviewAction("approved")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm hover:shadow disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Apply Live
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-ink-500">
              Reviewed by {selectedRevision.reviewer?.name || "Admin"} (Status: {selectedRevision.status})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<FAQItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/faqs");
      const json = await res.json();
      if (res.ok && json.data) {
        setFaqs(json.data || []);
      } else {
        toast.error("Failed to load FAQs");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setSortOrder(faqs.length + 1);
    setIsPublished(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (f: FAQItem) => {
    setEditingFaq(f);
    setQuestion(f.question);
    setAnswer(f.answer);
    setSortOrder(f.sort_order);
    setIsPublished(f.is_published);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        question,
        answer,
        sort_order: Number(sortOrder),
        is_published: isPublished,
      };

      let res: Response;
      if (editingFaq) {
        res = await fetch(`/api/proxy/admin/faqs/${editingFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/proxy/admin/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (res.ok) {
        toast.success(editingFaq ? "FAQ updated" : "FAQ created");
        setModalOpen(false);
        fetchFaqs();
      } else {
        toast.error(json.message || "Failed to save FAQ");
      }
    } catch {
      toast.error("Error saving FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/proxy/admin/faqs/${deletingFaq.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("FAQ deleted");
        setDeleteDialogOpen(false);
        setDeletingFaq(null);
        fetchFaqs();
      } else {
        toast.error(json.message || "Failed to delete FAQ");
      }
    } catch {
      toast.error("Error deleting FAQ");
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveFaq = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const currentFaq = faqs[index];
    const targetFaq = faqs[targetIndex];

    const currentOrder = currentFaq.sort_order;
    const targetOrder = targetFaq.sort_order;

    try {
      await Promise.all([
        fetch(`/api/proxy/admin/faqs/${currentFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentFaq.question,
            answer: currentFaq.answer,
            sort_order: targetOrder,
            is_published: currentFaq.is_published,
          }),
        }),
        fetch(`/api/proxy/admin/faqs/${targetFaq.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: targetFaq.question,
            answer: targetFaq.answer,
            sort_order: currentOrder,
            is_published: targetFaq.is_published,
          }),
        }),
      ]);

      toast.success("FAQ order updated");
      fetchFaqs();
    } catch {
      toast.error("Failed to reorder FAQs");
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin" title="FAQs | PayTrizz">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Knowledge Base
              </span>
              <span className="text-xs text-ink-500 font-medium">Public Q&amp;A</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">FAQ Management</h1>
            <p className="text-xs text-ink-500">
              Manage frequently asked questions displayed on the homepage and about page.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchFaqs}
              className="p-2 rounded-xl bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 transition shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-bold hover:bg-brand-400 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
            />
          </div>
          <span className="text-xs font-bold text-ink-500 whitespace-nowrap">
            {filteredFaqs.length} items
          </span>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center text-ink-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-ink-400" />
              Loading FAQs...
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center text-ink-500 font-medium">
              No FAQs found. Click &quot;Add FAQ&quot; to create one.
            </div>
          ) : (
            filteredFaqs.map((f, idx) => {
              const isExpanded = expandedId === f.id;
              return (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs transition hover:border-ink-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-ink-100 text-ink-800">
                          #{f.sort_order}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase",
                            f.is_published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-ink-100 text-ink-600"
                          )}
                        >
                          {f.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <h3
                        onClick={() => setExpandedId(isExpanded ? null : f.id)}
                        className="text-base font-bold text-ink-900 cursor-pointer flex items-center justify-between group"
                      >
                        <span className="group-hover:text-brand-600 transition">{f.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-ink-400 flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-ink-400 flex-shrink-0 ml-2" />
                        )}
                      </h3>
                      {isExpanded && (
                        <p className="text-xs text-ink-600 pt-2 border-t border-ink-100 leading-relaxed">
                          {f.answer}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveFaq(idx, "up")}
                        className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === filteredFaqs.length - 1}
                        onClick={() => handleMoveFaq(idx, "down")}
                        className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingFaq(f);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-ink-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                <h3 className="text-base font-black text-ink-900">
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-ink-400 hover:text-ink-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Question</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How does PayTrizz vet specialists?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Answer</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detailed explanation..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPublishedFaq"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isPublishedFaq" className="text-xs font-bold text-ink-900 cursor-pointer">
                    Publish FAQ (Visible to visitors)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-bold hover:bg-brand-400 disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save FAQ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Dialog */}
        {deleteDialogOpen && deletingFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-ink-100 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 rounded-2xl bg-red-50">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">Delete FAQ</h3>
                  <p className="text-xs text-ink-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-ink-700">
                Are you sure you want to remove &quot;<strong>{deletingFaq.question}</strong>&quot;?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

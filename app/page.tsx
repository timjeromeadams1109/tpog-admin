"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase, type AppContent } from "@/lib/supabase";
import { useToast } from "@/lib/toast-context";
import {
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SCOPES = [
  "all",
  "global",
  "home",
  "chat",
  "community",
  "events",
  "exhibitors",
  "give",
  "live",
  "members",
  "more",
  "notes",
  "podcasts",
  "prayer",
  "profile",
  "schedule",
  "settings",
  "social",
  "vod",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AdminPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AppContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScope, setSelectedScope] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editKey, setEditKey] = useState("");

  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("app_content").select("*").order("scope").order("key");

      if (selectedScope !== "all") {
        query = query.eq("scope", selectedScope);
      }

      const { data: result, error } = await query;

      if (error) throw error;

      let filtered = result || [];

      if (searchTerm) {
        filtered = filtered.filter(
          (item) =>
            item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setData(filtered);
    } catch (error) {
      console.error("Error loading data:", error);
      toast("Failed to load content", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedScope, searchTerm, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (item: AppContent) => {
    setEditingId(`${item.scope}-${item.key}`);
    setEditScope(item.scope);
    setEditKey(item.key);
    setEditValue(item.value);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: editScope,
          key: editKey,
          value: editValue,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save");
      }

      toast("✓ Saved successfully", "success");
      setShowModal(false);
      setEditingId(null);
      await loadData();
    } catch (error) {
      console.error("Error saving:", error);
      toast(
        error instanceof Error ? error.message : "Failed to save changes",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: AppContent) => {
    if (!confirm(`Delete ${item.key}?`)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: item.scope,
          key: item.key,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast("Deleted successfully", "success");
      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast("Failed to delete", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">App Content Manager</h1>
              <p className="text-slate-400">Edit app content. Changes appear within 10 seconds.</p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by key or value..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedScope}
              onChange={(e) => {
                setSelectedScope(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
            >
              {SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {scope === "all" ? "All scopes" : scope}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-400">{data.length} items</p>
        </motion.div>

        {/* Table */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No content found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Scope</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Key</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-slate-300">Value</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item, idx) => (
                      <tr
                        key={`${item.scope}-${item.key}`}
                        className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.scope}</td>
                        <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.key}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 max-w-sm truncate">
                          {item.value}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              disabled={saving}
                              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={saving}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Edit Content</h2>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Scope</label>
                <input
                  type="text"
                  value={editScope}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Key</label>
                <input
                  type="text"
                  value={editKey}
                  disabled
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Value</label>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={saving}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

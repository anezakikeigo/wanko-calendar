"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiaryEntry } from "@/lib/types";
import DiaryForm from "./DiaryForm";

type Props = { initialEntries: DiaryEntry[] };

export default function DiaryList({ initialEntries }: Props) {
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries);
  const [editTarget, setEditTarget] = useState<DiaryEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const supabase = createClient();

  function handleOpenNew() {
    const today = new Date().toISOString().slice(0, 10);
    const exists = entries.find((e) => e.date === today);
    if (exists) {
      setEditTarget(exists);
    } else {
      setNewDate(today);
      setEditTarget(null);
    }
    setShowForm(true);
  }

  function handleSaved(entry: DiaryEntry) {
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === entry.id);
      if (exists) return prev.map((e) => (e.id === entry.id ? entry : e));
      return [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
    setShowForm(false);
    setEditTarget(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("この日記を削除しますか？")) return;
    await supabase.from("diary_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleOpenNew}
        className="w-full py-4 border-2 border-dashed border-amber-300 rounded-2xl text-amber-500 font-semibold hover:bg-amber-50 transition-colors"
      >
        ＋ 今日の日記を書く
      </button>

      {entries.map((entry) => (
        <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-stone-600 text-sm">
              {entry.date.replace(/-/g, "/")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditTarget(entry); setShowForm(true); }}
                className="text-xs px-2 py-1 bg-stone-100 rounded-lg text-stone-500 hover:bg-stone-200"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-xs px-2 py-1 bg-red-50 rounded-lg text-red-400 hover:bg-red-100"
              >
                削除
              </button>
            </div>
          </div>
          <p className="text-stone-700 whitespace-pre-wrap text-sm leading-relaxed line-clamp-3">
            {entry.content}
          </p>
        </div>
      ))}

      {entries.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-2">📝</div>
          <p>まだ日記がありません</p>
        </div>
      )}

      {showForm && (
        <DiaryForm
          entry={editTarget}
          defaultDate={editTarget ? editTarget.date : newDate}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

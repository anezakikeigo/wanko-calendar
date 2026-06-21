"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DiaryEntry } from "@/lib/types";

type Props = {
  entry: DiaryEntry | null;
  defaultDate: string;
  onSaved: (entry: DiaryEntry) => void;
  onCancel: () => void;
};

export default function DiaryForm({ entry, defaultDate, onSaved, onCancel }: Props) {
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [content, setContent] = useState(entry?.content ?? "");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError("内容を入力してください"); return; }
    setLoading(true);
    setError(null);

    const payload = { date, content: content.trim() };
    let entryId = entry?.id;

    if (entry) {
      const { data, error: updateError } = await supabase
        .from("diary_entries")
        .update(payload)
        .eq("id", entry.id)
        .select()
        .single();
      if (updateError) { setError("更新に失敗しました"); setLoading(false); return; }
      entryId = data.id;
      onSaved(data as DiaryEntry);
    } else {
      const { data, error: insertError } = await supabase
        .from("diary_entries")
        .upsert(payload, { onConflict: "date" })
        .select()
        .single();
      if (insertError) { setError("登録に失敗しました"); setLoading(false); return; }
      entryId = data.id;
      onSaved(data as DiaryEntry);
    }

    // 写真アップロード
    if (entryId && newFiles.length > 0) {
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `${entryId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("diary-attachments")
          .upload(path, file);
        if (!upErr) {
          const { data: signedData } = await supabase.storage
            .from("diary-attachments")
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
          if (signedData) {
            await supabase.from("diary_attachments").insert({
              diary_entry_id: entryId,
              file_url: signedData.signedUrl,
              file_name: file.name,
            });
          }
        }
      }
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-stone-700 mb-4">
          {entry ? "日記を編集" : "日記を書く"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">日付</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">日記 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              placeholder="今日のわんこたちの様子を書いてね..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">写真</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              className="w-full text-sm text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-600"
            />
            {newFiles.length > 0 && (
              <p className="text-xs text-stone-400 mt-1">{newFiles.length}枚選択中</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 font-semibold hover:bg-stone-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

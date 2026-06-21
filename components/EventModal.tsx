"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Category, Dog, Event as WankoEvent, EventAttachment } from "@/lib/types";

type CreateMode = {
  mode: "create";
  initialStart?: string;
  initialAllDay?: boolean;
  event?: undefined;
};
type EditMode = {
  mode: "edit";
  event: WankoEvent;
  initialStart?: undefined;
  initialAllDay?: undefined;
};
type Props = (CreateMode | EditMode) & {
  categories: Category[];
  dogs: Dog[];
  onClose: () => void;
  onSaved: () => void;
};

export default function EventModal({ mode, event, initialStart, initialAllDay, categories, dogs, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [categoryId, setCategoryId] = useState(event?.category_id ?? "");
  const [startAt, setStartAt] = useState(
    event?.start_at
      ? event.start_at.slice(0, 16)
      : initialStart
        ? initialStart.length === 10
          ? `${initialStart}T09:00`
          : initialStart.slice(0, 16)
        : ""
  );
  const [allDay, setAllDay] = useState(event?.all_day ?? initialAllDay ?? false);
  const [memo, setMemo] = useState(event?.memo ?? "");
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(
    event?.dogs?.map((d: any) => d.dog?.id ?? d.id).filter(Boolean) ?? []
  );
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  function toggleDog(id: string) {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("タイトルは必須です"); return; }
    if (!startAt) { setError("日時は必須です"); return; }
    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      category_id: categoryId || null,
      start_at: allDay ? `${startAt.slice(0, 10)}T00:00:00` : new Date(startAt).toISOString(),
      all_day: allDay,
      memo: memo.trim() || null,
    };

    let eventId = event?.id;

    if (mode === "edit" && event) {
      const { error: updateError } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id);
      if (updateError) { setError("更新に失敗しました"); setLoading(false); return; }
    } else {
      const { data, error: insertError } = await supabase
        .from("events")
        .insert(payload)
        .select()
        .single();
      if (insertError) { setError("登録に失敗しました"); setLoading(false); return; }
      eventId = data.id;
    }

    // わんこ紐付け更新
    if (eventId) {
      await supabase.from("event_dogs").delete().eq("event_id", eventId);
      if (selectedDogIds.length > 0) {
        await supabase.from("event_dogs").insert(
          selectedDogIds.map((dog_id) => ({ event_id: eventId!, dog_id }))
        );
      }

      // 添付ファイルアップロード
      for (const file of newFiles) {
        const ext = file.name.split(".").pop();
        const path = `${eventId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("event-attachments")
          .upload(path, file);
        if (!upErr) {
          const { data: signedData } = await supabase.storage
            .from("event-attachments")
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
          if (signedData) {
            await supabase.from("event_attachments").insert({
              event_id: eventId,
              file_url: signedData.signedUrl,
              file_name: file.name,
              file_type: fileType,
            });
          }
        }
      }
    }

    setLoading(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!event || !confirm("この予定を削除しますか？")) return;
    await supabase.from("events").delete().eq("id", event.id);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-700">
            {mode === "edit" ? "予定を編集" : "予定を追加"}
          </h2>
          {mode === "edit" && (
            <button onClick={handleDelete} className="text-red-400 text-sm hover:text-red-500">
              削除
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: ハナ 通院"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded accent-amber-400"
              />
              終日
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">
              {allDay ? "日付 *" : "日時 *"}
            </label>
            <input
              type={allDay ? "date" : "datetime-local"}
              value={allDay ? startAt.slice(0, 10) : startAt}
              onChange={(e) => setStartAt(allDay ? `${e.target.value}T00:00` : e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">カテゴリ</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
            >
              <option value="">カテゴリなし</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {dogs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-2">わんこ</label>
              <div className="flex flex-wrap gap-2">
                {dogs.map((dog) => (
                  <button
                    key={dog.id}
                    type="button"
                    onClick={() => toggleDog(dog.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedDogIds.includes(dog.id)
                        ? "bg-amber-400 text-white"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    🐾 {dog.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
              placeholder="メモを入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">添付ファイル</label>
            <div className="flex gap-2 mb-2">
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="receipt">診察明細・領収書</option>
                <option value="rabies_certificate">狂犬病証明書</option>
                <option value="vaccine_certificate">混合ワクチン証明書</option>
                <option value="other">その他</option>
              </select>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              className="w-full text-sm text-stone-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-600"
            />
            {newFiles.length > 0 && (
              <p className="text-xs text-stone-400 mt-1">{newFiles.length}件選択中</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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

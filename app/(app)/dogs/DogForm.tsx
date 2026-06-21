"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dog } from "@/lib/types";

type Props = {
  dog: Dog | null;
  onSaved: (dog: Dog) => void;
  onCancel: () => void;
};

export default function DogForm({ dog, onSaved, onCancel }: Props) {
  const [name, setName] = useState(dog?.name ?? "");
  const [breed, setBreed] = useState(dog?.breed ?? "");
  const [birthday, setBirthday] = useState(dog?.birthday ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("名前は必須です"); return; }
    setLoading(true);
    setError(null);

    let photo_url = dog?.photo_url ?? null;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("dog-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) {
        setError("写真のアップロードに失敗しました");
        setLoading(false);
        return;
      }
      const { data: signedData } = await supabase.storage
        .from("dog-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      photo_url = signedData?.signedUrl ?? null;
    }

    const payload = {
      name: name.trim(),
      breed: breed.trim() || null,
      birthday: birthday || null,
      photo_url,
    };

    if (dog) {
      const { data, error: updateError } = await supabase
        .from("dogs")
        .update(payload)
        .eq("id", dog.id)
        .select()
        .single();
      if (updateError) { setError("更新に失敗しました"); setLoading(false); return; }
      onSaved(data as Dog);
    } else {
      const { data, error: insertError } = await supabase
        .from("dogs")
        .insert(payload)
        .select()
        .single();
      if (insertError) { setError("登録に失敗しました"); setLoading(false); return; }
      onSaved(data as Dog);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50" onClick={onCancel}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-stone-700">
          {dog ? "わんこを編集" : "わんこを追加"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">名前 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: ハナ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">犬種</label>
            <input
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="例: トイプードル"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">誕生日</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">写真</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-600"
            />
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

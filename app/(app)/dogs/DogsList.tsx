"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dog } from "@/lib/types";
import DogForm from "./DogForm";

type Props = { initialDogs: Dog[] };

export default function DogsList({ initialDogs }: Props) {
  const [dogs, setDogs] = useState<Dog[]>(initialDogs);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Dog | null>(null);
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm("このわんこの記録を削除しますか？")) return;
    await supabase.from("dogs").delete().eq("id", id);
    setDogs((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSaved(dog: Dog) {
    setDogs((prev) => {
      const exists = prev.find((d) => d.id === dog.id);
      return exists ? prev.map((d) => (d.id === dog.id ? dog : d)) : [...prev, dog];
    });
    setShowForm(false);
    setEditTarget(null);
  }

  return (
    <div className="space-y-3">
      {dogs.map((dog) => (
        <div key={dog.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {dog.photo_url ? (
              <img src={dog.photo_url} alt={dog.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🐶</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-700">{dog.name}</p>
            {dog.breed && <p className="text-sm text-stone-400">{dog.breed}</p>}
            {dog.birthday && (
              <p className="text-xs text-stone-400">
                🎂 {dog.birthday.replace(/-/g, "/")}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditTarget(dog); setShowForm(true); }}
              className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
            >
              編集
            </button>
            <button
              onClick={() => handleDelete(dog.id)}
              className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 rounded-lg text-red-400 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      ))}

      {dogs.length === 0 && (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-2">🐾</div>
          <p>まだわんこが登録されていません</p>
        </div>
      )}

      <button
        onClick={() => { setEditTarget(null); setShowForm(true); }}
        className="w-full py-4 border-2 border-dashed border-amber-300 rounded-2xl text-amber-500 font-semibold hover:bg-amber-50 transition-colors"
      >
        ＋ わんこを追加
      </button>

      {showForm && (
        <DogForm
          dog={editTarget}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}

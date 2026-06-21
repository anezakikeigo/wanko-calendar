"use client";

import { useState } from "react";
import { Dog } from "@/lib/types";

const FILE_TYPE_LABELS: Record<string, string> = {
  receipt: "診察明細・領収書",
  rabies_certificate: "狂犬病証明書",
  vaccine_certificate: "混合ワクチン証明書",
  other: "その他",
};

type Attachment = {
  id: string;
  file_url: string;
  file_name: string | null;
  file_type: string;
  uploaded_at: string;
  event: {
    title: string;
    start_at: string;
    category: { name: string; color: string } | null;
    dogs: { dog: { id: string; name: string } }[];
  } | null;
};

type Props = {
  initialAttachments: Attachment[];
  dogs: Dog[];
};

export default function ArchiveView({ initialAttachments, dogs }: Props) {
  const [filterDogId, setFilterDogId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = initialAttachments.filter((a) => {
    const dogMatch =
      !filterDogId ||
      (a.event?.dogs ?? []).some((d) => d.dog?.id === filterDogId);
    const typeMatch = !filterType || a.file_type === filterType;
    return dogMatch && typeMatch;
  });

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <div className="flex gap-2">
        <select
          value={filterDogId}
          onChange={(e) => setFilterDogId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">全てのわんこ</option>
          {dogs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
        >
          <option value="">全ての種類</option>
          {Object.entries(FILE_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">
          <div className="text-4xl mb-2">📂</div>
          <p>該当する書類がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLightbox(a.file_url)}
            >
              <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                <img
                  src={a.file_url}
                  alt={a.file_name ?? ""}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-stone-600 truncate">
                  {a.event?.title ?? ""}
                </p>
                <p className="text-xs text-stone-400">
                  {a.event?.start_at.slice(0, 10).replace(/-/g, "/")}
                </p>
                <span
                  className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600"
                >
                  {FILE_TYPE_LABELS[a.file_type] ?? a.file_type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ライトボックス */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="拡大表示"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import ArchiveView from "./ArchiveView";

export default async function ArchivePage() {
  const supabase = await createClient();

  const [{ data: attachments }, { data: dogs }] = await Promise.all([
    supabase
      .from("event_attachments")
      .select("*, event:events(title, start_at, category:categories(name, color), dogs:event_dogs(dog:dogs(id, name)))")
      .order("uploaded_at", { ascending: false }),
    supabase.from("dogs").select("*").order("created_at"),
  ]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-stone-700 mb-4">📂 書類アーカイブ</h1>
      <ArchiveView initialAttachments={attachments ?? []} dogs={dogs ?? []} />
    </div>
  );
}

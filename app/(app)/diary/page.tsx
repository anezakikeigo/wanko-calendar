import { createClient } from "@/lib/supabase/server";
import DiaryList from "./DiaryList";

export default async function DiaryPage() {
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("diary_entries")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-stone-700 mb-4">📝 みんなの日記</h1>
      <DiaryList initialEntries={entries ?? []} />
    </div>
  );
}

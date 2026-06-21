import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: events }, { data: categories }, { data: dogs }] = await Promise.all([
    supabase
      .from("events")
      .select("*, category:categories(*), dogs:event_dogs(dog:dogs(*))")
      .order("start_at", { ascending: true }),
    supabase.from("categories").select("*").order("created_at"),
    supabase.from("dogs").select("*").order("created_at"),
  ]);

  return (
    <CalendarView
      initialEvents={events ?? []}
      categories={categories ?? []}
      dogs={dogs ?? []}
    />
  );
}

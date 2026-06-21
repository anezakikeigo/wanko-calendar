import { createClient } from "@/lib/supabase/server";
import DogsList from "./DogsList";

export default async function DogsPage() {
  const supabase = await createClient();
  const { data: dogs } = await supabase
    .from("dogs")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-stone-700 mb-4">🐾 わんこたち</h1>
      <DogsList initialDogs={dogs ?? []} />
    </div>
  );
}

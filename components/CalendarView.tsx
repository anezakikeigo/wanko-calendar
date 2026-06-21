"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja";
import type { EventClickArg, DateSelectArg, EventInput } from "@fullcalendar/core";
import { createClient } from "@/lib/supabase/client";
import { Category, Dog, Event as WankoEvent } from "@/lib/types";
import EventModal from "./EventModal";

type Props = {
  initialEvents: WankoEvent[];
  categories: Category[];
  dogs: Dog[];
};

function toFCEvents(events: WankoEvent[]): EventInput[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start_at,
    end: e.end_at ?? undefined,
    allDay: e.all_day,
    backgroundColor: e.category?.color ?? "#6B7280",
    borderColor: e.category?.color ?? "#6B7280",
    extendedProps: { event: e },
  }));
}

export default function CalendarView({ initialEvents, categories, dogs }: Props) {
  const [events, setEvents] = useState<WankoEvent[]>(initialEvents);
  const [modalState, setModalState] = useState<
    | { mode: "create"; start: string; allDay: boolean }
    | { mode: "edit"; event: WankoEvent }
    | null
  >(null);
  const supabase = createClient();

  const refreshEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*, category:categories(*), dogs:event_dogs(dog:dogs(*))")
      .order("start_at", { ascending: true });
    setEvents(data ?? []);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, refreshEvents)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshEvents]);

  function handleDateSelect(info: DateSelectArg) {
    setModalState({ mode: "create", start: info.startStr, allDay: info.allDay });
  }

  function handleEventClick(info: EventClickArg) {
    const event = info.event.extendedProps.event as WankoEvent;
    setModalState({ mode: "edit", event });
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden px-1">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={jaLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listMonth",
          }}
          buttonText={{ today: "今日", month: "月", week: "週", list: "一覧" }}
          events={toFCEvents(events)}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="100%"
          eventDisplay="block"
          dayMaxEvents={3}
          nowIndicator={true}
        />
      </div>

      {modalState && modalState.mode === "create" && (
        <EventModal
          mode="create"
          initialStart={modalState.start}
          initialAllDay={modalState.allDay}
          categories={categories}
          dogs={dogs}
          onClose={() => setModalState(null)}
          onSaved={refreshEvents}
        />
      )}
      {modalState && modalState.mode === "edit" && (
        <EventModal
          mode="edit"
          event={modalState.event}
          categories={categories}
          dogs={dogs}
          onClose={() => setModalState(null)}
          onSaved={refreshEvents}
        />
      )}
    </div>
  );
}

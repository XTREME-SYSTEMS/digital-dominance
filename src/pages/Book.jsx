import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSettings } from "@/lib/useSettings";
import { trackEvent } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import { Loader2, Calendar, Clock } from "lucide-react";
import BackButton from "@/components/BackButton";
import Logo from "@/components/Logo";

const STATIC_SLOTS = [
  { time: "09:00", label: "9:00 AM" },
  { time: "10:30", label: "10:30 AM" },
  { time: "12:00", label: "12:00 PM" },
  { time: "13:30", label: "1:30 PM" },
  { time: "15:00", label: "3:00 PM" },
  { time: "16:30", label: "4:30 PM" },
];

export default function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { data: lead } = useQuery({ queryKey: ["lead", id], queryFn: () => base44.entities.Lead.get(id) });
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(true);

  const days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i + 1));

  // Fetch real available slots from Google Calendar when the date changes
  useEffect(() => {
    if (settings.calendar_url) return; // using external iframe scheduler
    setLoadingSlots(true);
    setTime("");
    base44.functions
      .invoke("bookEstimate", { action: "getSlots", date })
      .then((res) => {
        setSlots(res.data?.slots || []);
        setCalendarConnected(true);
      })
      .catch(() => {
        setCalendarConnected(false);
        setSlots(STATIC_SLOTS); // fallback to static slots
      })
      .finally(() => setLoadingSlots(false));
  }, [date, settings.calendar_url]);

  const confirm = async () => {
    setBooking(true);
    try {
      if (calendarConnected) {
        const res = await base44.functions.invoke("bookEstimate", { action: "book", lead_id: id, date, time });
        if (res.data?.ok) {
          await trackEvent("in_home_booked", { lead_id: id });
          trackEvent("book_estimate", { lead_id: id });
          navigate(`/booked/${res.data.appointment_id}`);
          return;
        }
        throw new Error(res.data?.error || "Booking failed");
      }
      throw new Error("Calendar not connected");
    } catch {
      // Fallback: create appointment directly without calendar sync
      try {
        const appt = await base44.entities.Appointment.create({
          lead_id: id,
          type: "IN-HOME ESTIMATE",
          date,
          time: slots.find((s) => s.time === time)?.label || time,
          salesperson: settings.salesperson?.name || "",
          status: "booked",
        });
        await base44.entities.Lead.update(id, { status: "IN-HOME ESTIMATE BOOKED", appointment_status: "in-home-booked" });
        await trackEvent("in_home_booked", { lead_id: id });
        trackEvent("book_estimate", { lead_id: id });
        navigate(`/booked/${appt.id}`);
      } catch {
        setBooking(false);
      }
    }
  };

  // External scheduler iframe fallback
  if (settings.calendar_url) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="bg-stone-950 text-white">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3"><BackButton className="text-stone-300 hover:text-white" /><Logo /></div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Free In-Home Estimate</h1>
          <iframe title="Scheduler" src={settings.calendar_url} className="mt-6 w-full h-[720px] rounded-2xl border border-stone-200 bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-950 text-white">
        <div className="max-w-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3"><BackButton className="text-stone-300 hover:text-white" /><Logo /></div>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="text-xs font-bold tracking-[0.2em] text-amber-600">FREE IN-HOME ESTIMATE</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Pick a time that works for you</h1>
        <p className="mt-3 text-stone-500">
          We'll come to your home{lead ? ` at ${lead.address}` : ""} to measure your garage, inspect the floor, and give you a firm, no-obligation quote.
        </p>

        {lead?.estimate_low && lead?.estimate_high && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs font-bold uppercase text-amber-700">Your Estimate Range</div>
              <div className="text-2xl font-extrabold text-stone-900">${lead.estimate_low.toLocaleString()} – ${lead.estimate_high.toLocaleString()}</div>
            </div>
            <Calendar className="h-8 w-8 text-amber-500" />
          </div>
        )}

        <div className="mt-8">
          <div className="text-sm font-medium text-stone-600 mb-3">Choose a day</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              return (
                <button
                  key={key}
                  onClick={() => setDate(key)}
                  className={`shrink-0 w-20 py-3 rounded-xl border text-center ${date === key ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"}`}
                >
                  <div className="text-[11px] uppercase text-stone-500">{format(d, "EEE")}</div>
                  <div className="text-lg font-semibold text-stone-900">{format(d, "d")}</div>
                  <div className="text-[11px] text-stone-500">{format(d, "MMM")}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <div className="text-sm font-medium text-stone-600 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-stone-400" />
            Available times
            {calendarConnected && !loadingSlots && slots.length > 0 && (
              <span className="text-xs text-green-600 font-normal">synced with our calendar</span>
            )}
          </div>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-stone-400 py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
            </div>
          ) : slots.length === 0 ? (
            <div className="text-sm text-stone-400 py-4">No available times on this day. Please pick another date.</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {slots.map((s) => (
                <button
                  key={s.time}
                  onClick={() => setTime(s.time)}
                  className={`h-14 rounded-xl border font-medium ${time === s.time ? "border-amber-500 bg-amber-50 text-stone-900" : "border-stone-200 bg-white text-stone-700"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={confirm}
          disabled={!time || booking}
          className="mt-10 w-full h-14 rounded-xl bg-stone-900 hover:bg-stone-800 text-base font-semibold"
        >
          {booking ? <Loader2 className="h-5 w-5 animate-spin" /> : "CONFIRM MY IN-HOME ESTIMATE"}
        </Button>
      </div>
    </div>
  );
}
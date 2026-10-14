"use client";

import { BedDouble, Mail, Phone, User, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { api, errorMessage, jsonRequest } from "@/lib/portal-api";
import { useAlert } from "./alert-provider";
import { Button } from "./button";
import { Card } from "./card";
import { Field } from "./field";
import { PortalBookings } from "./portal-bookings";
import { StayRangeForm, type AvailableRoom, type Stay } from "./portal-tools";
import { SelectField } from "./select-field";

// Walk-in reservation: dates with the site's calendar, then an available room and the guest.
// Price comes from hotel rates; confirmation follows payment review and blockchain proof.
export function FrontDeskBooking({ onCreated }: { onCreated?: () => void }) {
  const showAlert = useAlert();
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null);
  const [stay, setStay] = useState<Stay | null>(null);
  const [busy, setBusy] = useState(false);

  async function findRooms(next: Stay) {
    setBusy(true);
    setRooms(null);
    try {
      const body = await api<{ rooms: AvailableRoom[] }>(`/api/availability?${new URLSearchParams(next)}`);
      setStay(next);
      setRooms(body.rooms);
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Unable to load rooms."), durationMs: null });
    } finally { setBusy(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stay) return;
    const form = event.currentTarget;
    setBusy(true);
    try {
      const body = await api<{ reference: string }>("/api/staff/reservations", jsonRequest("POST", { ...Object.fromEntries(new FormData(form)), ...stay }));
      showAlert({ status: "success", title: "Reservation created", message: `Booking ${body.reference} is awaiting payment.` });
      setRooms(null);
      setStay(null);
      form.reset();
      onCreated?.();
    } catch (e) {
      showAlert({ status: "danger", message: errorMessage(e, "Unable to create booking."), durationMs: null });
    } finally { setBusy(false); }
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-[22px] leading-7">New reservation</h2>
        <p className="mt-1 text-sm text-muted">Choose the stay, then an available room and the guest&apos;s details.</p>
      </div>
      <StayRangeForm onSubmit={findRooms} busy={busy} submitLabel="Find rooms" />
      {rooms && rooms.length === 0 && <p className="text-sm text-muted">No rooms available for these dates.</p>}
      {rooms && rooms.length > 0 && stay && (
        <form onSubmit={create} className="grid gap-4 border-t border-border pt-5 md:grid-cols-2">
          <p className="text-sm md:col-span-2">
            Stay: <span className="font-medium">{formatDate(stay.check_in)} – {formatDate(stay.check_out)}</span>
          </p>
          <div className="md:col-span-2">
            <SelectField
              name="room_id"
              label="Room"
              icon={BedDouble}
              required
              options={rooms.map((room) => ({ value: room.room_id, label: `${room.room_number} · ${room.room_type} · up to ${room.capacity} guests · ${formatMoney(room.nightly_rate)}/night` }))}
            />
          </div>
          <Field name="guests" label="Guests" type="number" icon={Users} min={1} max={20} defaultValue={1} required />
          <Field name="name" label="Guest name" icon={User} maxLength={120} required />
          <Field name="phone" label="Phone" type="tel" icon={Phone} maxLength={30} placeholder="+252 61 234 5678" />
          <Field name="email" label="Email (optional)" type="email" icon={Mail} maxLength={254} hint="Use the guest's verified email so they can see this booking." />
          <div className="md:col-span-2">
            <Button type="submit" disabled={busy}>Create reservation</Button>
          </div>
        </form>
      )}
    </Card>
  );
}

// Walk-in page: the form plus the bookings list, which reloads after each new reservation.
export function WalkInPage({ role }: { role: "admin" | "receptionist" }) {
  const [created, setCreated] = useState(0);
  return (
    <div className="flex flex-col gap-8">
      <FrontDeskBooking onCreated={() => setCreated((n) => n + 1)} />
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[22px] leading-7">Bookings</h2>
        <PortalBookings role={role} refreshSignal={created} initialView="" />
      </section>
    </div>
  );
}

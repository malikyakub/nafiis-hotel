"use client";

import { BedDouble, CalendarDays, Users } from "lucide-react";
import { useState } from "react";
import { DateTimeField, isoDay, type DateTime } from "@/components/ui/date-time-field";
import { ListboxField } from "@/components/ui/listbox-field";

const TIMES = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export function PickerDemo() {
  const [today] = useState(() => isoDay(new Date()));
  const [date, setDate] = useState<DateTime | null>(null);

  return (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
      <DateTimeField label="Check-in" name="demo_stay" icon={CalendarDays} value={date} onChange={setDate} times={TIMES} minDate={today} />
      <ListboxField
        label="Guests"
        name="demo_guests"
        icon={Users}
        options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: n === 1 ? "1 guest" : `${n} guests` }))}
        defaultValue="2"
      />
      <ListboxField
        label="Room"
        name="demo_room"
        icon={BedDouble}
        options={[
          { value: "any", label: "Any room" },
          { value: "ocean", label: "Ocean room" },
          { value: "garden", label: "Garden room" },
        ]}
      />
    </div>
  );
}

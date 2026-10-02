"use client";

import { useAlert } from "@/components/ui/alert-provider";
import { Button, type ButtonVariant } from "@/components/ui/button";
import type { Status } from "@/components/ui/status";

const DEMOS: Array<{ status: Status; variant: ButtonVariant; title: string; message: string }> = [
  { status: "success", variant: "success", title: "Payment approved", message: "Booking NFS-0001 is confirmed." },
  { status: "warning", variant: "warning", title: "Room not held", message: "Another guest can take this room if they pay first." },
  { status: "danger", variant: "danger", title: "Payment rejected", message: "The screenshot does not match the amount." },
  { status: "info", variant: "primary", title: "Under review", message: "The admin is checking your payment." },
  { status: "neutral", variant: "secondary", title: "Reminder", message: "Check-out is at 12:00." },
];

export function AlertDemo() {
  const showAlert = useAlert();
  return (
    <div className="flex flex-wrap gap-2">
      {DEMOS.map(({ status, variant, title, message }) => (
        <Button
          key={status}
          size="sm"
          variant={variant}
          onClick={() => showAlert({ status, title, message })}
        >
          Show {status}
        </Button>
      ))}
    </div>
  );
}

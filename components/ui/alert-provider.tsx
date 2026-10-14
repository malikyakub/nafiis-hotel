"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Alert } from "./alert";
import type { Status } from "./status";

type AlertInput = {
  status?: Status;
  title?: string;
  message: React.ReactNode;
  // null keeps the alert until it is dismissed: use it for errors and alerts with actions.
  durationMs?: number | null;
  // An alert with the same tag replaces the one already showing instead of stacking.
  tag?: string;
};
type AlertItem = AlertInput & { id: number };
// Returns a function that dismisses this alert, e.g. once the error it reports is fixed.
type ShowAlert = (alert: AlertInput) => () => void;

const AlertContext = createContext<ShowAlert | null>(null);

const DEFAULT_DURATION_MS = 6000;

// Wraps the app once (root layout). Alerts stack in the top-right corner, below the sticky
// site and portal headers so they never cover header buttons.
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const show = useCallback<ShowAlert>(
    (alert) => {
      const id = nextId.current++;
      setAlerts((current) => [
        ...current.filter((item) => !alert.tag || item.tag !== alert.tag),
        { ...alert, id },
      ]);
      if (alert.durationMs !== null) window.setTimeout(() => dismiss(id), alert.durationMs ?? DEFAULT_DURATION_MS);
      return () => dismiss(id);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-20 z-50 flex flex-col items-end gap-2.5 sm:left-auto sm:w-[360px]"
      >
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            status={alert.status}
            title={alert.title}
            onDismiss={() => dismiss(alert.id)}
            variant="toast"
            className="animate-alert-in pointer-events-auto w-full"
          >
            {alert.message}
          </Alert>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

// showAlert({ status: "success", title: "Saved", message: "Room updated." })
export function useAlert() {
  const show = useContext(AlertContext);
  if (!show) throw new Error("useAlert must be used inside <AlertProvider>");
  return show;
}

"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Alert } from "./alert";
import type { Status } from "./status";

type AlertInput = { status?: Status; title?: string; message: string; durationMs?: number };
type AlertItem = AlertInput & { id: number };
type ShowAlert = (alert: AlertInput) => void;

const AlertContext = createContext<ShowAlert | null>(null);

const DEFAULT_DURATION_MS = 6000;

// Wraps the app once (root layout). Alerts stack in the top-right corner.
export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const show = useCallback<ShowAlert>(
    (alert) => {
      const id = nextId.current++;
      setAlerts((current) => [...current, { ...alert, id }]);
      window.setTimeout(() => dismiss(id), alert.durationMs ?? DEFAULT_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96"
      >
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            status={alert.status}
            title={alert.title}
            onDismiss={() => dismiss(alert.id)}
            className="animate-alert-in pointer-events-auto w-full shadow-lg"
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

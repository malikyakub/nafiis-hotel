"use client";

import { useActionState } from "react";
import { initialFormState, type FormState } from "@/lib/auth/form-state";
import { useAlert } from "./alert-provider";

type FormAction = (prev: FormState, formData: FormData) => Promise<FormState>;

// useActionState for a server action, with errors shown as a top-right alert.
export function useFormAction(action: FormAction) {
  const showAlert = useAlert();
  return useActionState(async (prev: FormState, formData: FormData) => {
    const next = await action(prev, formData);
    if (next.error) showAlert({ status: "danger", message: next.error });
    return next;
  }, initialFormState);
}

// Shared shape returned by the auth server actions to their forms.
// `values` echoes back non-secret inputs so the form keeps them after an error.
export type FormState = {
  error?: string;
  success?: string;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

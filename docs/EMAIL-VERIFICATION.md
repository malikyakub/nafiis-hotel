# Registration email verification

Updated 13 October 2026. Routine login is registered email + password for guests and existing staff. No login OTP is requested, sent or entered. Supabase checks the password; the server checks an active profile before setting the session and redirecting to its dashboard. Provider rate limits and protected routes remain in place.

## Separate flows retained

- New guest registration: account details/password, then signup email verification through RegistrationCodeForm and registration-actions.ts. Resend calls Supabase signup resend only.
- Password recovery: existing reset email/callback and password update remain unchanged.
- Administrator and receptionist access: existing active role checks and password credentials remain unchanged. No staff provisioning or security-setting changes were made.

If Supabase automatically confirms a new signup and returns a session, registration signs out and reports a configuration problem. It does not fall back to sending a login OTP. Configure signup email confirmation before launching this registration flow.

## Deferred signup delivery setup

The owner postponed email-provider/domain/SMTP setup. The last dashboard inspection showed SMTP disabled. No email settings were changed in the login update. For signup code delivery, configure custom SMTP and the Confirm signup template to display {{ .Token }}. Magic Link/login templates are not required by this application. Keep password recovery templates and callback configuration intact. Enter provider secrets privately in Supabase, never in source or chat.

## Verified behavior

The actual local preview passed password login, guest dashboard redirect, logout and protected-route denial using one temporary confirmed guest account. Wrong passwords and disabled profiles were denied. The fixture was removed. No test email was sent. See ACCEPTANCE-RESULTS.md for details. Signup/recovery email delivery and hosted production acceptance remain unverified.

References: https://supabase.com/docs/guides/auth/passwords , https://supabase.com/docs/guides/auth/auth-email-templates , https://supabase.com/docs/guides/auth/auth-smtp

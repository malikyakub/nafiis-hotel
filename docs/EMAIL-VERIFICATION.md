# Email code verification

Implemented locally on 2026-10-09. Login uses email + one-time code, without a password. Registration retains the existing password fields and adds email-code verification afterward. This is passwordless email login, not a password-plus-code second factor. Existing Supabase passwords and accounts are not deleted. Existing sessions remain active.

## Required Supabase dashboard configuration

These settings have not been changed or verified by the assistant. The connected Supabase tools do not expose Auth email-template/SMTP configuration.

1. Open the Nafiis Hotel project's Authentication email templates.
2. Update both **Confirm signup** and **Magic Link** templates to display `{{ .Token }}`. Copy the HTML below into each template. Use a subject such as `Your Nafiis Hotel verification code`.
3. Keep email confirmation enabled. Set the OTP expiration to a short period, for example 10 minutes. The form accepts 6–10 digits to accommodate the project's OTP length setting.
4. Configure custom SMTP for delivery to customers. Supabase's default sender restricts recipients to project team addresses and has a low email rate limit. Configure the provider credentials privately in the dashboard, not source code or chat.
5. Keep the existing Site URL and allowed callback URLs correct for password reset. Codes themselves are entered on the website.

```html
<h2>Your Nafiis Hotel verification code</h2>
<p>Enter this code on the hotel website:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
<p>If you did not request this email, you can ignore it. Do not share this code.</p>
```

## Behavior

- Login calls signInWithOtp with shouldCreateUser:false, so login never creates an account.
- Registration sends the signup verification email; if automatic confirmation is enabled, it signs out the newly returned session and requests a login code instead.
- Verification uses Supabase verifyOtp. Only a successful code and an active, recognized profile permit the role-specific redirect. Existing role/RLS controls remain in place.
- Resend uses signup resend or login OTP as appropriate. Supabase enforces expiry and rate limits. Codes and passwords are never returned in form state or logged.
- Anonymous hotel booking still does not require an account.

## Pending live acceptance

Verify delivery to an authorized test mailbox, wrong/expired code rejection, resend, a newly registered guest and an existing staff account. No email was sent by the assistant and live delivery is not verified. Do not describe this feature as operational until templates/delivery are configured.

References: https://supabase.com/docs/guides/auth/auth-email-passwordless , https://supabase.com/docs/guides/auth/auth-email-templates , https://supabase.com/docs/guides/auth/auth-smtp

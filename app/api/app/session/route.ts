import { AccessError, requireRole } from "@/lib/auth/require-role";
import { failure, json } from "@/lib/http";

// Returns only the current user's active role. The UI flag never grants access.
export async function GET() {
  try {
    const { profile } = await requireRole("guest", "admin", "receptionist", "restaurant_staff");
    return json({ role: profile.role });
  } catch (error) {
    if (error instanceof AccessError) return json({ role: null });
    return failure("app.session", error);
  }
}

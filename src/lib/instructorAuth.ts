import type { Session } from "@supabase/supabase-js";

export const INSTRUCTOR_ROLE = "instructor";

export const isInstructorSession = (session: Session | null): boolean =>
  session?.user.app_metadata?.role === INSTRUCTOR_ROLE;

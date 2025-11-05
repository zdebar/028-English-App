import type { UserInfoLocal } from "@/types/local.types";
import type { User } from "@supabase/supabase-js";

export function mapSupabaseUserToLocal(user: User): UserInfoLocal {
  return {
    id: user.id,
    name: user.user_metadata?.full_name || null,
    email: user.email || null,
    picture_url: user.user_metadata?.avatar_url || null,
  };
}

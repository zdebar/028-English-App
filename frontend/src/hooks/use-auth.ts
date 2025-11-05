import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseInstance } from "@/config/supabase.config";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseInstance.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabaseInstance.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabaseInstance.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      setSession(null);
      console.log("User logged out successfully.");
    }
  };

  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;

  return { userId, userEmail, handleLogout };
}

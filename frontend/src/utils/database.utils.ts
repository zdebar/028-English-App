import { db } from "@/database/models/db";

export function ensureUserLoggedIn() {
  if (!db.userId) {
    throw new Error("No user is logged in.");
  }
}

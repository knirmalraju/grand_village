import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
export async function clientFor(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Please sign in first.");
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user)
    throw new Error("Your session has expired. Please sign in again.");
  return { client, user: data.user };
}
export function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/schema cache|does not exist|Could not find the table/i.test(message))
    return "The Supabase database needs the GrandVillage setup migration. Your account is signed in, but app tables are not ready yet.";
  return message;
}

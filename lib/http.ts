import { NextResponse } from "next/server";

/**
 * Returns a generic error response to the client while logging the real error
 * server-side. Prevents leaking DB/internal error details (e.message, codes,
 * connection strings) to callers.
 */
export function serverError(
  context: string,
  e: unknown,
  message = "something went wrong"
) {
  console.error(`[${context}]`, e);
  return NextResponse.json({ error: message }, { status: 500 });
}

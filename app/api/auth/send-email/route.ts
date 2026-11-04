import { Webhook } from "standardwebhooks";
import { buildSupabaseAuthEmails, sendSupabaseAuthEmail, type AuthEmailEvent } from "@/lib/supabase/auth-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!secret || !supabaseUrl || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error("Supabase Send Email Hook configuration is incomplete.");
    return Response.json({ error: { message: "Email service unavailable." } }, { status: 503 });
  }

  let event: AuthEmailEvent;
  try {
    const rawBody = await request.text();
    const hook = new Webhook(secret.replace(/^v1,/, ""));
    event = hook.verify(rawBody, Object.fromEntries(request.headers)) as AuthEmailEvent;
  } catch {
    return Response.json({ error: { message: "Invalid signature." } }, { status: 401 });
  }

  try {
    const emails = buildSupabaseAuthEmails(event, supabaseUrl);
    const webhookId = request.headers.get("webhook-id") ?? crypto.randomUUID();
    await Promise.all(emails.map((email, index) => sendSupabaseAuthEmail(email, `${webhookId}-${index}`)));
    return Response.json({});
  } catch (error) {
    console.error("Supabase Auth email delivery failed", error instanceof Error ? error.message : error);
    return Response.json({ error: { message: "Email delivery failed." } }, { status: 502 });
  }
}

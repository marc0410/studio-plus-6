import "server-only";
import { prisma } from "@/lib/prisma";

export type AuthEmailEvent = {
  user: {
    email?: string;
    new_email?: string;
    user_metadata?: { full_name?: string; name?: string };
  };
  email_data: {
    email_action_type: string;
    token?: string;
    token_new?: string;
    token_hash?: string;
    token_hash_new?: string;
    redirect_to?: string;
    site_url?: string;
  };
};

export type AuthEmail = { to: string; subject: string; intro: string; action?: string; link?: string; code?: string };

const copy: Record<string, { subject: string; intro: string; action?: string }> = {
  signup: { subject: "Confirmez votre adresse e-mail — Studio+", intro: "Confirmez votre adresse e-mail pour activer votre compte Studio+.", action: "Confirmer mon adresse" },
  email: { subject: "Confirmez votre adresse e-mail — Studio+", intro: "Confirmez votre adresse e-mail pour continuer.", action: "Confirmer mon adresse" },
  invite: { subject: "Votre invitation Studio+", intro: "Vous avez été invité à rejoindre Studio+. Activez votre compte avec le lien ci-dessous.", action: "Accepter l’invitation" },
  magiclink: { subject: "Votre lien de connexion — Studio+", intro: "Utilisez ce lien pour vous connecter à votre compte.", action: "Me connecter" },
  recovery: { subject: "Réinitialisez votre mot de passe — Studio+", intro: "Une demande de réinitialisation du mot de passe a été faite pour votre compte.", action: "Réinitialiser mon mot de passe" },
  email_change: { subject: "Confirmez votre nouvelle adresse — Studio+", intro: "Confirmez le changement d’adresse e-mail de votre compte.", action: "Confirmer le changement" },
  reauthentication: { subject: "Votre code de vérification — Studio+", intro: "Utilisez ce code pour confirmer cette opération." },
  password_changed_notification: { subject: "Mot de passe modifié — Studio+", intro: "Le mot de passe de votre compte vient d’être modifié. Si ce n’était pas vous, contactez le studio." },
  email_changed_notification: { subject: "Adresse e-mail modifiée — Studio+", intro: "L’adresse e-mail de votre compte vient d’être modifiée. Si ce n’était pas vous, contactez le studio." },
  phone_changed_notification: { subject: "Numéro de téléphone modifié — Studio+", intro: "Le numéro de téléphone de votre compte vient d’être modifié. Si ce n’était pas vous, contactez le studio." },
  identity_linked_notification: { subject: "Méthode de connexion ajoutée — Studio+", intro: "Une méthode de connexion a été ajoutée à votre compte. Si ce n’était pas vous, contactez le studio." },
  identity_unlinked_notification: { subject: "Méthode de connexion retirée — Studio+", intro: "Une méthode de connexion a été retirée de votre compte. Si ce n’était pas vous, contactez le studio." },
  mfa_factor_enrolled_notification: { subject: "Vérification en deux étapes activée — Studio+", intro: "Une méthode de vérification a été ajoutée à votre compte. Si ce n’était pas vous, contactez le studio." },
  mfa_factor_unenrolled_notification: { subject: "Vérification en deux étapes désactivée — Studio+", intro: "Une méthode de vérification a été retirée de votre compte. Si ce n’était pas vous, contactez le studio." },
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

function verifyLink(hash: string, type: string, supabaseUrl: string, redirectTo?: string) {
  if (!hash) throw new Error("Token de vérification absent.");
  const url = new URL("/auth/v1/verify", supabaseUrl);
  url.searchParams.set("token", hash);
  url.searchParams.set("type", type);
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

function render(to: string, action: string, name: string, link?: string, code?: string): AuthEmail {
  const message = copy[action];
  if (!message) throw new Error(`Type d’e-mail Auth non pris en charge : ${action}`);
  return { to, ...message, intro: `${name ? `Bonjour ${name}, ` : "Bonjour, "}${message.intro}`, link, code };
}

export function buildSupabaseAuthEmails(event: AuthEmailEvent, supabaseUrl: string): AuthEmail[] {
  const { user, email_data: data } = event;
  const action = data.email_action_type;
  const email = user.email;
  if (!email) throw new Error("Destinataire Auth manquant.");
  const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const redirect = data.redirect_to || data.site_url;

  if (action === "email_change") {
    if (!user.new_email) throw new Error("Nouvelle adresse e-mail manquante.");
    if (data.token_hash_new && data.token_hash) {
      return [
        render(email, action, name, verifyLink(data.token_hash_new, action, supabaseUrl, redirect)),
        render(user.new_email, action, name, verifyLink(data.token_hash, action, supabaseUrl, redirect)),
      ];
    }
    return [render(user.new_email, action, name, verifyLink(data.token_hash || data.token_hash_new || "", action, supabaseUrl, redirect))];
  }

  if (action === "reauthentication") {
    if (!data.token) throw new Error("Code de vérification manquant.");
    return [render(email, action, name, undefined, data.token)];
  }

  if (copy[action]?.action) {
    const verificationType = action === "signup" ? "email" : action;
    return [render(email, action, name, verifyLink(data.token_hash || "", verificationType, supabaseUrl, redirect))];
  }

  if (copy[action]) return [render(email, action, name)];
  throw new Error(`Type d’e-mail Auth non pris en charge : ${action}`);
}

export async function sendSupabaseAuthEmail(email: AuthEmail, idempotencyKey: string, event = "AUTH_EMAIL") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const greeting = escapeHtml(email.intro);
  const link = email.link ? `<p style="margin:28px 0"><a href="${escapeHtml(email.link)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#eb0606;color:#fff;text-decoration:none">${escapeHtml(email.action ?? "Continuer")}</a></p><p style="font-size:12px;overflow-wrap:anywhere">Si le bouton ne fonctionne pas : <a href="${escapeHtml(email.link)}">${escapeHtml(email.link)}</a></p>` : "";
  const code = email.code ? `<p style="font-size:24px;font-weight:bold;letter-spacing:.15em">${escapeHtml(email.code)}</p>` : "";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f2ef;font-family:Arial,sans-serif;color:#111"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden"><tr><td style="padding:22px 28px;background:#080808;color:#fff;font-size:18px;font-weight:bold">Studio<span style="color:#eb0606">+</span></td></tr><tr><td style="padding:34px 28px"><h1 style="margin:0 0 16px;font-size:24px">${escapeHtml(email.subject)}</h1><p style="font-size:15px;line-height:1.7;color:#555">${greeting}</p>${link}${code}<p style="margin-top:34px;color:#777;font-size:12px">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.<br>Studio+ · Cocody Angré, Abidjan</p></td></tr></table></td></tr></table></body></html>`;
  const text = `${email.intro}${email.link ? `\n\n${email.action ?? "Continuer"} : ${email.link}` : ""}${email.code ? `\n\nCode : ${email.code}` : ""}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.\nStudio+ · Cocody Angré, Abidjan`;
  const delivery = await prisma.emailDelivery.create({ data: { event, recipient: email.to, attempts: 1 } });
  try {
    if (!apiKey || !from) throw new Error("Configuration Resend manquante.");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, html, text }),
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) throw new Error(`Resend a répondu avec le statut ${response.status}.`);
    const result = await response.json() as { id?: string };
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", providerId: result.id, sentAt: new Date() } });
  } catch (error) {
    await prisma.emailDelivery.update({ where: { id: delivery.id }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Erreur Resend inconnue." } });
    throw error;
  }
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PortalError } from "@/components/PortalErrorState";
import { PortalSkeleton } from "@/components/PortalStates";
import Link from "next/link";
import { trackStudioEvent } from "@/lib/analytics";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";

type Profile = { fullName: string; phone: string | null; email: string };
export function AccountSettings({ backHref, embedded = false }: { backHref: string; embedded?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const response = await fetch("/api/account/profile", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Profil indisponible.");
    setProfile(data.profile);
  }
  useEffect(() => { void load().catch(cause => setError(cause instanceof Error ? cause.message : "Profil indisponible.")); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/account/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), phone: form.get("phone") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      trackStudioEvent("account_profile_updated");
      setProfile(data.profile); setMessage("Profil enregistré.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification impossible."); }
    finally { setBusy(false); }
  }
  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase();
    try {
      const { error: cause } = await createSupabaseBrowserClient().auth.updateUser({ email }, { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(location.pathname)}` });
      if (cause) throw cause;
      trackStudioEvent("account_email_change_requested");
      setMessage("Un lien de confirmation a été envoyé. La nouvelle adresse sera activée après confirmation.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Demande de changement impossible."); }
    finally { setBusy(false); }
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; setBusy(true); setError(""); setMessage("");
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    try {
      const { error: cause } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (cause) throw cause;
      trackStudioEvent("account_password_updated");
      setMessage("Mot de passe mis à jour."); formElement.reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modification impossible."); }
    finally { setBusy(false); }
  }
  if (error && !profile) return <PortalError title={error} retry={() => void load().catch(cause => setError(String(cause)))} />;
  if (!profile) return <PortalSkeleton rows={3} />;
  return <section id="contenu" className={embedded ? "portal-account-settings" : "portal-page"}><div className={embedded ? undefined : "portal-wrap"}><div className="portal-topline"><Link href={backHref}>← Retour à mon espace</Link><PortalThemeToggle /></div><header className="portal-heading"><div><div className="eyebrow"><i />Compte</div><h1>Mes paramètres.</h1></div><p>Modifiez vos coordonnées et vos identifiants. Le changement d’e-mail nécessite une confirmation.</p></header>
    {message && <p className="portal-status" role="status">{message}</p>}{error && <p className="portal-status" role="alert">{error}</p>}
    <form className="portal-surface portal-auth-form" onSubmit={save}><h2>Coordonnées</h2><label>Nom complet<input name="fullName" required minLength={2} maxLength={100} defaultValue={profile.fullName} /></label><label>Téléphone<input name="phone" autoComplete="tel" maxLength={25} defaultValue={profile.phone ?? ""} /></label><button className="portal-action" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button></form>
    <form className="portal-surface portal-auth-form" onSubmit={changeEmail}><h2>Adresse e-mail</h2><p>Adresse actuelle : {profile.email}</p><label>Nouvelle adresse<input type="email" name="email" required maxLength={180} /></label><button className="portal-action secondary" disabled={busy}>Demander le changement</button></form>
    <form className="portal-surface portal-auth-form" onSubmit={changePassword}><h2>Mot de passe</h2><label>Nouveau mot de passe<input type="password" name="password" autoComplete="new-password" minLength={12} maxLength={200} required /></label><button className="portal-action secondary" disabled={busy}>Mettre à jour le mot de passe</button></form>
  </div></section>;
}

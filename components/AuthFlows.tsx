"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Flow = "signup" | "recovery" | "update";

export function AuthFlow({ flow }: { flow: Flow }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      if (flow === "signup") {
        const response = await fetch("/api/auth/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Création impossible.");
        if (result.needsEmailConfirmation) setSuccess(result.message);
        else location.assign("/espace");
      } else if (flow === "recovery") {
        const response = await fetch("/api/auth/recovery", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.get("email") }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Envoi impossible.");
        setSuccess(result.message);
      } else {
        const supabase = createSupabaseBrowserClient();
        const password = String(form.get("password") ?? "");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setSuccess("Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const title = flow === "signup" ? "Créer votre espace." : flow === "recovery" ? "Retrouver l’accès." : "Choisir un nouveau mot de passe.";
  const intro = flow === "signup" ? "Un espace pour suivre vos séances et vos projets." : flow === "recovery" ? "Nous vous enverrons un lien sécurisé par e-mail." : "Choisissez un mot de passe de 12 caractères minimum.";

  return <main className="auth-page"><section className="auth-brand"><Link href="/" aria-label="Retour à Studio+"><img src="/studio/assets/logo-light.png" alt="Studio+" width="160" height="65" /></Link><div><span>VOTRE ESPACE CRÉATIF</span><h1>Votre projet.<br />Votre rythme.<br /><em>Studio+.</em></h1><p>Des créations, des séances et des échanges au même endroit.</p></div><small>STUDIO+ — VOTRE PARTENAIRE CRÉATIF</small></section>
    <section className="auth-form-wrap"><form onSubmit={submit} className="auth-form"><Link className="auth-back" href="/connexion">← Retour à la connexion</Link><h2>{title}</h2><p>{intro}</p>
      {flow === "signup" && <label>Nom complet<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>}
      {flow !== "update" && <label>Votre e-mail<input type="email" name="email" autoComplete="email" required maxLength={180} /></label>}
      {(flow === "signup" || flow === "update") && <label>{flow === "signup" ? "Mot de passe" : "Nouveau mot de passe"}<input type="password" name="password" autoComplete="new-password" required minLength={12} maxLength={200} /></label>}
      <p className="auth-error" role="alert">{error}</p><p className="auth-success" role="status">{success}</p>
      {!success && <button disabled={busy} type="submit">{busy ? "Un instant…" : flow === "signup" ? "Créer mon espace ↗" : flow === "recovery" ? "Envoyer le lien ↗" : "Mettre à jour ↗"}</button>}
      {flow === "signup" && <p className="auth-note">Vous avez déjà un espace ? <Link href="/connexion">Se connecter</Link></p>}
    </form></section></main>;
}

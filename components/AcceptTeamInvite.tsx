"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AcceptTeamInvite({ tokenHash, next }: { tokenHash: string; next: "/equipe" | "/gestion" }) {
  const [message, setMessage] = useState("Vérification de votre invitation…");
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let live = true;
    (async () => {
      try {
        const check = await fetch(`/api/auth/accept-invite?token_hash=${encodeURIComponent(tokenHash)}`, { cache: "no-store" });
        if (!check.ok) throw new Error((await check.json()).error ?? "Invitation invalide.");
        const verified = await createSupabaseBrowserClient().auth.verifyOtp({ token_hash: tokenHash, type: "invite" });
        if (verified.error) throw verified.error;
        if (live) { setReady(true); setMessage("Choisissez un mot de passe pour activer votre accès."); }
      } catch (error) { if (live) setMessage(error instanceof Error ? error.message : "Impossible de vérifier l’invitation."); }
    })();
    return () => { live = false; };
  }, [next, router, tokenHash]);
  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 12 || password !== confirmation) { setMessage(password.length < 12 ? "Utilisez au moins 12 caractères." : "Les mots de passe ne correspondent pas."); return; }
    setBusy(true);
    try {
      const client = createSupabaseBrowserClient();
      const updated = await client.auth.updateUser({ password });
      if (updated.error) throw updated.error;
      const accepted = await fetch("/api/auth/accept-invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!accepted.ok) throw new Error((await accepted.json()).error ?? "Impossible d’activer l’invitation.");
      setMessage("Accès activé. Redirection…"); router.replace(next); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Impossible d’activer l’invitation."); }
    finally { setBusy(false); }
  }
  return <main id="contenu" className="portal-page"><div className="portal-wrap"><section className="portal-surface portal-auth-card"><div className="eyebrow"><i />Accès équipe</div><h1>Rejoignez Studio+.</h1><p role="status">{message}</p>{ready && <form className="portal-auth-form" onSubmit={activate}><label>Mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /></label><label>Confirmer le mot de passe<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label><button className="portal-action" disabled={busy}>{busy ? "Activation…" : "Activer mon accès"}</button></form>}</section></div></main>;
}

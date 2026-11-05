'use client';

import { useEffect, useState, type FormEvent } from 'react';
import './connexion.css';
import { Ink } from '@/components/handwriting/Ink';
import { trackStudioEvent } from '@/lib/analytics';
import { publicSiteOrigin } from '@/lib/public-origin';

export default function Connexion() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  useEffect(() => {
    const host = window.location.host.toLowerCase();
    setShowSignup(host === "localhost:3000" || host === "dev.studioplusci.com" || host === "dev-app.studioplusci.com" || host === "app.studioplusci.com");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const fields = new FormData(event.currentTarget);
    trackStudioEvent('login_submitted');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fields.get('email'), password: fields.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (typeof result.correctUrl === "string") location.assign(result.correctUrl);
        throw Error(result.error || 'Connexion impossible.');
      }
      trackStudioEvent('login_completed', { role: String(result.home || '').startsWith('/gestion') ? 'management' : String(result.home || '').startsWith('/equipe') ? 'team' : 'client' });
      const params = new URLSearchParams(location.search);
      const destination = params.get('return_to') || result.home || '/espace';
      const allowed = /^\/(?:espace(?:\/.*)?|equipe(?:\/.*)?|gestion(?:\/.*)?|reserver(?:\?[^#]*)?|parametres(?:\/.*)?|projets(?:\/[^?#]+)?|seances(?:\/[^?#]+)?|reservations(?:\/[^?#]+)?|statistiques|emails|utilisateurs|reglages|nouveau-mot-de-passe)$/.test(destination) && !destination.startsWith('//');
      const host = location.host.toLowerCase();
      const legacyHost = host === "localhost:3000" || host === "dev.studioplusci.com";
      const visibleDestination = legacyHost ? destination : destination === "/espace" ? "/" : destination.startsWith("/espace/") ? destination.slice("/espace".length) : destination.startsWith("/equipe/") ? destination.slice("/equipe".length) : destination === "/equipe" || destination === "/gestion" ? "/" : destination.startsWith("/gestion/") ? destination.slice("/gestion".length) : destination;
      location.assign(allowed ? visibleDestination : result.home || '/espace');
    } catch (error) { setError(error instanceof Error ? error.message : 'Réessayez dans un instant.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-brand">
      <a href={publicSiteOrigin()} aria-label="Retour à Studio+"><img src="/studio/assets/logo-light.png" alt="Studio+" width="160" height="65" /></a>
      <div><span>VOTRE ESPACE CRÉATIF</span><h1>Vos idées.<br/>Vos séances.<br/><Ink type="underline" trigger="enter" color="accent"><em>Votre studio.</em></Ink></h1><p>Retrouvez vos projets, préparez vos invités et choisissez votre prochain rendez-vous.</p></div>
      <small>STUDIO+ — VOTRE PARTENAIRE CRÉATIF</small>
    </section>
    <section className="auth-form-wrap"><form onSubmit={submit} className="auth-form">
      <a className="auth-back" href={publicSiteOrigin()}>← Retour au site</a>
      <h2>Heureux de vous <Ink type="underline" trigger="enter" color="accent">revoir.</Ink></h2><p>Connectez-vous à votre espace Studio+.</p>
      <label>Votre e-mail<input type="email" name="email" autoComplete="username" required maxLength={180} placeholder="vous@exemple.com" /></label>
      <label>Votre mot de passe<input type="password" name="password" autoComplete="current-password" required maxLength={200} /></label>
      <p className="auth-error" role="alert">{error}</p>
      <button disabled={busy} type="submit">{busy ? 'Connexion…' : 'Entrer dans mon espace ↗'}</button>
      {showSignup && <p className="auth-note">Vous découvrez votre espace ? <a href="/inscription">Créer un compte client</a>.</p>}
      <a className="auth-note" href="/mot-de-passe-oublie">Mot de passe oublié ?</a>
    </form></section>
  </main>;
}

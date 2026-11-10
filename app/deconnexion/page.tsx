'use client';
import { useState } from 'react';
import './deconnexion.css';
import { trackStudioEvent } from '@/lib/analytics';
export default function Deconnexion() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw Error('Déconnexion impossible. Réessayez.');
      trackStudioEvent('logout_completed');
      location.assign('/');
    } catch (error) { setError(error instanceof Error ? error.message : 'Erreur de connexion.'); setBusy(false); }
  }
  return (
    <main id="contenu" className="logout-page">
      <header className="logout-header">
        <a className="logout-brand" href="/" aria-label="Studio+, accueil">
          <img src="/studio/assets/logo-dark.png" alt="Studio+" />
        </a>
        <span className="logout-session"><i aria-hidden="true" /> Espace sécurisé</span>
      </header>

      <section className="logout-content" aria-labelledby="logout-title">
        <div className="logout-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="M19 5h7v22h-7M14 10l6 6-6 6M20 16H5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="logout-eyebrow">Votre espace Studio+</p>
        <h1 id="logout-title">À très <span>bientôt.</span></h1>
        <p className="logout-description">Vous êtes sur le point de fermer votre session. Vous pourrez retrouver votre espace à tout moment.</p>
        <button className="logout-action" onClick={logout} disabled={busy}>
          <span>{busy ? 'Déconnexion en cours…' : 'Se déconnecter'}</span>
          {!busy && <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        <p className="logout-error" role="alert" aria-live="polite">{error}</p>
        <a className="logout-back" href="/espace"><span aria-hidden="true">←</span> Revenir à mon espace</a>
      </section>

      <footer className="logout-footer"><span>STUDIO+ <i /> CRÉATION · ABIDJAN</span><span>À bientôt pour la suite.</span></footer>
    </main>
  );
}

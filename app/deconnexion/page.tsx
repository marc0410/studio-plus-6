'use client';
import { useState } from 'react';
import '../connexion/connexion.css';
import { Ink } from '@/components/handwriting/Ink';
export default function Deconnexion() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw Error('Déconnexion impossible. Réessayez.');
      location.assign('/');
    } catch (error) { setError(error instanceof Error ? error.message : 'Erreur de connexion.'); setBusy(false); }
  }
  return <main id="contenu" className="auth-form-wrap" style={{minHeight:'100dvh'}}><div className="auth-form"><h2>À très <Ink type="underline" trigger="enter" color="accent">bientôt.</Ink></h2><p>Vous souhaitez fermer votre session Studio+ ?</p><button onClick={logout} disabled={busy}>Se déconnecter</button><p role="alert">{error}</p><a className="auth-back" href="/espace">← Revenir à mon espace</a></div></main>;
}

'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Ink } from '@/components/handwriting/Ink';

const services = [
  { id: 'podcast', name: 'Podcast', image: 'studio-session.webp' },
  { id: 'photo', name: 'Shooting photo', image: 'catalogue-photo.webp' },
  { id: 'video', name: 'Production vidéo', image: 'studio-backstage.webp' },
];

type ConfigService = { id: string; name: string; duration: number; price: number | null; image: string };
type Bootstrap = {
  me: null | { name: string };
  config: { services: ConfigService[]; open: number; close: number; closedDays: number[] };
  bookings: unknown[];
};
const formatMoney = (value: number | null) => value === null ? 'À confirmer' : `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;

export function BookingWizard({ initialService, initialDate, initialTime }: { initialService: string; initialDate: string; initialTime: string }) {
  const validService = services.some(item => item.id === initialService) ? initialService : 'podcast';
  const hasReturnSlot = /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && /^\d{2}:(00|30)$/.test(initialTime);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(hasReturnSlot ? 3 : 1);
  const [service, setService] = useState(validService);
  const [date, setDate] = useState(hasReturnSlot ? initialDate : '');
  const [time, setTime] = useState(hasReturnSlot ? initialTime : '');
  const [occupied, setOccupied] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [fields, setFields] = useState({ name: '', email: '', phone: '', title: '', notes: '' });

  useEffect(() => {
    let active = true;
    fetch('/api/studio')
      .then(response => response.json())
      .then(result => {
        if (!result?.config) throw new Error('Impossible de charger les prestations.');
        if (active) setData(result);
      })
      .catch(() => { if (active) setMessage('Impossible de charger les prestations. Réessayez dans un instant.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(`/api/studio?action=availability&date=${date}`)
      .then(response => response.json())
      .then(result => setOccupied(result.occupied || []))
      .catch(() => setMessage('Les disponibilités ne sont pas accessibles pour le moment.'));
  }, [date]);

  const configService = data?.config.services.find(item => item.id === service);
  const serviceOptions = data?.config.services.length ? data.config.services : services.map(item => ({ ...item, duration: 60, price: null }));
  const dateLabel = date ? new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00Z`)) : 'À choisir';
  const times = useMemo(() => {
    if (!date || !data) return [];
    if (data.config.closedDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())) return [];
    const selected = data.config.services.find(item => item.id === service);
    if (!selected) return [];
    const available: string[] = [];
    for (let minutes = data.config.open * 60; minutes + selected.duration <= data.config.close * 60; minutes += 30) {
      const start = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      let blocked = occupied.includes(start) || Date.parse(`${date}T${start}:00Z`) <= Date.now();
      for (let slot = minutes; slot < minutes + selected.duration; slot += 30) {
        const timeSlot = `${String(Math.floor(slot / 60)).padStart(2, '0')}:${String(slot % 60).padStart(2, '0')}`;
        if (occupied.includes(timeSlot)) blocked = true;
      }
      if (!blocked) available.push(start);
    }
    return available;
  }, [date, data, occupied, service]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data?.me) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'booking', service, date, time, ...fields }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'La demande n’a pas pu être enregistrée.');
      setSent(true);
      setMessage(result.message || 'Votre demande a été envoyée.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'La demande a échoué.');
    } finally {
      setBusy(false);
    }
  }

  const returnPath = `/reserver?service=${service}&date=${date}&time=${time}`;

  if (!data) {
    return <main id="contenu" className="booking-page booking-page--loading">
      <Link className="booking-back-link" href="/">← Retour au studio</Link>
      <section className="booking-empty-state" aria-live="polite">
        <span className="booking-loader" aria-hidden="true" />
        <div className="eyebrow"><i />Votre prochaine séance</div>
        <h1>{loading ? 'Préparons votre séance.' : 'Le formulaire est momentanément indisponible.'}</h1>
        <p>{loading ? 'Nous chargeons les prestations et les disponibilités du studio.' : message}</p>
        {!loading && <button className="button" type="button" onClick={() => window.location.reload()}>Réessayer ↗</button>}
      </section>
    </main>;
  }

  return (
    <main id="contenu" className="booking-page">
      <Link className="booking-back-link" href="/">← Retour au studio</Link>
      <div className="booking-hero">
        <div><div className="eyebrow"><i />Votre prochaine séance</div><h1>On vous garde<br />une <Ink type="circle" trigger="enter" color="accent"><em>place.</em></Ink></h1></div>
        <p>Une demande en quelques étapes. L’équipe confirme ensuite la séance et son montant.</p>
      </div>
      {sent ? (
        <section className="booking-panel booking-success" aria-live="polite">
          <div className="eyebrow"><i />Demande enregistrée</div>
          <h2>Votre projet est dans la <Ink type="circle" trigger="enter" color="accent">feuille de service.</Ink></h2>
          <p>La demande est bien enregistrée. L’équipe du studio vous confirmera le créneau et le montant.</p>
          <div className="booking-success-details"><span>{configService?.name || service}</span><span>{dateLabel}</span><span>{time}</span></div>
          <Link href="/espace" className="button" style={{ marginTop: 24 }}>Ouvrir mon espace ↗</Link>
        </section>
      ) : (
        <div className="booking-grid">
          <form className="booking-panel booking-form" onSubmit={submit}>
            <nav className="booking-steps" aria-label="Étapes de réservation">{['Projet', 'Créneau', 'Vous'].map((label, index) => <button type="button" className={`${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'done' : ''}`} key={label} onClick={() => index + 1 < step && setStep(index + 1)} disabled={index + 1 > step}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span></button>)}</nav>
            {step === 1 && <>
              <div className="booking-step-kicker">Étape 01 / Le projet</div><h2>Quel projet préparez-vous ?</h2>
              <p className="form-hint">Choisissez la prestation que vous souhaitez réserver.</p>
              <div className="booking-service-list">{serviceOptions.map(item => <button key={item.id} type="button" onClick={() => setService(item.id)} aria-pressed={service === item.id} className="booking-service"><Image src={`/studio/assets/${item.image}`} alt="" width={128} height={112} /><span><strong>{item.name}</strong><small>{item.duration} min · {formatMoney(item.price)}</small></span><b>{service === item.id ? '✓' : '＋'}</b></button>)}</div>
              <button className="button" type="button" onClick={() => setStep(2)}>Continuer ↗</button>
            </>}
            {step === 2 && <>
              <div className="booking-step-kicker">Étape 02 / Le créneau</div><h2>Choisissez un créneau.</h2>
              <p className="form-hint">Les horaires affichés tiennent compte de la durée de la prestation.</p>
              <div className="form-grid"><label className="wide">Date souhaitée<input type="date" min={new Date().toISOString().slice(0, 10)} max={new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)} value={date} onChange={event => { setDate(event.target.value); setTime(''); }} required /></label></div>
              {date && <div className="booking-availability"><div className="booking-availability-heading"><span>Horaires disponibles</span><small>{times.length ? `${times.length} créneau${times.length > 1 ? 'x' : ''}` : 'Complet'}</small></div><div className="time-grid" role="group" aria-label="Horaires disponibles">{times.length ? times.map(slot => <button type="button" key={slot} onClick={() => setTime(slot)} aria-pressed={time === slot}>{slot}</button>) : <p className="project-note">Aucun créneau disponible à cette date. Essayez un autre jour.</p>}</div></div>}
              <div className="quiz-controls"><button className="button ghost" type="button" onClick={() => setStep(1)}>← Retour</button><button className="button" type="button" disabled={!date || !time} onClick={() => setStep(3)}>Continuer ↗</button></div>
            </>}
            {step === 3 && <>
              {!data?.me ? <>
                <div className="booking-step-kicker">Étape 03 / Votre accès</div><h2>Connectez-vous pour continuer.</h2>
                <p className="form-hint">La demande est enregistrée dans votre espace Studio+. Votre projet et votre créneau seront conservés après connexion.</p>
                <Link className="button" href={`/connexion?return_to=${encodeURIComponent(returnPath)}`}>Se connecter ↗</Link>
                <div><button className="button ghost" type="button" onClick={() => setStep(2)}>← Modifier le créneau</button></div>
              </> : <>
                <div className="booking-step-kicker">Étape 03 / Vos coordonnées</div><h2>Comment vous joindre ?</h2>
                <div className="form-grid">
                  <label>Nom complet<input required minLength={2} maxLength={100} autoComplete="name" value={fields.name} onChange={event => setFields({ ...fields, name: event.target.value })} /></label>
                  <label>E-mail<input type="email" required maxLength={180} autoComplete="email" value={fields.email} onChange={event => setFields({ ...fields, email: event.target.value })} /></label>
                  <label>Téléphone / WhatsApp<input type="tel" required value={fields.phone} onChange={event => setFields({ ...fields, phone: event.target.value })} /></label>
                  <label>Titre de la séance<input required minLength={2} maxLength={150} value={fields.title} onChange={event => setFields({ ...fields, title: event.target.value })} /></label>
                  <label className="wide">Quelques détails<textarea rows={4} maxLength={3000} value={fields.notes} onChange={event => setFields({ ...fields, notes: event.target.value })} /></label>
                </div>
                <div className="quiz-controls"><button className="button ghost" type="button" onClick={() => setStep(2)}>← Retour</button><button className="button" type="submit" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer ma demande ↗'}</button></div>
              </>}
            </>}
            {message && <p role="status" className="status">{message}</p>}
          </form>
          <aside className="booking-summary">
            <div className="booking-summary-heading"><div className="eyebrow"><i />Votre réservation</div><span className="booking-summary-step">0{step} / 03</span></div>
            <h2>{configService?.name || service}</h2>
            <dl><div><dt>Durée</dt><dd>{configService?.duration || '—'} min</dd></div><div><dt>Date</dt><dd>{dateLabel}</dd></div><div><dt>Horaire</dt><dd>{time || 'À choisir'}{time && ' · GMT'}</dd></div></dl>
            <div className="price-value">{formatMoney(configService?.price ?? null)}</div>
            <p className="project-note">Le créneau et le montant sont confirmés par l’équipe. Aucun paiement en ligne n’est effectué.</p><hr />
            <p>Studio Plus<br />Cocody Angré Nouveau CHU<br />Lundi–samedi · 8 h 30–20 h</p>
          </aside>
        </div>
      )}
    </main>
  );
}

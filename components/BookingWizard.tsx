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
    fetch('/api/studio')
      .then(response => response.json())
      .then(result => setData(result))
      .catch(() => setMessage('Impossible de charger les prestations. Réessayez dans un instant.'));
  }, []);

  useEffect(() => {
    if (!date) return;
    fetch(`/api/studio?action=availability&date=${date}`)
      .then(response => response.json())
      .then(result => setOccupied(result.occupied || []))
      .catch(() => setMessage('Les disponibilités ne sont pas accessibles pour le moment.'));
  }, [date]);

  const configService = data?.config.services.find(item => item.id === service);
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

  return (
    <main id="contenu" className="booking-page">
      <div className="eyebrow"><i />Votre prochaine séance</div>
      <div className="section-heading" style={{ marginTop: 18 }}>
        <h1 style={{ fontSize: 'clamp(40px,5vw,70px)' }}>On vous garde<br />une <Ink type="underline" trigger="enter" color="accent"><em>place.</em></Ink></h1>
        <p>Une demande en quelques étapes. L’équipe confirme ensuite la séance et son montant.</p>
      </div>
      {sent ? (
        <section className="booking-panel">
          <div className="eyebrow"><i />Demande enregistrée</div>
          <h2 style={{ margin: '22px 0' }}>Votre projet est dans la <Ink type="underline" trigger="enter" color="accent">feuille de service.</Ink></h2>
          <p>La séance reste à confirmer par l’équipe du studio. Retrouvez son statut dans votre espace client.</p>
          <Link href="/espace" className="button" style={{ marginTop: 24 }}>Ouvrir mon espace ↗</Link>
        </section>
      ) : (
        <div className="booking-grid">
          <form className="booking-panel" onSubmit={submit}>
            <div className="booking-steps">{['Projet', 'Créneau', 'Vous'].map((label, index) => <span className={step === index + 1 ? 'active' : ''} key={label}>{String(index + 1).padStart(2, '0')} · {label}</span>)}</div>
            {step === 1 && <>
              <h2>Quel projet <Ink type="underline" trigger="enter" color="accent">préparez-vous ?</Ink></h2>
              <p className="form-hint">Choisissez la prestation que vous souhaitez réserver.</p>
              {services.map(item => <button key={item.id} type="button" onClick={() => setService(item.id)} aria-pressed={service === item.id} className="booking-service"><Image src={`/studio/assets/${item.image}`} alt="" width={128} height={112} /><span>{item.name}</span><b>{service === item.id ? '●' : '○'}</b></button>)}
              <button className="button" type="button" onClick={() => setStep(2)}>Continuer ↗</button>
            </>}
            {step === 2 && <>
              <h2>Choisissez un <Ink type="underline" trigger="enter" color="accent">créneau.</Ink></h2>
              <div className="form-grid"><label className="wide">Date souhaitée<input type="date" min={new Date().toISOString().slice(0, 10)} max={new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)} value={date} onChange={event => { setDate(event.target.value); setTime(''); }} required /></label></div>
              {date && <div className="time-grid" role="group" aria-label="Horaires disponibles">{times.length ? times.map(slot => <button type="button" key={slot} onClick={() => setTime(slot)} aria-pressed={time === slot}>{slot}</button>) : <p className="project-note">Aucun créneau disponible à cette date.</p>}</div>}
              <div className="quiz-controls"><button className="button ghost" type="button" onClick={() => setStep(1)}>← Retour</button><button className="button" type="button" disabled={!date || !time} onClick={() => setStep(3)}>Continuer ↗</button></div>
            </>}
            {step === 3 && <>
              {!data?.me ? <>
                <h2>Connectez-vous <Ink type="underline" trigger="enter" color="accent">pour continuer.</Ink></h2>
                <p className="form-hint">La demande est enregistrée dans votre espace Studio+. Votre projet et votre créneau seront conservés après connexion.</p>
                <Link className="button" href={`/connexion?return_to=${encodeURIComponent(returnPath)}`}>Se connecter ↗</Link>
                <div><button className="button ghost" type="button" onClick={() => setStep(2)}>← Modifier le créneau</button></div>
              </> : <>
                <h2>Comment vous <Ink type="underline" trigger="enter" color="accent">joindre ?</Ink></h2>
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
            <div className="eyebrow"><i />Votre feuille de service</div>
            <h2 style={{ fontSize: 24, margin: '18px 0' }}>{configService?.name || service}</h2>
            <p>Durée · {configService?.duration || '—'} min</p><p>Date · {date || 'À choisir'}</p><p>Horaire · {time || 'À choisir'} · GMT</p>
            <div className="price-value" style={{ marginTop: 24 }}>{formatMoney(configService?.price ?? null)}</div>
            <p className="project-note">Le créneau et le montant sont confirmés par l’équipe. Aucun paiement en ligne n’est effectué.</p><hr />
            <p>Studio Plus<br />Cocody Angré Nouveau CHU<br />Lundi–samedi · 8 h 30–20 h</p>
          </aside>
        </div>
      )}
    </main>
  );
}

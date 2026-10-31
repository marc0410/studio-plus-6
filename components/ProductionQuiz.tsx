'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { quizQuestions } from '@/lib/site-content';

type ConfigService = { id: string; name: string; duration: number; price: number | null };

export function ProductionQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [chosen, setChosen] = useState('');
  const [services, setServices] = useState<ConfigService[]>([]);

  useEffect(() => {
    fetch('/api/studio')
      .then(response => response.json())
      .then(result => { if (Array.isArray(result.config?.services)) setServices(result.config.services); })
      .catch(() => {});
  }, []);

  function next() {
    if (!chosen) return;
    const updated = [...answers];
    updated[step] = chosen;
    setAnswers(updated);
    setChosen(updated[step + 1] || '');
    setStep(step + 1);
  }

  function back() {
    if (step === 0) return;
    const previous = step - 1;
    setStep(previous);
    setChosen(answers[previous] || '');
  }

  const selectedService = services.find(item => item.id === answers[0]);
  const serviceLabel = quizQuestions[0].answers.find(item => item.value === answers[0])?.title;
  const budgetLabel = quizQuestions[2].answers.find(item => item.value === answers[2])?.title;

  return (
    <section className="section brief-section" id="brief" aria-labelledby="brief-title" data-scene>
      <div className="brief-intro">
        <span className="section-index">Le briefing / Votre projet</span>
        <h2 id="brief-title">On commence<br />par votre idée.</h2>
        <p>Trois réponses suffisent pour préparer votre feuille de service. Vous pouvez consulter les prestations sans laisser vos coordonnées.</p>
      </div>
      <div className="quiz" aria-live="polite">
        <div className="quiz-topline"><span>Feuille de service · Studio Plus</span><span>{step < 3 ? `0${step + 1} / 03` : 'BRIEF PRÊT'}</span></div>
        <div className="quiz-progress" aria-hidden="true"><span style={{ width: `${Math.min(step + 1, 3) / 3 * 100}%` }} /></div>
        <AnimatePresence mode="wait">
          {step < 3 ? (
            <motion.div key={step} className="quiz-question" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
              <h3>{quizQuestions[step].title}</h3>
              <div className={`quiz-options ${step === 0 ? 'quiz-options-images' : ''}`} role="group" aria-label={quizQuestions[step].title}>
                {quizQuestions[step].answers.map(answer => (
                  <motion.button type="button" key={answer.value} onClick={() => setChosen(answer.value)} aria-pressed={chosen === answer.value} whileTap={{ scale: 0.985 }}>
                    {'image' in answer && <span className="quiz-option-image"><Image src={`/studio/assets/${answer.image}`} alt="" fill sizes="(max-width: 620px) 45vw, 20vw" /></span>}
                    <span className="quiz-option-text"><strong>{answer.title}</strong>{answer.detail && <small>{answer.detail}</small>}</span>
                    <span className="quiz-option-mark" aria-hidden="true">{chosen === answer.value ? '✓' : '↗'}</span>
                  </motion.button>
                ))}
              </div>
              <div className="quiz-controls"><button className="text-button" type="button" onClick={back} disabled={step === 0}>← Retour</button><button className="button" type="button" onClick={next} disabled={!chosen}>{step === 2 ? 'Voir mon récapitulatif' : 'Continuer'} <span aria-hidden="true">↗</span></button></div>
            </motion.div>
          ) : (
            <motion.div key="result" className="call-sheet" initial={{ opacity: 0, clipPath: 'inset(0 0 12% 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 0.5 }}>
              <p className="call-sheet-kicker">Votre production</p>
              <h3>{serviceLabel}</h3>
              <div className="call-sheet-grid"><div><span>Ambiance</span><strong>{answers[1]}</strong></div><div><span>Budget envisagé</span><strong>{budgetLabel}</strong></div><div><span>Durée de référence</span><strong>{selectedService ? `${selectedService.duration} min` : 'À définir'}</strong></div><div><span>Tarif du studio</span><strong>{selectedService?.price != null ? `${new Intl.NumberFormat('fr-FR').format(selectedService.price)} FCFA` : 'À confirmer'}</strong></div></div>
              <p className="call-sheet-note">Le studio confirme le prix et le créneau selon les détails de votre projet.</p>
              <div className="quiz-controls"><button className="text-button" type="button" onClick={() => { setStep(2); setChosen(answers[2] || ''); }}>← Modifier</button><Link className="button" href={`/reserver?service=${answers[0] || 'podcast'}`}>Réserver cette prestation <span aria-hidden="true">↗</span></Link></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

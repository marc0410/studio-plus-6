import Link from 'next/link';
import Image from 'next/image';
import { PricingCards } from '@/components/PricingCards';
import { SceneMotion } from '@/components/SceneMotion';
import { StudioReel } from '@/components/StudioReel';
import { Ink } from '@/components/handwriting/Ink';
import { FullpageController } from '@/components/FullpageController';

export default function Home() {
  return (
    <main id="contenu" className="home-page">
      <FullpageController />
      <SceneMotion />
      <section id="hero" className="hero" aria-labelledby="hero-title" tabIndex={-1}>
        <Image className="hero-image" src="/studio/assets/hero-microphone.webp" alt="Microphone de studio éclairé d’un reflet rouge" fill priority sizes="100vw" />
        <div className="hero-inner hero-copy">
          <p className="hero-kicker"><span className="live-dot" /> Studio créatif · photo, vidéo & podcast</p>
          <h1 id="hero-title" tabIndex={-1}><span>Votre</span><br /><span>Partenaire</span><br /><em>Créatif.</em></h1>
          <p className="hero-description">L’image. Le son. L’émotion.<br />Nous donnons de l’ampleur à ce que vous avez à raconter.</p>
          <div className="hero-actions"><Link className="hero-discover" href="#showcase">Entrez dans notre univers <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="hero-tag">VOTRE PARTENAIRE CRÉATIF.<b>DU PREMIER MOT À LA DERNIÈRE IMAGE.</b></div>
        <Link className="hero-stamp" href="/reserver"><span aria-hidden="true">↗</span>Et si on créait<br />ensemble ?</Link>
        <div className="hero-bottom"><a href="#showcase">DÉFILER POUR DÉCOUVRIR <span>↓</span></a><span>PLUS D’IDÉES. PLUS D’ÉMOTIONS.</span><span className="hero-wave" aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} />)}</span></div>
      </section>

      <StudioReel />

      <section className="section pricing" id="tarifs" aria-labelledby="pricing-title" data-scene><div className="section-heading"><div><span className="section-index">Prestations</span><h2 id="pricing-title">À chaque projet<br /><Ink type="underline" trigger="enter" color="accent">son point de départ.</Ink></h2></div><p>Choisissez votre format. Nous confirmerons ensemble le contenu et le tarif de votre séance.</p></div><PricingCards /><div className="pricing-bottom"><p>Vous avez une idée qui sort du cadre ?</p><Link className="text-link" href="/reserver">Parlons de votre projet <span aria-hidden="true">↗</span></Link></div></section>

      <Faq />

    </main>
  );
}

function Faq() {
  const entries = [
    ['Comment réserver une séance ?', 'Choisissez une prestation, proposez un créneau et envoyez votre demande. L’équipe confirme ensuite les détails avec vous.'],
    ['Le créneau est-il confirmé tout de suite ?', 'Votre choix est une demande. La confirmation apparaît dans votre espace Studio Plus après validation par l’équipe.'],
    ['Quel est le délai de livraison ?', 'Il dépend du format et du volume à produire. Nous le précisons pendant la préparation du projet.'],
    ['Le matériel est-il fourni pour un podcast ?', 'Indiquez le format et le nombre de participants dans votre brief. Nous préparerons le dispositif adapté.'],
    ['Comment se passe le paiement ?', 'L’équipe vous communique le montant et les modalités avant de confirmer la séance. Aucun paiement en ligne n’est demandé ici.'],
  ];
  return <section className="section faq-section" aria-labelledby="faq-title" data-scene><div className="faq-title"><span className="section-index">En coulisses</span><h2 id="faq-title">On répond<br />à vos <Ink type="circle" trigger="enter" color="accent">questions.</Ink></h2><p>Une autre question en tête ? Dites-nous ce que vous préparez.</p><Link className="text-link" href="/reserver">Nous contacter <span aria-hidden="true">↗</span></Link></div><div className="faq-list">{entries.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>;
}

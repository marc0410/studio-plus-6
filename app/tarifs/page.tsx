import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Ink } from '@/components/handwriting/Ink';
import { PricingCards } from '@/components/PricingCards';
import { CONTACT } from '@/data/pricing';

export const metadata: Metadata = {
  title: 'Tarifs podcast',
  description: 'Comparez les formules podcast solo et Studio+ et choisissez le niveau de production adapté à votre projet.',
};

export default function Tarifs() {
  return (
    <main id="contenu" className="pricing-page">
      <section className="pricing-page__hero" aria-labelledby="pricing-page-title">
        <Image
          className="pricing-page__hero-image"
          src="/studio/assets/studio-session.webp"
          alt="Deux personnes enregistrent une conversation dans le studio podcast Studio+"
          fill
          priority
          sizes="100vw"
        />
        <div className="pricing-page__hero-copy">
          <div className="eyebrow"><i /> LE CATALOGUE PODCAST STUDIO+</div>
          <h1 id="pricing-page-title">Votre voix.<br />Votre <Ink type="underline" trigger="enter" color="accent"><em>format.</em></Ink></h1>
          <p>Du podcast solo au plateau multi-caméras, retrouvez les contenus de chaque formule et son tarif.</p>
          <div className="pricing-page__hero-meta">
            <span>08 formules</span><span>·</span><span>Deux formats de production</span>
          </div>
        </div>
        <a className="pricing-page__scroll" href="#catalogue">EXPLORER LES FORMULES <span aria-hidden="true">↓</span></a>
      </section>

      <section className="section pricing pricing-page__catalogue" id="catalogue" aria-label="Catalogue des formules podcast">
        <div className="pricing-page__intro">
          <div>
            <span className="catalogue-pricing__index">TARIFS & CONTENUS</span>
            <h2>Choisissez votre<br />point de <Ink type="circle" trigger="enter" color="accent">départ.</Ink></h2>
          </div>
          <p>Chaque formule rassemble le tournage et les livrables associés. Comparez les options, puis choisissez votre créneau dans l’espace de réservation Studio+.</p>
        </div>
        <PricingCards />
      </section>

      <section className="pricing-page__contact" aria-labelledby="pricing-contact-title">
        <div>
          <span className="catalogue-pricing__index">ON PRÉPARE LA SUITE</span>
          <h2 id="pricing-contact-title">On enregistre<br />votre <em>idée ?</em></h2>
          <p>Choisissez votre créneau et transmettez les détails de votre projet directement dans l’espace de réservation Studio+.</p>
        </div>
        <div className="pricing-page__contact-actions">
          <Link className="button" href="/reserver">Préparer une réservation <span aria-hidden="true">↗</span></Link>
          {CONTACT.phones.map((phone) => <a key={phone.href} href={`tel:${phone.href}`}>{phone.label}</a>)}
          <Link href="/reserver">Préparer un brief <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}

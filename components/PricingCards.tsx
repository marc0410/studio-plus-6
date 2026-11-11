'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import {
  PODCAST_FORMULAS,
  DEPOSIT_RULES,
  formatPriceAccessible,
  formatPrice,
  formatPriceWithCurrency,
  getDeposit,
  getPlanDepositWording,
  getPlansByCategory,
  type PodcastCategory,
  type PodcastFormula,
} from '@/data/pricing';

const categories: Array<{ id: PodcastCategory; label: string; summary: string }> = [
  { id: 'duo', label: 'Podcast à deux ou plus', summary: 'Des formules pour enregistrer à plusieurs, du plateau deux caméras à la production complète.' },
  { id: 'solo', label: 'Podcast solo', summary: 'Un format individuel, du tournage simple à la production montée.' },
];

function reservationLine(plan: PodcastFormula) {
  if (plan.category === 'duo') return `Avance à la réservation : ${formatPriceWithCurrency(getDeposit(plan))}`;
  if (DEPOSIT_RULES[plan.depositRule].rate === 1) return 'Paiement à la réservation : 100 %';
  return `Avance à la réservation : ${formatPriceWithCurrency(getDeposit(plan))} (50 %)`;
}

function FormulaCard({ plan }: { plan: PodcastFormula }) {
  const deposit = DEPOSIT_RULES[plan.depositRule];
  return (
    <article className="catalogue-pricing__card">
      <div className="catalogue-pricing__card-topline">
        <span>{plan.category === 'duo' ? 'PODCAST À PLUSIEURS' : 'PODCAST SOLO'}</span>
        <span>{Math.round(deposit.rate * 100)} % à la réservation</span>
      </div>
      <h3>{plan.name}</h3>
      <p className="catalogue-pricing__amount" aria-label={formatPriceAccessible(plan.price)}>
        {formatPrice(plan.price)} <span>Frs</span>
      </p>
      <ul className="catalogue-pricing__features">
        {plan.features.map((feature, index) => <li key={`${plan.id}-${index}`}>{feature}</li>)}
      </ul>
      <p className="catalogue-pricing__advance">{reservationLine(plan)}</p>
      <Link className="catalogue-pricing__action" href={`/reserver?formule=${encodeURIComponent(plan.id)}`}>
        Réserver cette formule <span aria-hidden="true">↗</span>
      </Link>
      <span className="sr-only">{getPlanDepositWording(plan)}</span>
    </article>
  );
}

export function PricingCards() {
  const [active, setActive] = useState<PodcastCategory>('duo');
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = categories.find((category) => category.id === active)!;

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0
      : event.key === 'End' ? categories.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : categories.length - 1)) % categories.length;
    const next = categories[nextIndex];
    setActive(next.id);
    tabsRef.current[nextIndex]?.focus();
  }

  return (
    <div className="catalogue-pricing">
      <div className="catalogue-pricing__tabs" role="tablist" aria-label="Catégories de podcast">
        {categories.map((category, index) => (
          <button
            key={category.id}
            ref={(element) => { tabsRef.current[index] = element; }}
            type="button"
            id={`pricing-tab-${category.id}`}
            role="tab"
            aria-selected={active === category.id}
            aria-controls={`pricing-panel-${category.id}`}
            tabIndex={active === category.id ? 0 : -1}
            onClick={() => setActive(category.id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            <span>0{index + 1}</span>{category.label}<i aria-hidden="true">↗</i>
          </button>
        ))}
      </div>
      <section
        className={`catalogue-pricing__group catalogue-pricing__group--${active}`}
        id={`pricing-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`pricing-tab-${active}`}
        tabIndex={0}
      >
        <header className="catalogue-pricing__group-heading">
          <div>
            <span className="catalogue-pricing__index">CATALOGUE / 0{categories.findIndex((category) => category.id === active) + 1}</span>
            <h2>{selected.label}<span>.</span></h2>
            <p>{selected.summary}</p>
          </div>
          <p className="catalogue-pricing__deposit-note">{active === 'duo'
            ? DEPOSIT_RULES.duo.wording
            : `${DEPOSIT_RULES['solo-standard'].wording} ${DEPOSIT_RULES['solo-premium'].wording}`}</p>
        </header>
        <div className="catalogue-pricing__grid">
          {getPlansByCategory(active).map((plan) => <FormulaCard key={plan.id} plan={plan} />)}
        </div>
      </section>
      <span className="sr-only">{PODCAST_FORMULAS.length} formules disponibles</span>
    </div>
  );
}

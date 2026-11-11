import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  DEPOSIT_RULES,
  PODCAST_FORMULAS,
  formatPrice,
  getDeposit,
  getPlan,
  getPlansByCategory,
} from '../data/pricing.ts';

test('les huit formules et leurs tarifs correspondent aux catalogues', () => {
  assert.deepEqual(
    PODCAST_FORMULAS.map(({ id, price }) => [id, price]),
    [
      ['duo-bronze', 60000],
      ['duo-gold', 80000],
      ['duo-platinum', 95000],
      ['duo-pro', 120000],
      ['duo-vip', 280000],
      ['solo-starter', 35000],
      ['solo-pro', 55000],
      ['solo-premium', 80000],
    ],
  );
  assert.equal(getPlansByCategory('solo').length, 3);
  assert.equal(getPlansByCategory('duo').length, 5);
  assert.equal(formatPrice(60000), '60\u00a0000');
});

test('les avances sont calculées depuis la règle propre à chaque formule', () => {
  assert.deepEqual(
    PODCAST_FORMULAS.map(plan => [plan.id, getDeposit(plan)]),
    [
      ['duo-bronze', 30000],
      ['duo-gold', 40000],
      ['duo-platinum', 47500],
      ['duo-pro', 60000],
      ['duo-vip', 140000],
      ['solo-starter', 35000],
      ['solo-pro', 55000],
      ['solo-premium', 40000],
    ],
  );
  assert.equal(DEPOSIT_RULES.duo.nonRefundable, true);
  assert.equal(DEPOSIT_RULES['solo-standard'].nonRefundable, false);
  assert.equal(DEPOSIT_RULES['solo-premium'].nonRefundable, false);
  assert.equal(getPlan('solo-starter').depositRule, 'solo-standard');
});

test('les boutons des offres ouvrent la réservation interne avec la formule', async () => {
  const cards = await readFile(new URL('../components/PricingCards.tsx', import.meta.url), 'utf8');
  const booking = await readFile(new URL('../components/BookingWizard.tsx', import.meta.url), 'utf8');
  assert.match(cards, /href=\{`\/reserver\?formule=\$\{encodeURIComponent\(plan\.id\)\}`\}/);
  assert.doesNotMatch(cards, /wa\.me|whatsapp/i);
  assert.match(booking, /formule:\s*selectedFormula\?\.id/);
  assert.match(booking, /\/api\/bookings/);
});

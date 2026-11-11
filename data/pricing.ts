export type PodcastCategory = 'duo' | 'solo';
export type DepositRuleId = 'duo' | 'solo-standard' | 'solo-premium';

export type PodcastFormula = {
  id: string;
  name: string;
  price: number;
  category: PodcastCategory;
  depositRule: DepositRuleId;
  durationMin: number;
  durationMax: number;
  participantsMin: number;
  participantsMax: number;
  decorMode: 'standard' | 'choice';
  features: readonly string[];
};

export type PodcastDecor = {
  id: string;
  name: string;
  category: PodcastCategory;
  image: string;
};

export const CURRENCY = 'Frs';
export const CURRENCY_NAME = 'francs CFA';
export const WHATSAPP_NUMBER = '2250718958943';

export const CONTACT = {
  phones: [
    { label: '+225 07 18 95 89 43', href: '+2250718958943', primary: true },
    { label: '+225 05 64 05 49 49', href: '+2250564054949', primary: false },
    { label: '+225 07 01 11 04 50', href: '+2250701110450', primary: false },
  ],
  email: 'bonjour@studioplus.ci',
  address: 'Abidjan, Cocody Angré Nouveau CHU',
  website: 'www.studioplusci.com',
  hours: 'Lundi au samedi, 8h30 à 20h00',
  social: { facebook: '', instagram: '', linkedin: '', tiktok: '' },
} as const;

export const DEPOSIT_RULES: Record<DepositRuleId, { rate: number; nonRefundable: boolean; wording: string }> = {
  duo: {
    rate: 0.5,
    nonRefundable: true,
    wording: "Une avance de 50% du forfait choisi. En cas d'annulation du RENDEZ-VOUS, cette avance est non remboursable.",
  },
  'solo-standard': {
    rate: 1,
    nonRefundable: false,
    wording: '100 % du montant total est dû à la réservation pour les packs Starter et Pro.',
  },
  'solo-premium': {
    rate: 0.5,
    nonRefundable: false,
    wording: '50 % du montant total est dû à la réservation pour la formule Premium.',
  },
};

export const PODCAST_CATEGORY_DESCRIPTIONS: Record<PodcastCategory, string> = {
  duo: 'Découvrez l’univers du podcast professionnel avec des formules adaptées à tous vos projets de communication et de création de contenu.',
  solo: "Le podcast solo : un format d'émission audio ou vidéo animé par une seule personne, dont l'objectif est de partager des connaissances, des conseils, des analyses ou des expériences.",
};

export const PODCAST_FORMULAS: readonly PodcastFormula[] = [
  {
    id: 'duo-bronze', name: 'Bronze', price: 60000, category: 'duo', depositRule: 'duo', 
    durationMin: 60, durationMax: 60, participantsMin: 2, participantsMax: 2, decorMode: 'choice',
    features: ['2 intervenants', '1h de tournage', '2 micros', '2 caméras cinématique Sony', 'Fichiers bruts', 'Décor au choix', '2 photos bonus'],
  },
  {
    id: 'duo-gold', name: 'Gold', price: 80000, category: 'duo', depositRule: 'duo', 
    durationMin: 60, durationMax: 60, participantsMin: 2, participantsMax: 2, decorMode: 'choice',
    features: ['2 intervenants', '1h de tournage', '2 micros', '2 caméras cinématique Sony fx3', 'Montage', 'Décor au choix', '1 teaser', '3 photos bonus'],
  },
  {
    id: 'duo-platinum', name: 'Platinum', price: 95000, category: 'duo', depositRule: 'duo', 
    durationMin: 60, durationMax: 90, participantsMin: 2, participantsMax: 2, decorMode: 'choice',
    features: ['2 intervenants', '1h - 1h30 de tournage', '2 micros', '3 caméras (2 caméras Sony fx3 + 1 caméra Sony A74)', 'Montage', 'Décor au choix', '1 teaser', 'Miniature', 'Logo', '3 photos bonus'],
  },
  {
    id: 'duo-pro', name: 'PRO', price: 120000, category: 'duo', depositRule: 'duo', 
    durationMin: 60, durationMax: 90, participantsMin: 2, participantsMax: 3, decorMode: 'choice',
    features: ['2 - 3 intervenants', '1h - 1h30 de tournage', '4 caméras cinématique sony', 'Plusieurs micros', 'Décor au choix', 'Montage', 'Miniature', 'Habillage graphique (logo, jingle)', '2 teaser', '5 photos'],
  },
  {
    id: 'duo-vip', name: 'VIP', price: 280000, category: 'duo', depositRule: 'duo', 
    durationMin: 90, durationMax: 120, participantsMin: 2, participantsMax: 5, decorMode: 'choice',
    features: ['2 - 5 intervenants', '1h30 - 2h de tournage', '3 - 6 caméras cinématique sony', 'Plusieurs micros', 'Décor au choix', 'Montage', 'Générique', 'Sous-titres', '3 teaser', 'Miniature', 'Habillage graphique (logo, jingle)', 'Maquillage', '5 photos'],
  },
  {
    id: 'solo-starter', name: 'Solo Starter', price: 35000, category: 'solo', depositRule: 'solo-standard', 
    durationMin: 60, durationMax: 60, participantsMin: 1, participantsMax: 1, decorMode: 'standard',
    features: ['1 heure de tournage', '1 caméra cinématique Sony fx3', '1 micro professionnel', 'Décor standard'],
  },
  {
    id: 'solo-pro', name: 'Solo Pro', price: 55000, category: 'solo', depositRule: 'solo-standard', 
    durationMin: 60, durationMax: 60, participantsMin: 1, participantsMax: 1, decorMode: 'choice',
    features: ['1 heure de tournage', '1 caméra cinématique Sony fx3', '1 micro professionnel', 'Montage simple', 'Miniature', 'Décor au choix', '2 photos bonus', '1 short TikTok/Réels'],
  },
  {
    id: 'solo-premium', name: 'Solo Premium', price: 80000, category: 'solo', depositRule: 'solo-premium', 
    durationMin: 60, durationMax: 60, participantsMin: 1, participantsMax: 1, decorMode: 'choice',
    features: ['1 heure de tournage', '2 caméras cinématique Sony fx3', 'Montage dynamique', 'Décor au choix', 'Miniature', '2 shorts TikTok/Réels', '2 photos bonus', 'Logo'],
  },
];

export const PODCAST_DECORS: readonly PodcastDecor[] = [
  { id: 'solo-minimaliste', name: 'Minimaliste moderne', category: 'solo', image: '/studio/assets/decors/solo-minimaliste.jpg' },
  { id: 'solo-chaleureux', name: 'Chaleureux & cinématique', category: 'solo', image: '/studio/assets/decors/solo-chaleureux.jpg' },
  { id: 'solo-fonce', name: 'Foncé & élégant', category: 'solo', image: '/studio/assets/decors/solo-fonce.jpg' },
  { id: 'solo-clair', name: 'Clair & épuré', category: 'solo', image: '/studio/assets/decors/solo-clair.jpg' },
  { id: 'solo-cocooning', name: 'Studio cocooning', category: 'solo', image: '/studio/assets/decors/solo-cocooning.jpg' },
  { id: 'solo-boise', name: 'Ambiance boisée', category: 'solo', image: '/studio/assets/decors/solo-boise.jpg' },
  { id: 'duo-violet', name: 'Plateau violet', category: 'duo', image: '/studio/assets/decors/duo-violet.jpg' },
  { id: 'duo-conversation', name: 'Conversation Studio', category: 'duo', image: '/studio/assets/decors/duo-conversation.jpg' },
  { id: 'duo-bibliotheque', name: 'Bibliothèque LED', category: 'duo', image: '/studio/assets/decors/duo-bibliotheque.jpg' },
];

export const PRICING_CURRENCY = 'XOF';
export const SHOW_SHOOTING_TAB = false;
export const TIER_METALLIC = false;
export const USE_COUNTER_ANIMATION = false;

function groupedNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value).replace(/[\u202f\u00a0 ]/g, '\u00a0');
}

export function formatPrice(value: number) {
  return groupedNumber(value);
}

export function formatPriceAccessible(value: number) {
  return `${groupedNumber(value)} ${CURRENCY_NAME}`;
}

export function formatPriceWithCurrency(value: number) {
  return `${groupedNumber(value)} ${CURRENCY}`;
}

export function getDeposit(plan: PodcastFormula) {
  return Math.round(plan.price * DEPOSIT_RULES[plan.depositRule].rate);
}

export function getPlan(id: string | null | undefined) {
  return PODCAST_FORMULAS.find((plan) => plan.id === id);
}

export function getPlansByCategory(category: PodcastCategory) {
  return PODCAST_FORMULAS.filter((plan) => plan.category === category);
}

export function getStartingPrice(category: PodcastCategory) {
  return Math.min(...getPlansByCategory(category).map((plan) => plan.price));
}

export function getPlanDepositWording(plan: PodcastFormula) {
  return DEPOSIT_RULES[plan.depositRule].wording;
}

export function getFormulaDecorOptions(plan: PodcastFormula) {
  if (plan.decorMode === 'standard') return [];
  return PODCAST_DECORS.filter((decor) => decor.category === plan.category);
}

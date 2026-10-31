export const studioScenes = [
  {
    name: 'Le plateau',
    category: 'Photo & lumière',
    image: 'studio-backstage.webp',
    alt: 'Installation de l’éclairage et des caméras pendant une séance au Studio Plus',
    detail: 'Une lumière pensée pour révéler les visages et donner du relief à chaque image.',
    cue: 'La lumière façonne l’image',
  },
  {
    name: 'La conversation',
    category: 'Podcast & interview',
    image: 'studio-session.webp',
    alt: 'Deux invitées échangent devant les caméras et les micros du Studio Plus',
    detail: 'Un cadre calme pour laisser la parole prendre toute sa place.',
    cue: 'La voix prend sa place',
  },
  {
    name: 'La prise de son',
    category: 'Production audio',
    image: 'hero-microphone.webp',
    alt: 'Microphone de studio éclairé en rouge sur fond sombre',
    detail: 'Un son clair et une présence qui se ressentent dès la première écoute.',
    cue: 'Chaque détail s’entend',
  },
] as const;

export const featuredProjects = [
  {
    title: 'Le portrait, avec intention.',
    category: 'Photographie',
    image: 'portrait.webp',
    alt: 'Portrait d’une femme réalisé par Studio Plus',
    className: 'feature-portrait',
  },
  {
    title: 'La conversation en images.',
    category: 'Podcast vidéo',
    image: 'studio-session.webp',
    alt: 'Tournage d’une conversation dans le studio podcast',
    className: 'feature-podcast',
  },
] as const;

export const quizQuestions = [
  {
    title: 'Qu’allons-nous créer ensemble ?',
    answers: [
      { value: 'photo', title: 'Shooting photo', detail: 'Portrait, couple, produit', image: 'portrait.webp' },
      { value: 'podcast', title: 'Podcast', detail: 'Votre voix, votre univers', image: 'studio-session.webp' },
      { value: 'video', title: 'Production vidéo', detail: 'Un récit en mouvement', image: 'studio-backstage.webp' },
    ],
  },
  {
    title: 'Quelle ambiance vous ressemble ?',
    answers: [
      { value: 'Naturelle et lumineuse', title: 'Naturelle et lumineuse', detail: 'Une image douce et vivante' },
      { value: 'Élégante et contrastée', title: 'Élégante et contrastée', detail: 'Une présence affirmée' },
      { value: 'Colorée et expressive', title: 'Colorée et expressive', detail: 'Une énergie qui se voit' },
      { value: 'À imaginer ensemble', title: 'À imaginer ensemble', detail: 'Partons de votre idée' },
    ],
  },
  {
    title: 'Quel budget avez-vous en tête ?',
    answers: [
      { value: 'Moins de 100 000 FCFA', title: 'Moins de 100 000 FCFA', detail: '' },
      { value: '100 000 à 300 000 FCFA', title: '100 000 à 300 000 FCFA', detail: '' },
      { value: 'Plus de 300 000 FCFA', title: 'Plus de 300 000 FCFA', detail: '' },
      { value: 'À définir ensemble', title: 'À définir ensemble', detail: '' },
    ],
  },
] as const;

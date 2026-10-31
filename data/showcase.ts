import type { ShowcaseStage } from './showcase-tokens';

export type ShowcaseItem = {
  id: string;
  title: string;
  fileName: string;
  image: string;
  alt: string;
  detail: string;
  type: 'photo' | 'video' | 'document' | 'folder';
  rotation: number;
  depth: number;
  enterFrom: { x: number; y: number };
};

export const studioProcess: ShowcaseItem[] = [
  { id: 'brief', title: 'On écoute.', fileName: '01_brief.pdf', image: 'stationery.webp', alt: 'Papeterie de préparation Studio Plus', detail: 'Nous prenons le temps de comprendre votre idée, votre public et ce que vous voulez faire ressentir.', type: 'document', rotation: -4, depth: 2, enterFrom: { x: 1, y: 0 } },
  { id: 'tournage', title: 'On prépare.', fileName: '02_plateau.jpg', image: 'studio-backstage.webp', alt: 'Installation lumière sur le plateau', detail: 'Nous choisissons le cadre, la lumière et le rythme qui servent le mieux votre histoire.', type: 'photo', rotation: 3, depth: 4, enterFrom: { x: 1, y: -1 } },
  { id: 'montage', title: 'On façonne.', fileName: '03_montage.jpg', image: 'studio-session.webp', alt: 'Conversation filmée au studio', detail: 'Les images et le son sont assemblés avec soin pour garder le naturel de votre projet.', type: 'video', rotation: -2, depth: 3, enterFrom: { x: 1, y: 1 } },
  { id: 'livraison', title: 'On partage.', fileName: '04_livraison.pdf', image: 'catalogue-photo.webp', alt: 'Sélection de photographies préparée pour livraison', detail: 'Vous recevez des fichiers prêts à être utilisés et partagés dans les formats convenus.', type: 'document', rotation: 4, depth: 5, enterFrom: { x: 1, y: 0 } },
];

export const studioServices: ShowcaseItem[] = [
  { id: 'portrait', title: 'Portrait & image de marque', fileName: 'portrait.folder', image: 'portrait.webp', alt: 'Portrait réalisé par Studio Plus', detail: 'Portrait individuel, équipe et image de marque. Une séance guidée pour obtenir des images naturelles et affirmées.', type: 'folder', rotation: -3, depth: 3, enterFrom: { x: 0, y: 1 } },
  { id: 'produit', title: 'Photographie produit', fileName: 'photo_produit.folder', image: 'collection.webp', alt: 'Image de collection réalisée au studio', detail: 'Des visuels de produits et de collections pensés pour votre catalogue, votre boutique ou vos réseaux.', type: 'folder', rotation: 2, depth: 4, enterFrom: { x: 0, y: 1 } },
  { id: 'podcast', title: 'Podcast & interview', fileName: 'podcast.folder', image: 'catalogue-podcast.webp', alt: 'Installation podcast au studio', detail: 'Enregistrement audio ou vidéo, interview et conversation. Nous préparons un cadre simple pour laisser la parole circuler.', type: 'folder', rotation: -1, depth: 5, enterFrom: { x: 0, y: 1 } },
  { id: 'voix', title: 'Voix & création sonore', fileName: 'creation_sonore.folder', image: 'hero-microphone.webp', alt: 'Microphone du studio', detail: 'Prise de voix, narration et contenus audio enregistrés dans un environnement adapté.', type: 'folder', rotation: 4, depth: 2, enterFrom: { x: 0, y: 1 } },
  { id: 'video', title: 'Production vidéo', fileName: 'production_video.folder', image: 'studio-backstage.webp', alt: 'Caméra et éclairage prêts pour un tournage', detail: 'De la préparation au tournage, nous construisons une vidéo qui porte clairement votre message.', type: 'folder', rotation: -4, depth: 4, enterFrom: { x: 0, y: 1 } },
  { id: 'identite', title: 'Direction artistique', fileName: 'direction_artistique.folder', image: 'stationery.webp', alt: 'Papeterie de l’identité Studio Plus', detail: 'Repères visuels et choix de mise en scène pour donner une identité cohérente à vos contenus.', type: 'folder', rotation: 3, depth: 3, enterFrom: { x: 0, y: 1 } },
];

export const studioMoments: ShowcaseItem[] = [
  ['portrait-01', 'portrait.webp', 'Portrait en lumière douce', 'portrait_01.webp'],
  ['plateau-01', 'studio-backstage.webp', 'Préparation du plateau', 'plateau_01.webp'],
  ['session-01', 'studio-session.webp', 'Une conversation au studio', 'conversation_01.webp'],
  ['micro-01', 'hero-microphone.webp', 'La prise de son', 'prise_de_son.webp'],
  ['collection-01', 'collection.webp', 'Image de collection', 'collection_01.webp'],
  ['carte-01', 'business-card.webp', 'Détail de l’identité', 'identite_01.webp'],
  ['catalogue-01', 'catalogue-photo.webp', 'Sélection photo', 'selection_photo.webp'],
  ['podcast-01', 'catalogue-podcast.webp', 'Repères podcast', 'podcast_01.webp'],
  ['stationery-01', 'stationery.webp', 'Papeterie Studio Plus', 'papeterie_01.webp'],
  ['portrait-02', 'portrait.webp', 'Autre cadrage portrait', 'portrait_02.webp'],
  ['plateau-02', 'studio-backstage.webp', 'Lumière sur le plateau', 'plateau_02.webp'],
  ['session-02', 'studio-session.webp', 'Le temps de la rencontre', 'conversation_02.webp'],
].map(([id, image, title, fileName], index) => ({
  id, image, title, fileName, alt: title,
  detail: `${title} · Studio Plus, Abidjan.`,
  type: index % 4 === 1 ? 'video' as const : 'photo' as const,
  rotation: [-5, 3, -2, 4, -3, 2, -4, 5, -1, 3, -2, 4][index],
  depth: 2 + (index % 4),
  enterFrom: { x: index % 2 ? 0.4 : -0.4, y: -1 },
}));

export const showcaseStageOrder: ShowcaseStage[] = ['search', 'studio', 'craft', 'moments', 'finalcut'];

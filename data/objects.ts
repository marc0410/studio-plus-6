export type SearchFileType = 'image' | 'video' | 'audio' | 'doc' | 'magazine';

export type SearchFile = {
  id: string;
  type: SearchFileType;
  fileName: string;
  src: string;
  poster: string;
  gridPosition: { col: number; row: number; offsetY: number; width: number };
  edgePosition: { x: number; y: number; rotation: number };
  exitVector: { x: number; y: number };
  content: { title: string; description: string };
};

// Keep filenames and descriptions tied to the real Studio Plus assets. Replace demo video URLs with production footage.
export const searchFiles: SearchFile[] = [
  { id: 'portrait', type: 'image', fileName: 'portrait-studio-plus.webp', src: '/studio/assets/portrait.webp', poster: '/studio/assets/portrait.webp', gridPosition: { col: 1, row: 1, offsetY: 4, width: 88 }, edgePosition: { x: -1, y: -1, rotation: -16 }, exitVector: { x: -1, y: -1 }, content: { title: 'Portrait au studio', description: 'Portrait réalisé dans l’espace photo de Studio Plus.' } },
  { id: 'interview-video', type: 'video', fileName: 'conversation-studio-demo.mp4', src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', poster: '/studio/assets/studio-session.webp', gridPosition: { col: 2, row: 1, offsetY: 28, width: 96 }, edgePosition: { x: 1, y: -1, rotation: 18 }, exitVector: { x: 1, y: -1 }, content: { title: 'Conversation filmée · aperçu', description: 'Vidéo de démonstration temporaire. À remplacer par un extrait de production Studio Plus.' } },
  { id: 'collection', type: 'image', fileName: 'collection-studio-plus.webp', src: '/studio/assets/collection.webp', poster: '/studio/assets/collection.webp', gridPosition: { col: 3, row: 1, offsetY: 0, width: 85 }, edgePosition: { x: -1, y: -1, rotation: 13 }, exitVector: { x: -1, y: -1 }, content: { title: 'Sélection éditoriale', description: 'Image de collection préparée pour une séance photo.' } },
  { id: 'podcast', type: 'image', fileName: 'catalogue-podcast.webp', src: '/studio/assets/catalogue-podcast.webp', poster: '/studio/assets/catalogue-podcast.webp', gridPosition: { col: 4, row: 1, offsetY: 22, width: 88 }, edgePosition: { x: 1, y: -1, rotation: -19 }, exitVector: { x: 1, y: -1 }, content: { title: 'Production podcast', description: 'Repère visuel pour une séance de podcast au studio.' } },
  { id: 'production-note', type: 'doc', fileName: 'note-de-production.docx', src: '/studio/assets/business-card.webp', poster: '/studio/assets/business-card.webp', gridPosition: { col: 1, row: 2, offsetY: 16, width: 90 }, edgePosition: { x: -1, y: 1, rotation: 17 }, exitVector: { x: -1, y: 1 }, content: { title: 'Note de production', description: 'Aperçu d’un document de préparation de séance.' } },
  { id: 'backstage-video', type: 'video', fileName: 'plateau-studio-demo.mp4', src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', poster: '/studio/assets/studio-backstage.webp', gridPosition: { col: 2, row: 2, offsetY: 0, width: 95 }, edgePosition: { x: 1, y: 1, rotation: -14 }, exitVector: { x: 1, y: 1 }, content: { title: 'Sur le plateau · aperçu', description: 'Vidéo de démonstration temporaire. À remplacer par un extrait de production Studio Plus.' } },
  { id: 'catalogue-photo', type: 'magazine', fileName: 'catalogue-photo-studio.webp', src: '/studio/assets/catalogue-photo.webp', poster: '/studio/assets/catalogue-photo.webp', gridPosition: { col: 3, row: 2, offsetY: 26, width: 86 }, edgePosition: { x: -1, y: 1, rotation: 15 }, exitVector: { x: -1, y: 1 }, content: { title: 'Catalogue photo', description: 'Sélection d’images et de références visuelles du studio.' } },
  { id: 'stationery', type: 'image', fileName: 'identite-studio-plus.webp', src: '/studio/assets/stationery.webp', poster: '/studio/assets/stationery.webp', gridPosition: { col: 4, row: 2, offsetY: 8, width: 91 }, edgePosition: { x: 1, y: 1, rotation: 20 }, exitVector: { x: 1, y: 1 }, content: { title: 'Identité Studio Plus', description: 'Papeterie et éléments de l’identité visuelle Studio Plus.' } },
];

export const typewriterQuery = 'portrait-studio-plus.webp';

export type FilmObjectType = 'photo' | 'polaroid' | 'film' | 'vinyl' | 'cassette' | 'magazine' | 'print';

export type FilmObject = {
  id: string;
  type: FilmObjectType;
  src: string;
  alt: string;
  title: string;
  category: string;
  video: string;
  x: number;
  y: number;
  mobileX: number;
  mobileY: number;
  width: number;
  rotation: number;
  depth: number;
  exit: { x: number; y: number };
};

const demoVideos = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

const images = {
  portrait: ['/studio/assets/portrait.webp', 'Portrait réalisé avec une lumière expressive'],
  session: ['/studio/assets/studio-session.webp', 'Conversation enregistrée dans le studio podcast'],
  backstage: ['/studio/assets/studio-backstage.webp', 'Préparation d’un plateau de tournage'],
  microphone: ['/studio/assets/hero-microphone.webp', 'Microphone éclairé dans le studio'],
  collection: ['/studio/assets/collection.webp', 'Sélection de photographies du studio'],
  catalogue: ['/studio/assets/catalogue-photo.webp', 'Catalogue de photographie Studio Plus'],
  stationery: ['/studio/assets/stationery.webp', 'Papeterie et identité Studio Plus'],
  podcast: ['/studio/assets/catalogue-podcast.webp', 'Catalogue podcast Studio Plus'],
  card: ['/studio/assets/business-card.webp', 'Carte de visite Studio Plus'],
} as const;

// x/y and mobileX/mobileY are percentages of the table. Keep the central 40% clear for the copy.
const entries: Array<[string, FilmObjectType, keyof typeof images, number, number, number, number, number, number, number, number]> = [
  ['contact-sheet','film','backstage',7,10,3,11,15,-9,5,-1], ['portrait-print','photo','portrait',20,4,21,3,13,7,4,-1], ['catalogue-cover','magazine','catalogue',37,8,40,7,15,-5,3,-1], ['studio-notes','polaroid','stationery',57,5,59,4,12,8,3,-1], ['podcast-zine','magazine','podcast',77,8,80,10,16,-8,4,-1], ['city-session','photo','session',94,12,97,12,13,10,5,-1],
  ['camera-roll','photo','collection',3,35,3,35,15,9,4,-1], ['vinyl-side-a','vinyl','microphone',12,50,12,53,14,-12,5,-1], ['portrait-polaroid','polaroid','portrait',25,25,27,28,12,-5,3,-1], ['studio-frame','photo','backstage',77,27,79,27,14,8,4,1], ['sound-check','cassette','podcast',88,42,90,46,13,-8,5,1], ['light-study','polaroid','session',97,57,98,62,12,7,3,1],
  ['print-01','print','catalogue',3,77,4,78,16,-8,5,-1], ['archive-strip','film','portrait',17,91,18,94,15,7,4,-1], ['work-in-progress','magazine','stationery',32,86,34,90,13,-5,3,1], ['voice-note','cassette','microphone',70,91,72,94,14,8,5,1], ['campaign-contact','photo','catalogue',83,79,85,80,15,-7,4,1], ['last-frame','polaroid','collection',96,91,98,93,13,9,3,1],
  ['warm-up','photo','microphone',7,58,6,63,12,12,3,-1], ['first-take','polaroid','session',31,14,32,16,12,5,2,-1], ['studio-card','print','card',68,14,68,15,13,-6,3,1], ['contact-two','film','collection',90,30,94,31,14,8,4,1], ['set-design','photo','backstage',10,89,10,89,12,-4,3,-1], ['closing-note','print','card',94,72,96,71,12,5,2,1],
];

export const filmObjects: FilmObject[] = entries.map(([id,type,image,x,y,mobileX,mobileY,width,rotation,depth,video], index) => ({
  id, type, src: images[image][0], alt: images[image][1], title: ['La lumière raconte.','La parole circule.','L’idée prend forme.','Chaque détail compte.'][index % 4], category: ['Photographie','Podcast vidéo','Direction créative','Production'][index % 4], video: demoVideos[video === -1 ? index % demoVideos.length : video], x,y,mobileX,mobileY,width,rotation,depth,exit: { x: x < 50 ? -1 : 1, y: y < 50 ? -1 : 1 },
}));

import type {Metadata} from 'next';import {ProjectGallery} from '@/components/ProjectGallery';import {Ink} from '@/components/handwriting/Ink';
export const metadata:Metadata={title:'Projets'};
export default function Projets(){return <main id="contenu"><section className="subpage-hero"><div className="eyebrow"><i/>Sélection visuelle · Studio+</div><h1>La création<br/>en <Ink type="underline" trigger="enter" color="accent"><em>expression.</em></Ink></h1><p>Des images, des voix et une signature. Explorez les différentes facettes de notre univers.</p></section><ProjectGallery/></main>}

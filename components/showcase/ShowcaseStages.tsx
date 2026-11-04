'use client';

import { useState } from 'react';
import Link from 'next/link';
import { studioMoments, studioProcess, studioServices, type ShowcaseItem } from '@/data/showcase';
import type { ShowcaseStage } from '@/data/showcase-tokens';
import { pausedShowcaseStages } from '@/data/design-tokens';
import { FilmStrip, FolderCard, ObjectModal, PaperCard, PolaroidFrame, SectionTitle } from './ShowcasePrimitives';

export function ShowcaseStages({ activeStage, reducedMotion }: { activeStage: ShowcaseStage; reducedMotion: boolean }) {
  const [selected, setSelected] = useState<ShowcaseItem | null>(null);
  return <>
    <section hidden={pausedShowcaseStages.includes('studio')} className="showcase-content-stage showcase-content-stage--studio" data-showcase-panel="studio" aria-labelledby="showcase-studio-title" aria-hidden={!reducedMotion && activeStage !== 'studio'} inert={!reducedMotion && activeStage !== 'studio'}>
      <div className="showcase-stage-inner">
        <SectionTitle id="showcase-studio-title" eyebrow="Le studio / Notre façon de créer" title="Une idée prend forme" emphasis="ensemble." note="Quatre temps de travail, de la première conversation aux fichiers prêts à partager." />
        <div className="showcase-process-board">
          <svg className="showcase-process-thread" viewBox="0 0 1000 230" preserveAspectRatio="none" aria-hidden="true"><path data-process-thread d="M80 150 C170 40 230 40 315 135 S465 220 555 105 S735 20 825 120 S920 190 960 85" /></svg>
          {studioProcess.map((item, index) => <PaperCard key={item.id} fileName={item.fileName} onClick={() => setSelected(item)} className="showcase-process-card" label={`Ouvrir l’étape ${index + 1} : ${item.title}`} enterFrom={item.enterFrom} rotation={item.rotation} depth={item.depth}>
            <span className="showcase-process-number">0{index + 1} / {['BRIEF', 'PLATEAU', 'MONTAGE', 'LIVRAISON'][index]}</span>
            <PolaroidFrame src={`/studio/assets/${item.image}`} alt={item.alt} caption={['On pose les bonnes questions.', 'Chaque détail trouve sa place.', 'Le rythme révèle le propos.', 'Les fichiers sont prêts à vivre.'][index]} />
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </PaperCard>)}
        </div>
        <span className="showcase-hand-note showcase-hand-note--studio" aria-hidden="true">Du premier mot à la dernière image.</span>
      </div>
    </section>

    <section hidden={pausedShowcaseStages.includes('craft')} className="showcase-content-stage showcase-content-stage--craft" data-showcase-panel="craft" aria-labelledby="showcase-craft-title" aria-hidden={!reducedMotion && activeStage !== 'craft'} inert={!reducedMotion && activeStage !== 'craft'}>
      <div className="showcase-stage-inner">
        <SectionTitle id="showcase-craft-title" eyebrow="Nos savoir-faire" title="La bonne forme" emphasis="pour votre histoire." note="Photo, son et vidéo : les formats se choisissent selon ce que vous avez à raconter." />
        <div className="showcase-service-grid">
          {studioServices.map((item, index) => <FolderCard key={item.id} fileName={item.fileName} onClick={() => setSelected(item)} className="showcase-service-card" enterFrom={item.enterFrom} rotation={item.rotation} depth={item.depth}>
            <span className="showcase-service-preview"><img src={`/studio/assets/${item.image}`} alt="" loading="lazy"/><i>STUDIO+ / 0{index + 1}</i></span>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
            <span className="showcase-service-list">Découverte · Préparation · Production</span>
          </FolderCard>)}
        </div>
      </div>
    </section>

    {/* Section temporairement commentée à la demande de Studio+.
    <section className="showcase-content-stage showcase-content-stage--moments" data-showcase-panel="moments" aria-labelledby="showcase-moments-title" aria-hidden={!reducedMotion && activeStage !== 'moments'} inert={!reducedMotion && activeStage !== 'moments'}>
      <div className="showcase-stage-inner">
        <SectionTitle id="showcase-moments-title" eyebrow="Images du studio" title="Des instants" emphasis="qui restent." note="Des visages, des idées et des coulisses, gardés en images." />
        <div className="showcase-moments-grid">
          {studioMoments.map((item, index) => <PaperCard key={item.id} fileName={item.fileName} onClick={() => setSelected(item)} className={`showcase-moment-card showcase-moment-card--${index + 1}`} enterFrom={item.enterFrom} rotation={item.rotation} depth={item.depth}>
            {item.type === 'video'
              ? <FilmStrip poster={`/studio/assets/${item.image}`} title={item.alt} />
              : <PolaroidFrame src={`/studio/assets/${item.image}`} alt={item.alt} caption={item.title} />}
          </PaperCard>)}
        </div>
        <span className="showcase-moments-count">12 tirages <i aria-hidden="true" /> Cocody · Abidjan</span>
      </div>
    </section> */}

    <section className="showcase-content-stage showcase-content-stage--finalcut" data-showcase-panel="finalcut" aria-labelledby="showcase-finalcut-title" aria-hidden={!reducedMotion && activeStage !== 'finalcut'} inert={!reducedMotion && activeStage !== 'finalcut'}>
      <div className="showcase-finalcut-shade" data-finalcut-shade aria-hidden="true" />
      <div className="showcase-finalcut-reel" data-finalcut-reel aria-hidden="true">{studioMoments.slice(0, 6).map((item) => <img key={item.id} src={`/studio/assets/${item.image}`} alt="" loading="lazy" />)}</div>
      <div className="showcase-finalcut-copy">
        <SectionTitle id="showcase-finalcut-title" eyebrow="Studio Plus / Abidjan" title="Final" emphasis="Cut." note="De la première idée au dernier plan, faisons place à votre prochain projet." />
        <Link className="showcase-finalcut-cta" href="#tarifs">Voir les tarifs <span aria-hidden="true">↗</span></Link>
      </div>
      <span className="showcase-finalcut-mark" aria-hidden="true">STUDIO+ / 24 FPS</span>
    </section>

    <ObjectModal open={Boolean(selected)} title={selected?.title ?? 'Détail du projet'} onClose={() => setSelected(null)}>
      {selected && <div className="showcase-detail-modal">
        <img src={`/studio/assets/${selected.image}`} alt={selected.alt} />
        <span>{selected.fileName}</span><h2>{selected.title}</h2><p>{selected.detail}</p>
        <Link href="/reserver" onClick={() => setSelected(null)}>Parlons de votre projet <b aria-hidden="true">↗</b></Link>
      </div>}
    </ObjectModal>
  </>;
}

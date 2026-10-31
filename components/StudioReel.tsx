'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { LayoutGroup } from 'motion/react';
import { filmObjects, type FilmObject } from '@/lib/film-objects';
import { VideoModal } from './VideoModal';
import { useScrollScatter } from './useScrollScatter';
import { SearchStage } from './SearchStage';
import { FileModal } from './FileModal';
import { searchFiles, type SearchFile } from '@/data/objects';
import { showcaseTokens, type ShowcaseStage } from '@/data/showcase-tokens';
import { ShowcaseStages } from './showcase/ShowcaseStages';
import { HandLabel } from './handwriting/Ink';
import { Ink } from './handwriting/Ink';
import { useShowcaseTimeline } from './showcase/useShowcaseTimeline';
import { StageDots } from './showcase/ShowcasePrimitives';

export function StudioReel() {
  const section = useRef<HTMLElement>(null);
  const parallaxTo = useRef(new Map<HTMLElement, { x: (value: number) => void; y: (value: number) => void }>());
  const [selected, setSelected] = useState<FilmObject | null>(null);
  const [selectedFile, setSelectedFile] = useState<SearchFile | null>(null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [query, setQuery] = useState('');
  const [reduced, setReduced] = useState(false);
  const [activeStage, setActiveStage] = useState<ShowcaseStage>('search');
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const onSearchReady = useCallback((ready: boolean) => {
    setSearchEnabled(ready);
    if (!ready) setQuery('');
  }, []);
  const onStageChange = useCallback((stage: ShowcaseStage) => setActiveStage((current) => current === stage ? current : stage), []);
  const appendShowcaseStages = useShowcaseTimeline(onSearchReady, onStageChange);
  useScrollScatter(section, reduced, appendShowcaseStages);

  const navigateToStage = (stage: ShowcaseStage) => {
    if (reduced) {
      const target = stage === 'search' ? section.current?.querySelector<HTMLElement>('[data-search-stage]') : section.current?.querySelector<HTMLElement>(`[data-showcase-panel="${stage}"]`);
      target?.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    window.dispatchEvent(new CustomEvent('showcase:navigate', { detail: stage }));
  };

  useEffect(() => {
    const nodes = section.current?.querySelectorAll<HTMLElement>('[data-parallax]') ?? [];
    nodes.forEach((node) => parallaxTo.current.set(node, {
      x: gsap.quickTo(node, 'x', { duration: .7, ease: 'power2.out' }),
      y: gsap.quickTo(node, 'y', { duration: .7, ease: 'power2.out' }),
    }));
    return () => { nodes.forEach((node) => gsap.killTweensOf(node)); parallaxTo.current.clear(); };
  }, []);

  // Parallax is applied to a nested layer so GSAP can own the scroll transforms independently.
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduced || matchMedia('(pointer: coarse)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const nx = (event.clientX - bounds.left) / bounds.width - .5;
    const ny = (event.clientY - bounds.top) / bounds.height - .5;
    parallaxTo.current.forEach((to, node) => {
      const depth = Number(node.dataset.depth || 2);
      to.x(nx * depth * showcaseTokens.motion.parallax);
      to.y(ny * depth * showcaseTokens.motion.parallax);
    });
  };

  useEffect(() => {
    if (!selectedFile) return;
    const move = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = searchFiles.findIndex((item) => item.id === selectedFile.id);
      const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + searchFiles.length) % searchFiles.length;
      setSelectedFile(searchFiles[next]);
    };
    window.addEventListener('keydown', move);
    return () => window.removeEventListener('keydown', move);
  }, [selectedFile]);

  const sceneStyle = {
    '--table-wood': showcaseTokens.colors.wood,
    '--table-ink': showcaseTokens.colors.black,
    '--table-paper': showcaseTokens.colors.white,
    '--showcase-paper': showcaseTokens.colors.white,
    '--showcase-ink': showcaseTokens.colors.white,
    '--showcase-accent': showcaseTokens.colors.accent,
    '--showcase-label': showcaseTokens.colors.label,
    '--showcase-glass': showcaseTokens.colors.glass,
  } as CSSProperties;

  return <LayoutGroup id="studio-file-lightbox"><section id="showcase" data-section-snap="showcase" ref={section} style={sceneStyle} className={`table-showcase${reduced ? ' table-showcase--reduced' : ''}`} onPointerMove={handlePointerMove} aria-labelledby="table-title" tabIndex={-1}>
    <div className="table-surface" aria-hidden="true" />
    <div className="table-grain" aria-hidden="true" />
    <div className="table-edge-light" aria-hidden="true" />
    <div className="table-topline"><span className="table-brand"><b>STUDIO+</b><i> / L’ATELIER EN IMAGES</i></span><Link href="/projets">Explorer le portfolio <span aria-hidden="true">↗</span></Link></div>
    <Link className="showcase-skip" href="#tarifs">Passer l’animation <span aria-hidden="true">↘</span></Link>
    <div className="table-objects" aria-label="Images et objets du studio">
      {filmObjects.map((item, index) => <TableObject key={item.id} item={item} index={index} onSelect={() => setSelected(item)} />)}
    </div>
    <div className="table-copy">
      <span className="table-kicker"><i aria-hidden="true" /> Studio créatif · Abidjan</span>
      <h2 id="table-title" tabIndex={-1}>Chaque idée<br/>laisse une <Ink type="circle" trigger="enter" color="accent"><em>trace.</em></Ink></h2>
      <p>Images, sons et histoires se rencontrent autour de la même table.<br className="table-desktop-break"/> Parcourez nos créations, puis imaginons la prochaine ensemble.</p>
      <Link className="table-cta" href="/reserver">Parler de votre projet <span aria-hidden="true">↗</span></Link>
      <HandLabel className="table-handnote" text="L’image. Le son. L’émotion." trigger="enter" color="ink" />
    </div>
    <SearchStage enabled={searchEnabled || reduced} reducedMotion={reduced} query={query} onQuery={setQuery} onOpen={setSelectedFile}/>
    <ShowcaseStages activeStage={activeStage} reducedMotion={reduced}/>
    {!reduced && <>
      <StageDots active={activeStage} onNavigate={navigateToStage}/>
    </>}
    <div className="table-bottomline"><span>UNE SÉLECTION DE L’ATELIER</span><span className="table-scroll-cue"><i aria-hidden="true">↓</i> Faites défiler pour continuer</span><span>COCODY · ABIDJAN</span></div>
    <VideoModal item={selected ? { title: selected.title, category: selected.category, src: selected.video, poster: selected.src } : null} onClose={() => setSelected(null)} />
    <FileModal item={selectedFile} onClose={() => setSelectedFile(null)}/>
  </section></LayoutGroup>;
}

export function TableObject({ item, index, onSelect }: { item: FilmObject; index: number; onSelect: () => void }) {
  const style = {
    '--x': `${item.x}%`, '--y': `${item.y}%`, '--mx': `${item.mobileX}%`, '--my': `${item.mobileY}%`,
    '--object-width': `${item.width}%`, '--object-mobile-width': `${Math.max(18, Math.min(29, item.width * 1.55))}%`, '--rotation': `${item.rotation}deg`, '--hover-rotation': `${item.rotation * -.18}deg`, '--depth': item.depth, '--z-depth': item.depth + 2, '--shadow-y': `${4 + item.depth * 2}px`, '--shadow-blur': `${5 + item.depth * 2}px`,
  } as CSSProperties;
  return <div className={`table-object table-object--${item.type}${index >= 12 ? ' desktop-only-object' : ''}`} style={style}
    data-table-item data-depth={item.depth} data-rotation={item.rotation} data-exit-x={item.exit.x} data-exit-y={item.exit.y}>
    <button className="table-object-button" onClick={onSelect} aria-label={`Ouvrir la vidéo « ${item.title} » — ${item.category}`}>
      <span className="table-object-parallax" data-parallax data-depth={item.depth}>
        <span className="table-object-content">
          {item.type === 'vinyl' ? <VinylObject item={item} /> : item.type === 'cassette' ? <CassetteObject item={item} /> : item.type === 'film' ? <FilmStripObject item={item} /> : <PrintObject item={item} />}
        </span>
      </span>
      <span className="table-object-hint" aria-hidden="true">↗</span>
    </button>
  </div>;
}

function PrintObject({ item }: { item: FilmObject }) {
  return <span className={`print-art print-art--${item.type}`}><img src={item.src} alt="" loading="lazy" draggable={false}/>
    {item.type === 'polaroid' && <span className="print-caption">Studio Plus · {item.category}</span>}
    {item.type === 'magazine' && <span className="magazine-stamp">STUDIO<br/><b>PLUS</b><i>IMAGES / 2025</i></span>}
    {item.type === 'print' && <span className="print-mark">S+ <i>ABIDJAN · CI</i></span>}
  </span>;
}

function FilmStripObject({ item }: { item: FilmObject }) {
  return <span className="film-art"><span className="film-brandline">STUDIO+ <i>400 / 21</i></span><img src={item.src} alt="" loading="lazy" draggable={false}/><span className="film-brandline film-brandline--bottom"><i>36 EXP</i> STUDIO+ <b>21</b></span></span>;
}

function VinylObject({ item }: { item: FilmObject }) {
  return <span className="vinyl-art"><span className="vinyl-grooves"><img src={item.src} alt="" loading="lazy" draggable={false}/></span></span>;
}

function CassetteObject({ item }: { item: FilmObject }) {
  return <span className="cassette-art"><span className="cassette-label"><b>STUDIO PLUS</b><i>{item.category} · SIDE A</i></span><img src={item.src} alt="" loading="lazy" draggable={false}/><span className="cassette-window"><i/><i/></span><span className="cassette-reel cassette-reel--left"/><span className="cassette-reel cassette-reel--right"/></span>;
}

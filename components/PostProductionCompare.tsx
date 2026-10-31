'use client';

import { useState, type CSSProperties } from 'react';
import Image from 'next/image';

export function PostProductionCompare() {
  const [position, setPosition] = useState(54);
  const comparisonStyle = { '--compare': `${position}%` } as CSSProperties;

  return (
    <section className="section post-scene" aria-labelledby="post-title" data-scene>
      <div className="scene-copy">
        <span className="section-index">La post-production / Image</span>
        <h2 id="post-title">La différence<br />est dans les détails.</h2>
        <p>La lumière, la couleur et le contraste donnent le ton. Faites glisser le curseur pour explorer deux traitements du même portrait.</p>
        <div className="post-keyline"><span>01</span><p>Une intention à la prise de vue.<br />Une finition à l’image.</p></div>
      </div>
      <div className="compare-column">
        <div className="compare-frame" style={comparisonStyle}>
          <div className="compare-base"><Image src="/studio/assets/portrait.webp" alt="" fill sizes="(max-width: 850px) 100vw, 60vw" /></div>
          <div className="compare-final"><Image src="/studio/assets/portrait.webp" alt="Portrait réalisé au Studio Plus, présenté avec sa couleur d’origine" fill sizes="(max-width: 850px) 100vw, 60vw" /></div>
          <span className="compare-label compare-label-left">Monochrome</span>
          <span className="compare-label compare-label-right">Couleur</span>
          <span className="compare-divider" aria-hidden="true"><span>↔</span></span>
        </div>
        <label className="compare-control" htmlFor="studio-compare"><span>Explorer le traitement</span><input id="studio-compare" type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} aria-label="Comparer un traitement monochrome et la couleur du portrait" /><span>{String(position).padStart(2, '0')}%</span></label>
        <p className="compare-disclaimer">Comparaison créative réalisée à partir d’un portrait du studio. Le mode monochrome est une simulation.</p>
      </div>
    </section>
  );
}

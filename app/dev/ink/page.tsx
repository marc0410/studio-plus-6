'use client';

import { useState } from 'react';
import { HandLabel, Ink, Surface } from '@/components/handwriting/Ink';
import { type InkTrigger, type InkType } from '@/data/inkTokens';
import '@/app/ink-demo.css';

const types: InkType[] = ['circle', 'underline', 'wave', 'double', 'heart', 'star', 'spark', 'check', 'arrow', 'loop'];
const triggers: InkTrigger[] = ['enter', 'scrub', 'hover'];

export default function InkDemoPage() {
  const [replay, setReplay] = useState(0);
  const [speed, setSpeed] = useState(.8);
  return <main className="ink-demo" id="contenu">
    <header className="ink-demo-header"><span className="eyebrow"><i/> LABORATOIRE STUDIO+</span><h1>Le trait prend<br/><em>vie.</em></h1><p>Chaque forme est un SVG déterministe. Testez son apparition, son lien au scroll et son redessin au survol.</p><p className="ink-demo-example">Des <Ink type="circle" trigger="scrub" color="accent" seed={39}>instants</Ink> qui restent <Ink className="ink-demo-heart" type="heart" trigger="scrub" color="orange" seed={17}> </Ink> <HandLabel text="à garder" trigger="scrub" color="orange" seed={29}/></p><label>Vitesse du tracé <strong>{speed.toFixed(1)} s</strong><input type="range" min=".2" max="1.8" step=".1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}/></label><button className="button" onClick={() => setReplay((value) => value + 1)}>Rejouer les annotations <span aria-hidden="true">↻</span></button></header>
    {(['dark', 'light', 'blue', 'red'] as const).map((tone) => <Surface key={tone} tone={tone} className={`ink-demo-surface ink-demo-surface--${tone}`}>
      <h2>{tone} <span>· formes et modes</span></h2>
      <div className="ink-demo-grid">{types.flatMap((type) => triggers.map((trigger, index) => <article key={`${tone}-${type}-${trigger}`} className="ink-demo-card" data-ink-card>
        <span className="ink-demo-meta">{type} / {trigger}</span>
        <Ink key={`${replay}-${tone}-${type}-${trigger}`} type={type} color={type === 'heart' && tone === 'light' ? 'orange' : index === 0 ? 'accent' : 'ink'} trigger={trigger} duration={speed} seed={types.indexOf(type) * 9 + index} replayKey={replay} label={type === 'circle' ? 'à garder' : undefined}>{type === 'circle' ? 'instants' : type === 'underline' || type === 'wave' || type === 'double' ? 'idée créative' : 'Studio+'}</Ink>
      </article>))}</div>
    </Surface>)}
  </main>;
}

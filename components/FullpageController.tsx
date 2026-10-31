'use client';

import { useSectionSnap } from './useSectionSnap';

/** Progressive enhancement for the single Hero <-> Showcase snap boundary. */
export function FullpageController() {
  useSectionSnap({ sections: { hero: '#hero', showcase: '#showcase' } });
  return <>
    <div className="section-snap-transition" aria-hidden="true">
      <span className="section-snap-flare" />
    </div>
    <a className="section-snap-skip" href="#showcase">Passer la transition</a>
  </>;
}

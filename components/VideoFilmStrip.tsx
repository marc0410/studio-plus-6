'use client';

import { useEffect, useRef } from 'react';
import type { SearchFile } from '@/data/objects';

export function VideoFilmStrip({ file, active }: { file: SearchFile; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (active) void el.play().catch(() => {});
    else { el.pause(); el.currentTime = 0; }
    return () => { el.pause(); };
  }, [active]);
  return <span className="search-film-strip">
    <span className="search-film-perfs search-film-perfs--top">STUDIO+ 21 <i>• • • • • • • • • • • •</i></span>
    <video ref={video} src={file.src} muted loop playsInline preload="metadata" poster={file.poster} aria-label={`Aperçu vidéo : ${file.fileName}`} />
    <span className="search-film-perfs search-film-perfs--bottom"><i>• • • • • • • • • • • •</i> 20A <b>21</b></span>
    <span className="search-play-hint" aria-hidden="true">▶</span>
  </span>;
}

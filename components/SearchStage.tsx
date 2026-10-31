'use client';

import { useCallback, useState } from 'react';
import { searchFiles, type SearchFile } from '@/data/objects';
import { SearchBar } from './SearchBar';
import { FileGrid } from './FileGrid';

const edgePieces: Array<{ file: SearchFile; edge: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }> = [
  { file: searchFiles[2], edge: 'top-left' },
  { file: searchFiles[5], edge: 'top-right' },
  { file: searchFiles[6], edge: 'bottom-left' },
  { file: searchFiles[4], edge: 'bottom-right' },
];

export function SearchStage({ enabled, reducedMotion, query, onQuery, onOpen }: { enabled: boolean; reducedMotion: boolean; query: string; onQuery: (value: string) => void; onOpen: (file: SearchFile) => void }) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const play = useCallback((id: string) => setActiveVideo(id), []);
  const pause = useCallback((id: string) => setActiveVideo((current) => current === id ? null : current), []);
  return <div className={`search-stage${reducedMotion ? ' search-stage--reduced' : ''}`} data-search-stage role="region" aria-label="Recherche dans les fichiers" inert={!reducedMotion && !enabled}>
    <div className="search-edge-collage" aria-hidden="true">{edgePieces.map(({ file, edge }) => <div key={edge} data-parallax data-depth="5" className={`search-edge-piece search-edge-piece--${edge}`}><img src={file.poster} alt=""/><i>{file.type === 'video' ? 'STUDIO+ 21' : file.fileName}</i></div>)}</div>
    <div className="search-stage-content">
      <header className="search-stage-heading" data-search-heading>
        <span>Retrouver le bon moment</span>
        <h2><span className="search-heading-line"><b>On peut même chercher dans vos fichiers,</b></span><span className="search-heading-line"><i>pour retrouver cette scène, cette page ou ce clip.</i></span></h2>
      </header>
      <SearchBar thumbnail={searchFiles[0]} disabled={!enabled && !reducedMotion} initialValue={reducedMotion ? 'portrait-studio-plus.webp' : ''} onQuery={onQuery}/>
      <FileGrid query={query} searchActive={enabled && query.length > 0} stageActive={enabled || reducedMotion} activeVideo={activeVideo} onOpen={onOpen} onPlay={play} onPause={pause}/>
    </div>
  </div>;
}

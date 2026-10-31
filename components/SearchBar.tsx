'use client';

import { useRef } from 'react';
import type { SearchFile } from '@/data/objects';

export function SearchBar({ thumbnail, disabled, initialValue, onQuery }: { thumbnail: SearchFile; disabled: boolean; initialValue: string; onQuery: (query: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="file-search-bar" data-search-bar>
    <svg className="file-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 4.1 4.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
    <input ref={input} type="search" defaultValue={initialValue} disabled={disabled} placeholder="Chercher dans vos fichiers…" aria-label="Chercher dans les fichiers" onChange={(event) => onQuery(event.currentTarget.value)} />
    <img className="file-search-thumb" src={thumbnail.poster} alt="" data-search-thumb />
    <kbd className="file-search-enter" data-search-enter aria-label="Entrée">↵</kbd>
  </div>;
}

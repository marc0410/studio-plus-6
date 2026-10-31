'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { SearchFile } from '@/data/objects';
import { VideoFilmStrip } from './VideoFilmStrip';

export function FileCard({ file, activeVideo, stageActive, onOpen, onPlay, onPause }: { file: SearchFile; activeVideo: boolean; stageActive: boolean; onOpen: () => void; onPlay: (id: string) => void; onPause: (id: string) => void }) {
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!stageActive || file.type !== 'video' || !('IntersectionObserver' in window) || !matchMedia('(pointer: coarse)').matches || !card.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onPlay(file.id);
      else onPause(file.id);
    }, { rootMargin: '-43% 0px -43% 0px', threshold: 0 });
    observer.observe(card.current);
    return () => observer.disconnect();
  }, [file.id, file.type, stageActive, onPause, onPlay]);

  return <div ref={card} className={`file-grid-card file-grid-card--${file.type}`} data-search-card data-file-id={file.id} data-edge-x={file.exitVector.x} data-edge-y={file.exitVector.y} data-edge-rotation={file.edgePosition.rotation}>
    <button className="file-card-button" aria-label={`Ouvrir ${file.fileName}`} onClick={onOpen} onPointerEnter={() => { if (matchMedia('(pointer: fine)').matches && file.type === 'video') onPlay(file.id); }} onPointerLeave={() => onPause(file.id)} onFocus={() => { if (file.type === 'video') onPlay(file.id); }} onBlur={() => onPause(file.id)}>
      <span className="file-card-parallax" data-parallax data-depth="4">
      <motion.span className="file-card-preview" layoutId={`file-preview-${file.id}`}>
        <span className="file-card-visual">
        {file.type === 'video' ? <VideoFilmStrip file={file} active={activeVideo} /> : file.type === 'audio' ? <AudioCassette file={file} /> : file.type === 'doc' ? <DocumentPreview file={file} /> : <span className={`file-image-preview file-image-preview--${file.type}`}><img src={file.poster} alt="" loading="lazy" draggable={false}/>{file.type === 'magazine' && <span className="file-magazine-type">STUDIO<br/><b>PLUS</b><i>LOOKBOOK · 03</i></span>}</span>}
        </span>
      </motion.span>
      </span>
      <span className="file-name-tag" data-file-label><i aria-hidden="true">{file.type === 'video' ? '▶' : file.type === 'audio' ? '♫' : file.type === 'doc' ? '▤' : '▧'}</i>{file.fileName}</span>
    </button>
  </div>;
}

function AudioCassette({ file }: { file: SearchFile }) {
  return <span className="file-cassette-preview"><b>STUDIO PLUS</b><i>{file.content.title}</i><span className="file-cassette-window"><em/><em/></span><small>A / 60</small></span>;
}

function DocumentPreview({ file }: { file: SearchFile }) {
  return <span className="file-document-preview"><img src={file.poster} alt="" loading="lazy"/><span><b>STUDIO+ / PRODUCTION</b><i>{file.content.title}</i><small>{file.content.description}</small></span></span>;
}

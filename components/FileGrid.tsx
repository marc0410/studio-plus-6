'use client';

import { AnimatePresence, motion } from 'motion/react';
import { searchFiles, type SearchFile } from '@/data/objects';
import { FileCard } from './FileCard';

export function FileGrid({ query, searchActive, stageActive, activeVideo, onOpen, onPlay, onPause }: { query: string; searchActive: boolean; stageActive: boolean; activeVideo: string | null; onOpen: (file: SearchFile) => void; onPlay: (id: string) => void; onPause: (id: string) => void }) {
  const normalized = query.trim().toLowerCase();
  const results = searchActive && normalized ? searchFiles.filter((file) => file.fileName.toLowerCase().includes(normalized)) : searchFiles;
  return <div className="file-grid" data-file-grid aria-live="polite" aria-relevant="additions removals">
    <AnimatePresence mode="popLayout" initial={false}>
      {results.map((file) => <motion.div key={file.id} layout className="file-grid-slot" style={{ gridColumn: file.gridPosition.col, gridRow: file.gridPosition.row, marginTop: file.gridPosition.offsetY, width: `${file.gridPosition.width}%` }}>
        <FileCard file={file} activeVideo={activeVideo === file.id} stageActive={stageActive} onOpen={() => onOpen(file)} onPlay={onPlay} onPause={onPause}/>
      </motion.div>)}
    </AnimatePresence>
    {results.length === 0 && <p className="file-grid-empty" role="status">Aucun fichier trouvé.</p>}
  </div>;
}

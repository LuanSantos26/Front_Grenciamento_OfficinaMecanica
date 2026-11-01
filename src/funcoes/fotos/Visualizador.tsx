import { useEffect } from 'react';
import type { Foto } from '../../types';
import { CATEGORIAS_FOTO } from '../../constants/dominio';
import { dataHora } from '../../utils/formato';
import { Icone } from '../../componentes/ui/Icone';
import { useEsc } from '../../componentes/ui/Modal';

/** Foto em tela cheia com navegação ← → */
export function Visualizador({ fotos, indice, onMudar, onFechar }: { fotos: Foto[]; indice: number; onMudar: (i: number) => void; onFechar: () => void }) {
  const f = fotos[indice];
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onMudar((indice + 1) % fotos.length);
      if (e.key === 'ArrowLeft') onMudar((indice - 1 + fotos.length) % fotos.length);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [indice, fotos.length, onMudar]);
  useEsc(true, onFechar);
  if (!f) return null;
  return (
    <div className="lightbox" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <button type="button" className="lb-x" onClick={onFechar}><Icone nome="x" /></button>
      {fotos.length > 1 && <button type="button" className="lb-nav lb-prev" onClick={() => onMudar((indice - 1 + fotos.length) % fotos.length)}>‹</button>}
      <figure>
        <img src={f.src} alt={f.descricao || 'Foto'} />
        <figcaption>
          <b>{CATEGORIAS_FOTO.find((c) => c.id === f.categoria)?.nome}</b> · {dataHora(f.data)} {f.descricao && `· ${f.descricao}`}
          <span className="muted"> ({indice + 1}/{fotos.length})</span>
        </figcaption>
      </figure>
      {fotos.length > 1 && <button type="button" className="lb-nav lb-next" onClick={() => onMudar((indice + 1) % fotos.length)}>›</button>}
    </div>
  );
}

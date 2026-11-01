import { useState } from 'react';
import type { Foto } from '../../types';
import { CATEGORIAS_FOTO } from '../../constants/dominio';
import { dataHora } from '../../utils/formato';
import { Vazio } from '../../componentes/ui/Basicos';
import { Visualizador } from './Visualizador';

/** Fotos agrupadas por categoria, com ampliação e exclusão */
export function GaleriaFotos({ fotos, onRemover, agrupar = true }: { fotos: Foto[]; onRemover?: (id: string) => void; agrupar?: boolean }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  if (!fotos.length) return <Vazio>Nenhuma foto anexada ainda.</Vazio>;
  const ordenadas = [...fotos].sort((a, b) => a.data.localeCompare(b.data));
  const grupos = agrupar
    ? CATEGORIAS_FOTO.map((c) => ({ nome: c.nome, fotos: ordenadas.filter((f) => f.categoria === c.id) })).filter((g) => g.fotos.length)
    : [{ nome: '', fotos: ordenadas }];

  const miniatura = (f: Foto) => (
    <div className="ph" key={f.id}>
      <img src={f.src} alt={f.descricao} loading="lazy" onClick={() => setAberta(ordenadas.indexOf(f))} />
      <div className="ph-legenda">{f.descricao || dataHora(f.data)}</div>
      {f.origem === 'local' && <span className="ph-local" title="Salva apenas neste navegador">local</span>}
      {onRemover && (confirmar === f.id
        ? <button type="button" className="ph-del sim" onClick={() => { onRemover(f.id); setConfirmar(null); }}>Excluir?</button>
        : <button type="button" className="ph-del" onClick={() => setConfirmar(f.id)} aria-label="Excluir foto">✕</button>)}
    </div>
  );

  return (
    <>
      {grupos.map((g) => (
        <div key={g.nome} style={{ marginBottom: 14 }}>
          {g.nome && <h4 className="grupo">{g.nome} <span className="tag">{g.fotos.length}</span></h4>}
          <div className="photos">{g.fotos.map(miniatura)}</div>
        </div>
      ))}
      {aberta !== null && <Visualizador fotos={ordenadas} indice={aberta} onMudar={setAberta} onFechar={() => setAberta(null)} />}
    </>
  );
}

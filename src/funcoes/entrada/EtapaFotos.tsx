import { useState } from 'react';
import type { RascunhoEntrada } from '../../types';
import { CATEGORIAS_FOTO } from '../../constants/dominio';
import { UploadFotos } from '../fotos/UploadFotos';
import { Visualizador } from '../fotos/Visualizador';
import { agora } from '../../utils/formato';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };

/** Passo 6 — fotos do veículo e do problema já na recepção */
export function EtapaFotos({ r, set }: Props) {
  const [aberta, setAberta] = useState<number | null>(null);
  const comoFotos = r.fotos.map((f, i) => ({ ...f, id: String(i), osId: '', data: agora(), origem: 'local' as const }));
  return (
    <>
      <h3>Fotos da entrada <span className="tag">{r.fotos.length}</span></h3>
      <p className="muted" style={{ marginTop: -4 }}>Fotografe o veículo (frente, laterais, traseira e painel com o km) e o problema relatado.</p>
      <UploadFotos categorias={['VEICULO', 'PROBLEMA']} categoriaInicial="VEICULO" onAdicionar={(novas) => set((x) => { x.fotos = [...x.fotos, ...novas]; })} />
      <div className="photos" style={{ marginTop: 12 }}>
        {r.fotos.map((f, i) => (
          <div className="ph" key={i}>
            <img src={f.src} alt={f.descricao} onClick={() => setAberta(i)} />
            <div className="ph-legenda">{CATEGORIAS_FOTO.find((c) => c.id === f.categoria)?.nome}{f.descricao && ` · ${f.descricao}`}</div>
            <button type="button" className="ph-del" onClick={() => set((x) => { x.fotos = x.fotos.filter((_, k) => k !== i); })}>✕</button>
          </div>
        ))}
      </div>
      {aberta !== null && <Visualizador fotos={comoFotos} indice={aberta} onMudar={setAberta} onFechar={() => setAberta(null)} />}
    </>
  );
}

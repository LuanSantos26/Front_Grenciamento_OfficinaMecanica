import { useState } from 'react';
import type { OrdemServico } from '../../../types';
import { dataHora } from '../../../utils/formato';
import { useOficina } from '../../../contexto/OficinaContext';

export function AbaHistorico({ os }: { os: OrdemServico }) {
  const { executar } = useOficina();
  const [nota, setNota] = useState('');
  return (
    <>
      <form className="row mb" onSubmit={async (e) => { e.preventDefault(); if (!nota.trim()) return; await executar((r) => r.anotar(os.id, nota.trim())); setNota(''); }}>
        <input className="in" value={nota} placeholder="Adicionar anotação (ex.: cliente ligou pedindo previsão)" onChange={(e) => setNota(e.target.value)} />
        <button className="btn">Anotar</button>
      </form>
      <div className="tl">
        {[...os.hist].reverse().map((h, i) => <div className="it" key={i}><small>{dataHora(h.d)}</small>{h.t}</div>)}
      </div>
    </>
  );
}

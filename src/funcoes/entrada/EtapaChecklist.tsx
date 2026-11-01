import type { RascunhoEntrada, StatusChecklist } from '../../types';
import { CHECKLIST } from '../../constants/dominio';
import { Segmentado } from '../../componentes/ui/Campos';
import { Progresso } from '../../componentes/ui/Basicos';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };
const OPCOES = ['OK', 'Atenção', 'Avaria', 'N/A'] as const;

/** Passo 3 — inspeção visual de entrada (linha pesada) */
export function EtapaChecklist({ r, set }: Props) {
  const todos = Object.values(CHECKLIST).flat();
  const feitos = todos.filter((i) => r.entrada.checklist[i]).length;
  return (
    <>
      <h3>Checklist de entrada <span className={`tag ${feitos === todos.length ? 'ok' : ''}`}>{feitos}/{todos.length}</span><span className="sp" />
        <button type="button" className="btn sm" onClick={() => set((x) => { todos.forEach((i) => { x.entrada.checklist[i] ??= 'OK'; }); })}>Marcar restantes como OK</button>
      </h3>
      <div style={{ marginBottom: 16 }}><Progresso pct={(feitos / todos.length) * 100} /></div>
      <div className="grid g2">
        {Object.entries(CHECKLIST).map(([grupo, itens]) => (
          <div className="ckgrp" key={grupo}>
            <h4>{grupo}</h4>
            {itens.map((it) => {
              const v = r.entrada.checklist[it];
              return (
                <div className="ck" key={it}>
                  <span>{it}</span>
                  <Segmentado<StatusChecklist> valor={v} opcoes={OPCOES} onChange={(nv) => set((x) => { x.entrada.checklist[it] = nv; })} />
                  {(v === 'Atenção' || v === 'Avaria') && (
                    <input className="in obs" placeholder="Descreva…" value={r.entrada.ckObs[it] || ''} onChange={(e) => set((x) => { x.entrada.ckObs[it] = e.target.value; })} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <label className="f">Pertences deixados no veículo
        <input className="in" value={r.entrada.pertences} placeholder="Rádio PX, GPS, ferramentas, colchão, geladeira…" onChange={(e) => set((x) => { x.entrada.pertences = e.target.value; })} />
      </label>
    </>
  );
}

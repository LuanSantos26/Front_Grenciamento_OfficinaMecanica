import { useState } from 'react';
import type { MedicaoPneu, RascunhoEntrada } from '../../types';
import { CONFIG_PNEUS, configPneus } from '../../constants/dominio';
import { Campo, Selecao } from '../../componentes/ui/Campos';
import { Vazio } from '../../componentes/ui/Basicos';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };
const VAZIO: MedicaoPneu = { sulco: '', pressao: '', marca: '', dot: '', estado: 'Normal' };
export const corSulco = (s?: string) => { const n = parseFloat(s || ''); return isNaN(n) ? '' : n < 3 ? 'r' : n < 6 ? 'y' : 'g'; };

/** Passo 4 — mapa de pneus conforme a configuração de eixos */
export function EtapaPneus({ r, set }: Props) {
  const cfg = configPneus(r.veiculo.tipo);
  const eixos = CONFIG_PNEUS[cfg];
  const chaves = [...eixos.flatMap(([, ps], ai) => ps.map((p) => `${ai + 1}-${p}`)), 'estepe'];
  const [sel, setSel] = useState<string | null>(null);
  const atual = sel ? r.entrada.pneus[sel] || VAZIO : null;
  const editar = (campo: keyof MedicaoPneu, v: string) => set((x) => { x.entrada.pneus[sel!] = { ...(x.entrada.pneus[sel!] || VAZIO), [campo]: v }; });

  const pneu = (k: string, rotulo: string) => (
    <button type="button" key={k} className={`tire ${corSulco(r.entrada.pneus[k]?.sulco)} ${sel === k ? 'sel' : ''}`} onClick={() => setSel(k)}>
      <span>{r.entrada.pneus[k]?.sulco || '—'}</span><small>{rotulo}</small>
    </button>
  );

  return (
    <>
      <h3>Mapa de pneus <span className="tag">{cfg}</span><span className="sp" /><span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>Clique em um pneu e informe o sulco em mm</span></h3>
      <div className="grid g2">
        <div className="tiremap">
          <div className="cab">{/Carreta/.test(cfg) ? 'PINO-REI' : 'FRENTE · CABINE'}</div>
          {eixos.map(([nome, ps], ai) => (
            <div className="axle" key={nome}>
              <span className="lbl">{nome}</span>
              {ps.filter((p) => p.startsWith('E')).map((p) => pneu(`${ai + 1}-${p}`, p))}
              <div className="bar" />
              {ps.filter((p) => p.startsWith('D')).map((p) => pneu(`${ai + 1}-${p}`, p))}
            </div>
          ))}
          <div className="axle"><span className="lbl">Estepe</span>{pneu('estepe', 'EST')}</div>
          <div className="row muted legenda">
            <span><span className="dot" style={{ background: 'var(--ok)' }} /> ≥ 6 mm</span>
            <span><span className="dot" style={{ background: 'var(--warn)' }} /> 3–6 mm</span>
            <span><span className="dot" style={{ background: 'var(--bad)' }} /> &lt; 3 mm (limite legal 1,6 mm)</span>
          </div>
        </div>
        <div>
          {atual ? (
            <div className="caixa">
              <h3>Pneu {sel}</h3>
              <div className="fg">
                <Campo rotulo="Sulco (mm)" type="number" step="0.5" autoFocus valor={atual.sulco} onChange={(v) => editar('sulco', v)} />
                <Campo rotulo="Pressão (psi)" type="number" valor={atual.pressao} onChange={(v) => editar('pressao', v)} />
                <Campo rotulo="Marca / modelo" valor={atual.marca} onChange={(v) => editar('marca', v)} />
                <Campo rotulo="DOT / nº de fogo" className="mono" valor={atual.dot} onChange={(v) => editar('dot', v)} />
                <Selecao rotulo="Estado" valor={atual.estado} opcoes={['Normal', 'Recapado', 'Desgaste irregular', 'Bolha / corte', 'Careca']} onChange={(v) => editar('estado', v)} />
              </div>
              <button type="button" className="btn sm" style={{ marginTop: 12 }} onClick={() => setSel(chaves[(chaves.indexOf(sel!) + 1) % chaves.length])}>Próximo pneu →</button>
            </div>
          ) : <Vazio>Selecione um pneu no mapa ao lado.</Vazio>}
          <div className="muted" style={{ marginTop: 14 }}>Medidos: {Object.values(r.entrada.pneus).filter((p) => p.sulco).length} de {chaves.length}</div>
        </div>
      </div>
    </>
  );
}

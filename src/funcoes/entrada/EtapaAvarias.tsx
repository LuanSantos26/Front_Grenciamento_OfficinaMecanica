import { useState } from 'react';
import type { RascunhoEntrada } from '../../types';
import { COR_AVARIA, TIPOS_AVARIA } from '../../constants/dominio';
import { Segmentado } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { DiagramaCaminhao } from './DiagramaCaminhao';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };

/** Passo 5 — marcação de avarias pré-existentes na carroceria e no chassi */
export function EtapaAvarias({ r, set }: Props) {
  const [tipo, setTipo] = useState('Amassado');
  return (
    <>
      <h3>Avarias na carroceria / chassi</h3>
      <div className="row wrap" style={{ marginBottom: 10 }}>
        <span className="muted">Tipo:</span>
        <Segmentado valor={tipo} opcoes={TIPOS_AVARIA} onChange={setTipo} render={(a) => <><span className="dot" style={{ background: COR_AVARIA[a] }} /> {a}</>} />
      </div>
      <div className="dmg-wrap">
        <DiagramaCaminhao marcas={r.entrada.avarias} onMarcar={(x, y) => set((d) => { d.entrada.avarias.push({ x, y, tipo, obs: '' }); })} />
      </div>
      <p className="muted" style={{ fontSize: 12 }}>Clique no desenho para marcar o local. Isso protege a oficina contra reclamação de danos que já existiam.</p>
      {r.entrada.avarias.length > 0 && (
        <table>
          <thead><tr><th>#</th><th>Tipo</th><th>Descrição</th><th /></tr></thead>
          <tbody>
            {r.entrada.avarias.map((a, i) => (
              <tr key={i}>
                <td><b>{i + 1}</b></td>
                <td><span className="tag" style={{ color: COR_AVARIA[a.tipo] }}><span className="dot" style={{ background: COR_AVARIA[a.tipo] }} />{a.tipo}</span></td>
                <td><input className="in" value={a.obs} placeholder="ex.: para-choque LD amassado 10 cm" onChange={(e) => set((d) => { d.entrada.avarias[i].obs = e.target.value; })} /></td>
                <td><button type="button" className="btn sm ghost danger" onClick={() => set((d) => { d.entrada.avarias.splice(i, 1); })}><Icone nome="x" tam={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

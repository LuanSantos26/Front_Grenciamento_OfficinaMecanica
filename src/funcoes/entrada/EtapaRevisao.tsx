import type { RascunhoEntrada } from '../../types';
import { num } from '../../utils/formato';
import { useOficina } from '../../contexto/OficinaContext';
import { AssinaturaPad } from '../../componentes/ui/AssinaturaPad';
import { Alerta } from '../../componentes/ui/Basicos';
import { Placa, TagSeveridade } from '../../componentes/ui/Tags';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };

/** Passo 7 — conferência final e assinatura de quem entregou o veículo */
export function EtapaRevisao({ r, set }: Props) {
  const { dados } = useOficina();
  const cliente = r.clienteId === 'novo' ? r.novoCliente.nome : dados.clientes.find((c) => c.id === r.clienteId)?.nome;
  const atencao = Object.entries(r.entrada.checklist).filter(([, v]) => v === 'Avaria' || v === 'Atenção');
  const pneusRuins = Object.entries(r.entrada.pneus).filter(([, p]) => parseFloat(p.sulco) < 3);
  return (
    <>
      <h3>Revisão da entrada</h3>
      <div className="grid g3">
        <div><div className="muted">Veículo</div><div style={{ margin: '4px 0' }}><Placa placa={r.veiculo.placa} /></div>
          <b>{r.veiculo.marca} {r.veiculo.modelo}</b> {r.veiculo.ano}<div className="muted">{r.veiculo.tipo}{r.entrada.carreta && ` + carreta ${r.entrada.carretaPlaca}`}</div></div>
        <div><div className="muted">Cliente</div><b>{cliente || '—'}</b><div className="muted">Motorista: {r.entrada.motorista || '—'}</div></div>
        <div><div className="muted">Chegada</div><b className="mono">{num(r.entrada.km)} km</b><div className="muted">Combustível {r.entrada.combustivel}/8 · {r.os.tipo} · {r.os.prioridade} · {r.fotos.length} foto(s)</div></div>
      </div>
      <hr className="s" />
      <div className="grid g2">
        <div><h3>Reclamações</h3>
          {r.reclamacoes.filter((x) => x.texto.trim()).map((x, i) => (
            <Alerta key={i} icone="defeitos" cor="warn">{x.texto}<div className="row wrap" style={{ marginTop: 4 }}><span className="tag">{x.sistema}</span><TagSeveridade s={x.sev} /></div></Alerta>
          ))}
        </div>
        <div><h3>Pontos de atenção na inspeção</h3>
          {atencao.map(([k, v]) => <div className="row linha" key={k}><span className={`tag ${v === 'Avaria' ? 'bad' : 'warn'}`}>{v}</span>{k}</div>)}
          {pneusRuins.map(([k, p]) => <div className="row linha" key={k}><span className="tag bad">Pneu</span>{k}: sulco {p.sulco} mm</div>)}
          {r.entrada.avarias.length > 0 && <div className="row linha"><span className="tag warn">Carroceria</span>{r.entrada.avarias.length} avaria(s) marcada(s)</div>}
          {!atencao.length && !pneusRuins.length && !r.entrada.avarias.length && <div className="muted">Nada registrado</div>}
        </div>
      </div>
      <hr className="s" />
      <h3>Assinatura do motorista / responsável</h3>
      <p className="muted" style={{ marginTop: -6, fontSize: 12.5 }}>Declaro que o veículo foi entregue nas condições acima e autorizo o diagnóstico.</p>
      <AssinaturaPad valor={r.entrada.assinatura} onChange={(v) => set((x) => { x.entrada.assinatura = v; })} />
    </>
  );
}

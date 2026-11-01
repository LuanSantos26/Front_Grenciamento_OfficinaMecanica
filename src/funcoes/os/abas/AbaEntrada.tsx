import type { OrdemServico } from '../../../types';
import { CONFERENCIA_SAIDA } from '../../../constants/dominio';
import { dataHora, duracao, horasDesde, num } from '../../../utils/formato';
import { useDetalhe } from '../../../contexto/DetalheContext';
import { Card, Vazio } from '../../../componentes/ui/Basicos';
import { Icone } from '../../../componentes/ui/Icone';
import { DiagramaCaminhao } from '../../entrada/DiagramaCaminhao';
import { corSulco } from '../../entrada/EtapaPneus';

/** O que foi registrado na entrada (checklist, pneus, avarias) e na saída do veículo */
export function AbaEntrada({ os }: { os: OrdemServico }) {
  const { pedirSaida } = useDetalhe();
  const e = os.entrada;
  const ck = Object.entries(e.checklist || {});
  const pneus = Object.entries(e.pneus || {}).filter(([, p]) => p.sulco);
  const s = os.saida;
  return (
    <>
      <div className="grid g2 mb">
        <Card titulo={<><Icone nome="entrar" tam={16} /> Entrada</>}>
          <div className="grid g2">
            <div><div className="muted">Data/hora</div><b>{dataHora(os.abertura)}</b></div>
            <div><div className="muted">Hodômetro</div><b className="mono">{num(e.km)} km</b></div>
            <div><div className="muted">Combustível</div><b>{e.combustivel}/8</b></div>
            <div><div className="muted">Entregue por</div><b>{e.motorista || '—'}</b></div>
          </div>
          {e.pertences && <p className="muted"><b>Pertences:</b> {e.pertences}</p>}
          {e.assinatura && <img className="assinatura" src={e.assinatura} alt="Assinatura na entrada" />}
        </Card>
        <Card titulo={<><Icone nome="saida" tam={16} /> Saída</>}>
          {s ? <>
            <div className="grid g2">
              <div><div className="muted">Data/hora</div><b>{dataHora(s.data)}</b></div>
              <div><div className="muted">Hodômetro</div><b className="mono">{num(s.km)} km</b> <span className="muted">(+{num(s.km - e.km)} km)</span></div>
              <div><div className="muted">Retirado por</div><b>{s.retiradoPor}</b>{s.documento && <div className="muted">{s.documento}</div>}</div>
              <div><div className="muted">Permanência</div><b>{duracao(horasDesde(os.abertura, s.data))}</b></div>
            </div>
            <div style={{ marginTop: 8 }}>{CONFERENCIA_SAIDA.map((c) => <div key={c} className="muted" style={{ fontSize: 12.5 }}>{s.conferencia[c] ? '✅' : '⬜'} {c}</div>)}</div>
            {s.obs && <p className="muted">{s.obs}</p>}
            {s.assinatura && <img className="assinatura" src={s.assinatura} alt="Assinatura na saída" />}
          </> : <>
            <Vazio>Veículo ainda na oficina.</Vazio>
            {os.status === 'Pronto p/ retirada' && <button type="button" className="btn pri sm" onClick={() => pedirSaida(os.id)}>Registrar saída</button>}
          </>}
        </Card>
      </div>
      <div className="grid g2">
        <Card titulo="Checklist de entrada">
          {ck.length ? ck.map(([k, v]) => (
            <div className="row linha" key={k}>
              <span style={{ flex: 1 }}>{k}{e.ckObs?.[k] && <div className="muted" style={{ fontSize: 12 }}>{e.ckObs[k]}</div>}</span>
              <span className={`tag ${v === 'OK' ? 'ok' : v === 'Avaria' ? 'bad' : v === 'Atenção' ? 'warn' : ''}`}>{v}</span>
            </div>
          )) : <div className="muted">Checklist não preenchido.</div>}
        </Card>
        <div>
          <Card titulo={`Avarias (${e.avarias.length})`} className="mb">
            <div className="dmg-wrap"><DiagramaCaminhao marcas={e.avarias} /></div>
            {e.avarias.map((a, i) => <div key={i} style={{ fontSize: 12.5 }}><b>{i + 1}.</b> {a.tipo}{a.obs && ` — ${a.obs}`}</div>)}
          </Card>
          <Card titulo="Pneus">
            {pneus.length ? pneus.map(([k, p]) => <span key={k} className={`tag pneu-${corSulco(p.sulco)}`} style={{ margin: 2 }}>{k}: {p.sulco} mm</span>) : <span className="muted">Sem medições</span>}
          </Card>
        </div>
      </div>
    </>
  );
}

import type { OrdemServico } from '../../types';
import { COR_STATUS, STATUS } from '../../constants/dominio';
import { dataHora, duracao, horasDesde } from '../../utils/formato';
import { percentualOS } from '../../utils/calculos';
import { Progresso } from '../../componentes/ui/Basicos';

/** Barra curta usada nos cartões e tabelas */
export function BarraProgressoOS({ os }: { os: OrdemServico }) {
  const pct = percentualOS(os);
  return (
    <div className="row" style={{ gap: 8 }}>
      <div style={{ flex: 1 }}><Progresso pct={pct} cor={os.status === 'Entregue' ? 'var(--ok)' : COR_STATUS[os.status]} /></div>
      <span className="mono muted" style={{ fontSize: 11.5 }}>{pct}%</span>
    </div>
  );
}

/**
 * Progresso completo da OS: linha do tempo das 8 etapas, com data/hora em que
 * cada uma começou e quanto tempo o veículo ficou parado nela.
 */
export function ProgressoOS({ os }: { os: OrdemServico }) {
  const atual = STATUS.indexOf(os.status);
  const pct = percentualOS(os);
  // última vez que a OS entrou em cada etapa
  const inicio = new Map(os.progresso.map((p) => [p.status, p]));
  const eventos = [...os.progresso].sort((a, b) => a.data.localeCompare(b.data));
  const tempoNaEtapa = new Map<string, number>();
  eventos.forEach((e, i) => {
    const fim = eventos[i + 1]?.data ?? (os.status === 'Entregue' ? e.data : null);
    tempoNaEtapa.set(e.status, (tempoNaEtapa.get(e.status) || 0) + horasDesde(e.data, fim));
  });
  const total = horasDesde(os.abertura, os.saida?.data);
  const servFeitos = os.servicos.filter((s) => s.feito).length;

  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        <b style={{ fontSize: 22 }}>{pct}%</b><span className="muted">concluído</span><span className="sp" />
        <span className="muted">{os.status === 'Entregue' ? 'Permanência total' : 'Na oficina há'} <b className="tx">{duracao(total)}</b></span>
      </div>
      <Progresso pct={pct} cor={os.status === 'Entregue' ? 'var(--ok)' : COR_STATUS[os.status]} />
      {os.servicos.length > 0 && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Serviços concluídos: {servFeitos} de {os.servicos.length}</div>}

      <ol className="stepper">
        {STATUS.map((s, i) => {
          const ev = inicio.get(s);
          const estado = i < atual || (i === atual && os.status === 'Entregue') ? 'feito' : i === atual ? 'atual' : 'pendente';
          const pulado = i < atual && !ev;
          return (
            <li key={s} className={`stp ${estado}${pulado ? ' pulado' : ''}`} style={{ ['--c' as string]: COR_STATUS[s] }}>
              <span className="stp-dot">{estado === 'feito' && !pulado ? '✓' : i + 1}</span>
              <div className="stp-txt">
                <b>{s}</b>
                <small>
                  {pulado ? 'etapa não utilizada' : ev ? `${dataHora(ev.data)}${tempoNaEtapa.get(s) ? ` · ${i === atual && os.status !== 'Entregue' ? 'há ' : ''}${duracao(tempoNaEtapa.get(s)!)}` : ''}` : 'pendente'}
                  {ev?.obs && ` · ${ev.obs}`}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

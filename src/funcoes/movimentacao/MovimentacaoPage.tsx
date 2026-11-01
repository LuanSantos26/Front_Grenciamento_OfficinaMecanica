import { useMemo, useState } from 'react';
import { data, dataHora, duracao, horasDesde, inicioDoDia, num } from '../../utils/formato';
import { abertas } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Cabecalho, Card, Kpi, Vazio } from '../../componentes/ui/Basicos';
import { Segmentado } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagStatus } from '../../componentes/ui/Tags';
import { BarraProgressoOS } from '../progresso/ProgressoOS';

const PERIODOS = { 'Hoje': 0, '7 dias': 7, '30 dias': 30, 'Tudo': 99999 } as const;
type Periodo = keyof typeof PERIODOS;

interface Evento { tipo: 'Entrada' | 'Saída'; data: string; osId: string; num: number; veiculoId: string; clienteId: string; km: number; pessoa: string; permanencia?: number }

/** Controle de entrada e saída de veículos e progresso de quem está no pátio */
export function MovimentacaoPage() {
  const { dados } = useOficina();
  const { abrir, pedirSaida } = useDetalhe();
  const q = useConsultas();
  const [periodo, setPeriodo] = useState<Periodo>('7 dias');
  const [tipo, setTipo] = useState<'Todos' | 'Entradas' | 'Saídas'>('Todos');

  const eventos = useMemo<Evento[]>(() => dados.ordens.flatMap((o) => {
    const ev: Evento[] = [{ tipo: 'Entrada', data: o.abertura, osId: o.id, num: o.num, veiculoId: o.veiculoId, clienteId: o.clienteId, km: o.entrada.km, pessoa: o.entrada.motorista }];
    if (o.saida) ev.push({ tipo: 'Saída', data: o.saida.data, osId: o.id, num: o.num, veiculoId: o.veiculoId, clienteId: o.clienteId, km: o.saida.km, pessoa: o.saida.retiradoPor, permanencia: horasDesde(o.abertura, o.saida.data) });
    return ev;
  }).sort((a, b) => b.data.localeCompare(a.data)), [dados]);

  const desde = PERIODOS[periodo] === 0 ? inicioDoDia(new Date()) : new Date(Date.now() - PERIODOS[periodo] * 864e5);
  const noPeriodo = eventos.filter((e) => new Date(e.data) >= desde);
  const entradas = noPeriodo.filter((e) => e.tipo === 'Entrada');
  const saidas = noPeriodo.filter((e) => e.tipo === 'Saída');
  const lista = noPeriodo.filter((e) => tipo === 'Todos' || (tipo === 'Entradas' ? e.tipo === 'Entrada' : e.tipo === 'Saída'));
  const patio = abertas(dados).sort((a, b) => a.abertura.localeCompare(b.abertura));
  const permMedia = saidas.length ? saidas.reduce((a, e) => a + (e.permanencia || 0), 0) / saidas.length : 0;

  // últimos 14 dias para o gráfico
  const dias = Array.from({ length: 14 }, (_, i) => { const d = inicioDoDia(new Date(Date.now() - (13 - i) * 864e5)); return d; });
  const contar = (t: Evento['tipo'], d: Date) => eventos.filter((e) => e.tipo === t && inicioDoDia(new Date(e.data)).getTime() === d.getTime()).length;
  const serie = dias.map((d) => ({ d, ent: contar('Entrada', d), sai: contar('Saída', d) }));
  const max = Math.max(1, ...serie.map((s) => Math.max(s.ent, s.sai)));

  return (
    <>
      <Cabecalho titulo="Entrada e saída de veículos" sub="Movimentação do pátio e progresso de cada veículo">
        <Segmentado valor={periodo} opcoes={Object.keys(PERIODOS) as Periodo[]} onChange={setPeriodo} />
        <a className="btn pri" href="#entrada"><Icone nome="entrar" tam={16} />Registrar entrada</a>
      </Cabecalho>
      <div className="grid g4">
        <Kpi titulo={`Entradas (${periodo.toLowerCase()})`} valor={entradas.length} rodape="veículos recebidos" icone="entrar" cor="var(--info)" />
        <Kpi titulo={`Saídas (${periodo.toLowerCase()})`} valor={saidas.length} rodape="veículos entregues" icone="saida" cor="var(--ok)" />
        <Kpi titulo="No pátio agora" valor={patio.length} rodape={`${patio.filter((o) => o.status === 'Pronto p/ retirada').length} prontos p/ retirada`} icone="patio" cor="var(--ac)" />
        <Kpi titulo="Permanência média" valor={duracao(permMedia)} rodape="das saídas no período" icone="relogio" cor="var(--vio)" />
      </div>

      <div className="grid g21 mt">
        <Card titulo="Últimos 14 dias" acoes={<span className="row legenda"><span><span className="dot" style={{ background: 'var(--info)' }} /> Entradas</span><span><span className="dot" style={{ background: 'var(--ok)' }} /> Saídas</span></span>}>
          <div className="colunas">
            {serie.map((s) => (
              <div className="coluna" key={s.d.toISOString()} title={`${data(s.d.toISOString())}: ${s.ent} entrada(s), ${s.sai} saída(s)`}>
                <div className="barras-par">
                  <i style={{ height: `${(s.ent / max) * 100}%`, background: 'var(--info)' }} />
                  <i style={{ height: `${(s.sai / max) * 100}%`, background: 'var(--ok)' }} />
                </div>
                <small>{s.d.getDate()}/{s.d.getMonth() + 1}</small>
              </div>
            ))}
          </div>
        </Card>
        <Card titulo={<>No pátio agora <span className="tag">{patio.length}</span></>}>
          {patio.length ? patio.map((o) => (
            <div key={o.id} className="patio-item click" onClick={() => abrir(o.id, 'progresso')}>
              <div className="row"><Placa placa={q.veiculo(o.veiculoId)?.placa} /><span className="corta" style={{ flex: 1 }}>{q.veiculo(o.veiculoId)?.modelo}</span><span className="mono muted">{duracao(horasDesde(o.abertura))}</span></div>
              <div className="row" style={{ marginTop: 6 }}><TagStatus status={o.status} /><div style={{ flex: 1 }}><BarraProgressoOS os={o} /></div></div>
              {o.status === 'Pronto p/ retirada' && <button type="button" className="btn sm pri mt" onClick={(e) => { e.stopPropagation(); pedirSaida(o.id); }}><Icone nome="saida" tam={13} />Registrar saída</button>}
            </div>
          )) : <Vazio>Pátio vazio</Vazio>}
        </Card>
      </div>

      <Card className="mt" titulo="Registro de entradas e saídas" acoes={<Segmentado valor={tipo} opcoes={['Todos', 'Entradas', 'Saídas'] as const} onChange={setTipo} />}>
        {lista.length ? (
          <div className="tbl"><table>
            <thead><tr><th>Movimento</th><th>Data/hora</th><th>Veículo</th><th>Cliente</th><th>Km</th><th>Entregue / retirado por</th><th>OS</th><th>Permanência</th></tr></thead>
            <tbody>{lista.map((e) => {
              const v = q.veiculo(e.veiculoId);
              return (
                <tr key={e.tipo + e.osId} className="click" onClick={() => abrir(e.osId, 'entrada')}>
                  <td><span className={`tag ${e.tipo === 'Entrada' ? 'info' : 'ok'}`}><Icone nome={e.tipo === 'Entrada' ? 'entrar' : 'saida'} tam={12} /> {e.tipo}</span></td>
                  <td>{dataHora(e.data)}</td>
                  <td><Placa placa={v?.placa} /> <span className="muted">{v?.modelo}</span></td>
                  <td>{q.cliente(e.clienteId)?.nome}</td>
                  <td className="mono">{num(e.km)}</td>
                  <td>{e.pessoa || '—'}</td>
                  <td className="mono">#{e.num}</td>
                  <td className="mono">{e.permanencia !== undefined ? duracao(e.permanencia) : '—'}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <Vazio>Nenhuma movimentação no período.</Vazio>}
      </Card>
    </>
  );
}

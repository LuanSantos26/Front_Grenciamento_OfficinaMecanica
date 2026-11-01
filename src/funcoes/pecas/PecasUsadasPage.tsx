import { useMemo, useState } from 'react';
import { brl, data, dataHora } from '../../utils/formato';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useToast } from '../../contexto/ToastContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Barras, Cabecalho, Card, Kpi, Vazio } from '../../componentes/ui/Basicos';
import { Segmentado, Selecao } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa } from '../../componentes/ui/Tags';

const PERIODOS = { '7 dias': 7, '30 dias': 30, '90 dias': 90, 'Tudo': 99999 } as const;
type Periodo = keyof typeof PERIODOS;
type Vista = 'Por peça' | 'Por veículo' | 'Detalhado';

/** Relatório de quais peças foram usadas, em quais veículos/OS, quanto e por quem */
export function PecasUsadasPage() {
  const { dados } = useOficina();
  const { abrir } = useDetalhe();
  const toast = useToast();
  const q = useConsultas();
  const [periodo, setPeriodo] = useState<Periodo>('30 dias');
  const [vista, setVista] = useState<Vista>('Por peça');
  const [cliente, setCliente] = useState('');
  const [busca, setBusca] = useState('');

  const linhas = useMemo(() => {
    const desde = Date.now() - PERIODOS[periodo] * 864e5;
    const t = busca.toLowerCase();
    return dados.ordens.flatMap((o) => o.pecas.map((p) => {
      const v = q.veiculo(o.veiculoId);
      const est = q.peca(p.pecaId);
      const custo = p.custoUnit ?? est?.custo;
      return { ...p, quando: p.data || o.abertura, os: o, placa: v?.placa || '', veiculo: `${v?.marca || ''} ${v?.modelo || ''}`, clienteId: o.clienteId,
        total: p.qtd * p.valorUnit, custoTotal: custo !== undefined ? custo * p.qtd : undefined };
    })).filter((l) => new Date(l.quando).getTime() >= desde && (!cliente || l.clienteId === cliente)
      && (!t || [l.cod, l.desc, l.placa, l.veiculo].join(' ').toLowerCase().includes(t)))
      .sort((a, b) => b.quando.localeCompare(a.quando));
  }, [dados, periodo, cliente, busca, q]);

  const qtd = linhas.reduce((a, l) => a + l.qtd, 0);
  const valor = linhas.reduce((a, l) => a + l.total, 0);
  const comCusto = linhas.filter((l) => l.custoTotal !== undefined);
  const margem = comCusto.reduce((a, l) => a + l.total - (l.custoTotal || 0), 0);
  const margemPct = comCusto.length ? (margem / comCusto.reduce((a, l) => a + l.total, 0)) * 100 : 0;

  const porPeca = useMemo(() => {
    const m = new Map<string, { cod: string; desc: string; qtd: number; total: number; custo: number; os: Set<number>; ultima: string }>();
    linhas.forEach((l) => {
      const k = l.cod || l.desc;
      const x = m.get(k) || { cod: l.cod, desc: l.desc, qtd: 0, total: 0, custo: 0, os: new Set<number>(), ultima: '' };
      x.qtd += l.qtd; x.total += l.total; x.custo += l.custoTotal || 0; x.os.add(l.os.num); if (l.quando > x.ultima) x.ultima = l.quando;
      m.set(k, x);
    });
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [linhas]);

  const porVeiculo = useMemo(() => {
    const m = new Map<string, { placa: string; veiculo: string; clienteId: string; qtd: number; total: number; os: Set<number>; itens: Set<string> }>();
    linhas.forEach((l) => {
      const x = m.get(l.placa) || { placa: l.placa, veiculo: l.veiculo, clienteId: l.clienteId, qtd: 0, total: 0, os: new Set<number>(), itens: new Set<string>() };
      x.qtd += l.qtd; x.total += l.total; x.os.add(l.os.num); x.itens.add(l.desc);
      m.set(l.placa, x);
    });
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [linhas]);

  async function copiarCsv() {
    const cab = 'data;os;placa;codigo;peca;quantidade;valor_unitario;total;aplicada_por';
    const corpo = linhas.map((l) => [data(l.quando), l.os.num, l.placa, l.cod, l.desc, l.qtd, l.valorUnit.toFixed(2).replace('.', ','), l.total.toFixed(2).replace('.', ','), q.funcionario(l.mecId)?.nome || ''].join(';'));
    try { await navigator.clipboard.writeText([cab, ...corpo].join('\n')); toast('Planilha copiada — cole no Excel'); } catch { toast('Não foi possível copiar', 'erro'); }
  }

  return (
    <>
      <Cabecalho titulo="Peças utilizadas" sub="Quais peças foram aplicadas, em quais veículos e ordens de serviço">
        <div className="search"><Icone nome="busca" tam={15} /><input className="in" placeholder="Peça, código ou placa" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <Selecao valor={cliente} opcoes={[['', 'Todos os clientes'], ...dados.clientes.map((c) => [c.id, c.nome] as [string, string])]} onChange={setCliente} />
        <Segmentado valor={periodo} opcoes={Object.keys(PERIODOS) as Periodo[]} onChange={setPeriodo} />
        <button type="button" className="btn" onClick={copiarCsv}><Icone nome="copiar" tam={15} />Copiar planilha</button>
      </Cabecalho>
      <div className="grid g4">
        <Kpi titulo="Peças aplicadas" valor={qtd} rodape={`${linhas.length} lançamentos`} icone="pecas" cor="var(--ac)" />
        <Kpi titulo="Itens diferentes" valor={porPeca.length} rodape={`em ${porVeiculo.length} veículo(s)`} icone="estoque" cor="var(--info)" />
        <Kpi titulo="Valor em peças" valor={brl(valor)} rodape="preço de venda" icone="dinheiro" cor="var(--ok)" />
        <Kpi titulo="Margem bruta" valor={`${margemPct.toFixed(0)}%`} rodape={brl(margem)} icone="relatorios" cor="var(--vio)" />
      </div>
      <div className="grid g21 mt">
        <Card titulo="Lançamentos" acoes={<Segmentado valor={vista} opcoes={['Por peça', 'Por veículo', 'Detalhado'] as const} onChange={setVista} />}>
          {!linhas.length ? <Vazio>Nenhuma peça aplicada no período.</Vazio> : vista === 'Por peça' ? (
            <div className="tbl"><table>
              <thead><tr><th>Código</th><th>Peça</th><th>Qtd</th><th>OS</th><th className="dir">Valor</th><th className="dir">Margem</th><th>Última</th></tr></thead>
              <tbody>{porPeca.map((p) => (
                <tr key={p.cod + p.desc}><td className="mono">{p.cod || '—'}</td><td><b>{p.desc}</b></td><td className="mono">{p.qtd}</td>
                  <td className="mono muted">{[...p.os].map((n) => `#${n}`).join(' ')}</td><td className="dir mono">{brl(p.total)}</td>
                  <td className="dir mono">{p.custo ? `${Math.round(((p.total - p.custo) / p.total) * 100)}%` : '—'}</td><td>{data(p.ultima)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : vista === 'Por veículo' ? (
            <div className="tbl"><table>
              <thead><tr><th>Placa</th><th>Veículo</th><th>Cliente</th><th>Peças</th><th>Itens</th><th>OS</th><th className="dir">Valor</th></tr></thead>
              <tbody>{porVeiculo.map((v) => (
                <tr key={v.placa}><td><Placa placa={v.placa} /></td><td>{v.veiculo}</td><td>{q.cliente(v.clienteId)?.nome}</td><td className="mono">{v.qtd}</td>
                  <td className="muted" style={{ maxWidth: 260 }}>{[...v.itens].join(', ')}</td><td className="mono muted">{[...v.os].map((n) => `#${n}`).join(' ')}</td><td className="dir mono">{brl(v.total)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : (
            <div className="tbl"><table>
              <thead><tr><th>Data</th><th>OS</th><th>Veículo</th><th>Código</th><th>Peça</th><th>Qtd</th><th className="dir">Total</th><th>Aplicada por</th></tr></thead>
              <tbody>{linhas.map((l) => (
                <tr key={l.id} className="click" onClick={() => abrir(l.os.id, 'servicos')}>
                  <td>{dataHora(l.quando)}</td><td className="mono">#{l.os.num}</td><td><Placa placa={l.placa} /></td><td className="mono">{l.cod || '—'}</td>
                  <td>{l.desc}</td><td className="mono">{l.qtd}</td><td className="dir mono">{brl(l.total)}</td><td>{q.funcionario(l.mecId)?.nome || '—'}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </Card>
        <Card titulo="Mais usadas (quantidade)">
          <Barras larguraRotulo={150} itens={[...porPeca].sort((a, b) => b.qtd - a.qtd).slice(0, 8).map((p) => ({ rotulo: p.desc, valor: p.qtd }))} />
        </Card>
      </div>
    </>
  );
}

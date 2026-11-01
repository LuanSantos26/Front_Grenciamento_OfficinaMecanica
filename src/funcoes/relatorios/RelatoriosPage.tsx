import { STATUS, TIPOS_OS } from '../../constants/dominio';
import { brl, duracao, horasDesde } from '../../utils/formato';
import { abertas, totalMaoDeObra, totalOS, totalPecas, valorServico } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { Barras, Cabecalho, Card, Kpi } from '../../componentes/ui/Basicos';
import { TagStatus } from '../../componentes/ui/Tags';

export function RelatoriosPage() {
  const { dados } = useOficina();
  const os = dados.ordens;
  const entregues = os.filter((o) => o.saida);
  const ticket = os.length ? os.reduce((a, o) => a + totalOS(o, dados.funcionarios), 0) / os.length : 0;
  const perm = entregues.length ? entregues.reduce((a, o) => a + horasDesde(o.abertura, o.saida!.data), 0) / entregues.length : 0;
  const retornos = os.filter((o) => o.tipo === 'Garantia / Retorno').length;
  const taxa = os.length ? (retornos / os.length) * 100 : 0;
  const porSistema = new Map<string, number>();
  os.forEach((o) => o.servicos.forEach((s) => porSistema.set(s.sistema, (porSistema.get(s.sistema) || 0) + valorServico(s, dados.funcionarios))));
  // tempo médio parado em cada etapa (a partir do histórico de progresso)
  const tempoEtapa = new Map<string, number[]>();
  os.forEach((o) => {
    const ev = [...o.progresso].sort((a, b) => a.data.localeCompare(b.data));
    ev.forEach((e, i) => { if (e.status === 'Entregue') return; const fim = ev[i + 1]?.data; tempoEtapa.set(e.status, [...(tempoEtapa.get(e.status) || []), horasDesde(e.data, fim)]); });
  });
  const mediaEtapa = STATUS.slice(0, 7).map((s) => { const l = tempoEtapa.get(s) || []; return { s, h: l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0 }; });

  return (
    <>
      <Cabecalho titulo="Relatórios" sub="Indicadores de desempenho da oficina" />
      <div className="grid g4">
        <Kpi titulo="Ticket médio por OS" valor={brl(ticket)} rodape={`${os.length} OS`} icone="dinheiro" cor="var(--ac)" />
        <Kpi titulo="Permanência média" valor={duracao(perm)} rodape="da entrada à saída" icone="relogio" cor="var(--info)" />
        <Kpi titulo="Taxa de retorno" valor={`${taxa.toFixed(1)}%`} rodape={`${retornos} retorno(s) em garantia`} icone="retorno" cor={taxa > 5 ? 'var(--bad)' : 'var(--ok)'} />
        <Kpi titulo="Faturamento" valor={brl(os.reduce((a, o) => a + totalOS(o, dados.funcionarios), 0))} rodape={`MO ${brl(os.reduce((a, o) => a + totalMaoDeObra(o, dados.funcionarios), 0))} · peças ${brl(os.reduce((a, o) => a + totalPecas(o), 0))}`} icone="relatorios" cor="var(--vio)" />
      </div>
      <div className="grid g2 mt">
        <Card titulo="Mão de obra por sistema"><Barras larguraRotulo={170} formato={brl} itens={[...porSistema.entries()].sort((a, b) => b[1] - a[1]).map(([s, v]) => ({ rotulo: s, valor: v }))} /></Card>
        <Card titulo="Tempo médio em cada etapa">
          <Barras larguraRotulo={170} formato={duracao} itens={mediaEtapa.map((m) => ({ rotulo: <TagStatus status={m.s} />, valor: m.h }))} />
          <p className="muted" style={{ fontSize: 12.5 }}>Veículo parado esperando aprovação ou peça é box ocupado sem faturar.</p>
        </Card>
        <Card titulo="OS por tipo de atendimento"><Barras larguraRotulo={190} itens={TIPOS_OS.map((t) => ({ rotulo: t, valor: os.filter((o) => o.tipo === t).length, cor: 'var(--info)' })).filter((x) => x.valor)} /></Card>
        <Card titulo="Produtividade por funcionário (horas concluídas)">
          <Barras larguraRotulo={150} formato={(v) => `${v} h`} itens={dados.funcionarios.map((f) => ({ rotulo: f.nome, valor: os.flatMap((o) => o.servicos).filter((s) => s.mecId === f.id && s.feito).reduce((a, s) => a + (s.horas || 0), 0), cor: 'var(--ok)' }))} />
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{abertas(dados).length} OS abertas no momento.</div>
        </Card>
      </div>
    </>
  );
}

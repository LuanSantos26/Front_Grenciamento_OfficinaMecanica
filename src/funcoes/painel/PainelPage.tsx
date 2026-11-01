import { useState } from 'react';
import { STATUS, COR_STATUS } from '../../constants/dominio';
import { brl, duracao, horasDesde, num } from '../../utils/formato';
import { abertas, atrasada, totalOS } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Alerta, Barras, Cabecalho, Card, Kpi, Vazio } from '../../componentes/ui/Basicos';
import { Dialogo } from '../../componentes/ui/Modal';
import { Campo } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagStatus } from '../../componentes/ui/Tags';

export function PainelPage() {
  const { dados, executar } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  const [novoFunc, setNovoFunc] = useState<{ nome: string; cargo: string; valorHora: string } | null>(null);
  const ab = abertas(dados);
  const aprov = ab.filter((o) => o.status === 'Aguardando aprovação');
  const prontos = ab.filter((o) => o.status === 'Pronto p/ retirada');
  const hoje = new Date().toDateString();
  const saidasHoje = dados.ordens.filter((o) => o.saida && new Date(o.saida.data).toDateString() === hoje).length;
  const entradasHoje = dados.ordens.filter((o) => new Date(o.abertura).toDateString() === hoje).length;

  const alertas = [
    ...ab.filter(atrasada).map((o) => ({ cor: 'bad' as const, icone: 'relogio', id: o.id, t: <><b>OS #{o.num}</b> <Placa placa={q.veiculo(o.veiculoId)?.placa} /> passou da previsão de entrega</> })),
    ...ab.filter((o) => o.tipo === 'Garantia / Retorno').map((o) => ({ cor: 'vio' as const, icone: 'retorno', id: o.id, t: <><b>Retorno em garantia</b> — OS #{o.num} (origem #{o.retornoDe ?? '?'})</> })),
    ...prontos.map((o) => ({ cor: 'ok' as const, icone: 'saida', id: o.id, t: <><Placa placa={q.veiculo(o.veiculoId)?.placa} /> pronto para retirada — avisar o cliente</> })),
    ...dados.estoque.filter((p) => p.qtd < p.min).map((p) => ({ cor: 'warn' as const, icone: 'estoque', id: '', t: <>Estoque baixo: <b>{p.desc}</b> ({p.qtd}/{p.min} un.)</> })),
    ...dados.veiculos.filter((v) => v.intRev && v.km - v.ultRevKm >= v.intRev * 0.9).map((v) => ({ cor: 'info' as const, icone: 'calendario', id: '', t: <>Preventiva {v.km - v.ultRevKm >= v.intRev ? <b>vencida</b> : 'próxima'}: <Placa placa={v.placa} /> — {num(v.km - v.ultRevKm)} km desde a última</> })),
  ];

  return (
    <>
      <Cabecalho titulo="Painel da oficina" sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}>
        <a className="btn pri" href="#entrada"><Icone nome="mais" tam={16} />Nova entrada</a>
      </Cabecalho>
      <div className="grid g4">
        <Kpi titulo="Veículos no pátio" valor={ab.length} rodape={`hoje: ${entradasHoje} entrada(s) · ${saidasHoje} saída(s)`} icone="entrada" cor="var(--info)" />
        <Kpi titulo="Aguardando aprovação" valor={aprov.length} rodape={`${brl(aprov.reduce((a, o) => a + totalOS(o, dados.funcionarios), 0))} em orçamentos`} icone="dinheiro" cor="var(--vio)" />
        <Kpi titulo="Aguardando peças" valor={ab.filter((o) => o.status === 'Aguardando peças').length} rodape="veículos parados por peça" icone="pecas" cor="var(--warn)" />
        <Kpi titulo="Prontos p/ retirada" valor={prontos.length} rodape="avisar o cliente" icone="check" cor="var(--ok)" />
      </div>
      <div className="grid g21 mt">
        <Card titulo="Fluxo das OS abertas" acoes={<a href="#os" className="btn sm ghost">Ver quadro</a>}>
          <Barras itens={STATUS.slice(0, 7).map((s) => ({ rotulo: s, valor: ab.filter((o) => o.status === s).length, cor: COR_STATUS[s] }))} />
          <hr className="s" />
          <div className="row"><span className="muted">Faturamento previsto (OS abertas)</span><span className="sp" /><b style={{ fontSize: 18 }}>{brl(ab.reduce((a, o) => a + totalOS(o, dados.funcionarios), 0))}</b></div>
        </Card>
        <Card titulo="Equipe agora" acoes={<button type="button" className="btn sm ghost" onClick={() => setNovoFunc({ nome: '', cargo: '', valorHora: '150' })}><Icone nome="mais" tam={14} />Funcionário</button>}>
          {!dados.funcionarios.length && <Vazio>Nenhum funcionário cadastrado</Vazio>}
          {dados.funcionarios.map((m) => {
            const tarefas = ab.flatMap((o) => o.servicos.filter((s) => s.mecId === m.id && !s.feito).map((s) => ({ o, s })));
            return (
              <div className="row linha" key={m.id}>
                <span className="dot" style={{ background: tarefas.length ? 'var(--ac)' : 'var(--ok)' }} />
                <div style={{ minWidth: 0, flex: 1 }}><b>{m.nome}</b><div className="muted corta" style={{ fontSize: 12 }}>{tarefas.length ? `OS #${tarefas[0].o.num} · ${tarefas[0].s.desc}` : 'Disponível'}</div></div>
                <span className="tag">{tarefas.reduce((a, x) => a + (x.s.horas || 0), 0)}h</span>
              </div>
            );
          })}
        </Card>
      </div>
      <div className="grid g2 mt">
        <Card titulo={<>Alertas e pendências <span className="tag">{alertas.length}</span></>}>
          {alertas.length ? alertas.map((a, i) => <Alerta key={i} icone={a.icone} cor={a.cor} onClick={a.id ? () => abrir(a.id) : undefined}>{a.t}</Alerta>) : <Vazio>Nenhuma pendência 🎉</Vazio>}
        </Card>
        <Card titulo="Últimas entradas">
          <div className="tbl"><table>
            <thead><tr><th>OS</th><th>Veículo</th><th>Etapa</th><th>No pátio</th></tr></thead>
            <tbody>{[...ab].sort((a, b) => b.abertura.localeCompare(a.abertura)).slice(0, 6).map((o) => (
              <tr key={o.id} className="click" onClick={() => abrir(o.id)}>
                <td className="mono">#{o.num}</td><td><Placa placa={q.veiculo(o.veiculoId)?.placa} /><div className="muted" style={{ fontSize: 12 }}>{q.veiculo(o.veiculoId)?.modelo}</div></td>
                <td><TagStatus status={o.status} /></td><td className="mono">{duracao(horasDesde(o.abertura))}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
      </div>
      <Dialogo titulo="Novo funcionário" aberto={!!novoFunc} onFechar={() => setNovoFunc(null)}
        onSalvar={async () => { if (!novoFunc?.nome.trim() || !novoFunc.cargo.trim()) return; await executar((r) => r.cadastrarFuncionario({ nome: novoFunc.nome, cargo: novoFunc.cargo, valorHora: Number(novoFunc.valorHora) || 150 }), 'Funcionário cadastrado'); setNovoFunc(null); }}>
        {novoFunc && <div className="fg">
          <Campo rotulo="Nome *" required valor={novoFunc.nome} onChange={(v) => setNovoFunc({ ...novoFunc, nome: v })} />
          <Campo rotulo="Cargo / especialidade *" required valor={novoFunc.cargo} placeholder="Mecânico diesel, eletricista…" onChange={(v) => setNovoFunc({ ...novoFunc, cargo: v })} />
          <Campo rotulo="Valor da hora (R$)" type="number" valor={novoFunc.valorHora} onChange={(v) => setNovoFunc({ ...novoFunc, valorHora: v })} />
        </div>}
      </Dialogo>
    </>
  );
}

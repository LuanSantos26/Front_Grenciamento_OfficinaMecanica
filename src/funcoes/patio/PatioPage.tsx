import { COR_STATUS } from '../../constants/dominio';
import { duracao, horasDesde } from '../../utils/formato';
import { abertas } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Cabecalho, Card, Vazio } from '../../componentes/ui/Basicos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagPrioridade, TagStatus } from '../../componentes/ui/Tags';
import { BarraProgressoOS } from '../progresso/ProgressoOS';

export function PatioPage() {
  const { dados, executar } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  const ab = abertas(dados);
  const fora = ab.filter((o) => !o.box || o.box === 'Pátio');
  const livres = dados.boxes.filter((b) => !ab.some((o) => o.box === b));
  return (
    <>
      <Cabecalho titulo="Pátio e boxes" sub={`${dados.boxes.length - livres.length} de ${dados.boxes.length} boxes ocupados`} />
      <div className="grid g4">
        {dados.boxes.map((b) => {
          const o = ab.find((x) => x.box === b);
          if (!o) return <div key={b} className="box free"><b>{b}</b><span>Livre</span></div>;
          const v = q.veiculo(o.veiculoId);
          const s = o.servicos.find((x) => !x.feito);
          return (
            <div key={b} className="box click" style={{ borderTop: `3px solid ${COR_STATUS[o.status]}` }} onClick={() => abrir(o.id, 'progresso')}>
              <div className="row"><b>{b}</b><span className="sp" /><span className="mono muted" style={{ fontSize: 12 }}>#{o.num}</span></div>
              <div><Placa placa={v?.placa} /></div>
              <b>{v?.marca} {v?.modelo}</b>
              <TagStatus status={o.status} />
              <BarraProgressoOS os={o} />
              {s && <div className="muted" style={{ fontSize: 12 }}><Icone nome="usuario" tam={12} /> {q.funcionario(s.mecId)?.nome} · {s.desc}</div>}
              <div className="muted" style={{ fontSize: 12, marginTop: 'auto' }}><Icone nome="relogio" tam={12} /> {duracao(horasDesde(o.abertura))} na oficina</div>
            </div>
          );
        })}
      </div>
      <Card className="mt" titulo={<>Pátio externo / fila <span className="tag">{fora.length}</span></>}>
        {fora.length ? (
          <div className="tbl"><table>
            <thead><tr><th>OS</th><th>Veículo</th><th>Etapa</th><th>Prioridade</th><th>Aguardando</th><th>Mover para</th></tr></thead>
            <tbody>{fora.map((o) => (
              <tr key={o.id}>
                <td className="mono">#{o.num}</td><td><Placa placa={q.veiculo(o.veiculoId)?.placa} /> {q.veiculo(o.veiculoId)?.modelo}</td>
                <td><TagStatus status={o.status} /></td><td><TagPrioridade p={o.prioridade} /></td><td className="mono">{duracao(horasDesde(o.abertura))}</td>
                <td><select className="in auto" value="" onChange={(e) => e.target.value && executar((r) => r.atualizarOS(o.id, { box: e.target.value }, `Movido para ${e.target.value}`), `OS #${o.num} → ${e.target.value}`)}>
                  <option value="">—</option>{livres.map((b) => <option key={b}>{b}</option>)}
                </select></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Vazio>Nenhum veículo aguardando no pátio</Vazio>}
      </Card>
    </>
  );
}

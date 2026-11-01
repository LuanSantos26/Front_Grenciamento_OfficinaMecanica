import type { OrdemServico } from '../../types';
import { brl, dataHora } from '../../utils/formato';
import { totalOS } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Placa, TagPrioridade, TagStatus } from '../../componentes/ui/Tags';
import { BarraProgressoOS } from '../progresso/ProgressoOS';

export function ListaOS({ ordens }: { ordens: OrdemServico[] }) {
  const { dados } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  return (
    <div className="card tbl">
      <table>
        <thead><tr><th>OS</th><th>Veículo</th><th>Cliente</th><th>Tipo</th><th>Etapa</th><th style={{ width: 140 }}>Progresso</th><th>Prioridade</th><th>Entrada</th><th>Saída</th><th className="dir">Total</th></tr></thead>
        <tbody>
          {[...ordens].sort((a, b) => b.num - a.num).map((o) => (
            <tr key={o.id} className="click" onClick={() => abrir(o.id)}>
              <td className="mono">#{o.num}</td>
              <td><Placa placa={q.veiculo(o.veiculoId)?.placa} /></td>
              <td>{q.cliente(o.clienteId)?.nome}</td>
              <td>{o.tipo}</td>
              <td><TagStatus status={o.status} /></td>
              <td><BarraProgressoOS os={o} /></td>
              <td><TagPrioridade p={o.prioridade} /></td>
              <td>{dataHora(o.abertura)}</td>
              <td>{dataHora(o.saida?.data)}</td>
              <td className="dir mono">{brl(totalOS(o, dados.funcionarios))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

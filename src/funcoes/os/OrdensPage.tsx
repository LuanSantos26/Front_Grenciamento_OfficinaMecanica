import { useMemo, useState } from 'react';
import { TIPOS_OS } from '../../constants/dominio';
import { useOficina } from '../../contexto/OficinaContext';
import { useConsultas } from '../../hooks/useConsultas';
import { abertas } from '../../utils/calculos';
import { Cabecalho } from '../../componentes/ui/Basicos';
import { Icone } from '../../componentes/ui/Icone';
import { Segmentado, Selecao } from '../../componentes/ui/Campos';
import { KanbanOS } from './KanbanOS';
import { ListaOS } from './ListaOS';

export function OrdensPage() {
  const { dados } = useOficina();
  const q = useConsultas();
  const [vista, setVista] = useState<'Quadro' | 'Lista'>('Quadro');
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('');

  const filtradas = useMemo(() => {
    const t = busca.toLowerCase();
    return dados.ordens.filter((o) => {
      const v = q.veiculo(o.veiculoId);
      const texto = [o.num, v?.placa, v?.frota, v?.modelo, q.cliente(o.clienteId)?.nome, ...o.reclamacoes.map((r) => r.texto)].join(' ').toLowerCase();
      return (!t || texto.includes(t)) && (!tipo || o.tipo === tipo);
    });
  }, [dados, busca, tipo, q]);

  return (
    <>
      <Cabecalho titulo="Ordens de serviço" sub={`${abertas(dados).length} abertas · arraste os cartões entre as colunas`}>
        <div className="search"><Icone nome="busca" tam={15} /><input className="in" placeholder="Placa, frota, OS, cliente…" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <Selecao valor={tipo} opcoes={[['', 'Todos os tipos'], ...TIPOS_OS.map((t) => [t, t] as [string, string])]} onChange={setTipo} />
        <Segmentado valor={vista} opcoes={['Quadro', 'Lista'] as const} onChange={setVista} />
        <a className="btn pri" href="#entrada"><Icone nome="mais" tam={16} />Nova entrada</a>
      </Cabecalho>
      {vista === 'Quadro' ? <KanbanOS ordens={filtradas} /> : <ListaOS ordens={filtradas} />}
    </>
  );
}

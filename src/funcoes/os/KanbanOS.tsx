import { useState } from 'react';
import type { OrdemServico, StatusOS } from '../../types';
import { COR_STATUS, STATUS } from '../../constants/dominio';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useToast } from '../../contexto/ToastContext';
import { CartaoOS } from './CartaoOS';

/** Quadro com as 8 etapas. Arrastar o cartão muda a etapa; soltar em "Entregue" abre a saída do veículo. */
export function KanbanOS({ ordens }: { ordens: OrdemServico[] }) {
  const { executar } = useOficina();
  const { abrir, pedirSaida } = useDetalhe();
  const toast = useToast();
  const [sobre, setSobre] = useState<string | null>(null);

  function soltar(id: string, status: StatusOS) {
    setSobre(null);
    const os = ordens.find((o) => o.id === id);
    if (!os || os.status === status) return;
    if (os.status === 'Entregue') return toast('OS já entregue.', 'aviso');
    if (status === 'Entregue') return pedirSaida(id);
    if (['Em execução', 'Aguardando peças'].includes(status) && !os.aprovado && os.tipo !== 'Garantia / Retorno') toast('Atenção: orçamento ainda não aprovado pelo cliente.', 'aviso');
    executar((r) => r.mudarStatus(id, status));
  }

  return (
    <div className="kanban">
      {STATUS.map((s) => {
        const itens = ordens.filter((o) => o.status === s);
        const mostrar = s === 'Entregue' ? [...itens].sort((a, b) => (b.saida?.data || '').localeCompare(a.saida?.data || '')).slice(0, 5) : itens;
        return (
          <div key={s} className={`col${sobre === s ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setSobre(s); }} onDragLeave={() => setSobre(null)}
            onDrop={(e) => { e.preventDefault(); soltar(e.dataTransfer.getData('text/plain'), s); }}>
            <h4><span className="dot" style={{ background: COR_STATUS[s] }} />{s}<span className="c">{itens.length}</span></h4>
            {mostrar.map((o) => <CartaoOS key={o.id} os={o} onAbrir={() => abrir(o.id)} />)}
            {!itens.length && <div className="empty" style={{ padding: 14 }}>—</div>}
          </div>
        );
      })}
    </div>
  );
}

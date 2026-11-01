import type { OrdemServico } from '../../types';
import { duracao, horasDesde } from '../../utils/formato';
import { atrasada } from '../../utils/calculos';
import { useConsultas } from '../../hooks/useConsultas';
import { Placa, TagPrioridade } from '../../componentes/ui/Tags';
import { Icone } from '../../componentes/ui/Icone';
import { BarraProgressoOS } from '../progresso/ProgressoOS';

export function CartaoOS({ os, onAbrir }: { os: OrdemServico; onAbrir: () => void }) {
  const q = useConsultas();
  const v = q.veiculo(os.veiculoId);
  const nFotos = q.fotosDa(os.id).length;
  return (
    <div className={`oc p-${os.prioridade}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', os.id)} onClick={onAbrir}>
      <div className="row"><Placa placa={v?.placa} />{v?.frota && <span className="muted mono" style={{ fontSize: 11 }}>{v.frota}</span>}<span className="sp" /><span className="mono muted" style={{ fontSize: 11.5 }}>#{os.num}</span></div>
      <div className="t">{v?.marca} {v?.modelo}</div>
      <div className="d">{os.reclamacoes[0]?.texto}</div>
      <div className="m">
        {os.tipo !== 'Corretiva' && <span className={`tag ${/Garantia/.test(os.tipo) ? 'vio' : 'info'}`}>{os.tipo}</span>}
        {(os.prioridade === 'Crítica' || os.prioridade === 'Alta') && <TagPrioridade p={os.prioridade} />}
        {os.box && os.box !== 'Pátio' && <span className="tag">{os.box}</span>}
        {nFotos > 0 && <span className="tag"><Icone nome="fotos" tam={11} /> {nFotos}</span>}
        <span className="sp" />
        <span style={atrasada(os) ? { color: 'var(--bad)', fontWeight: 700 } : undefined}><Icone nome="relogio" tam={12} /> {duracao(horasDesde(os.abertura, os.saida?.data))}</span>
      </div>
      <div style={{ marginTop: 8 }}><BarraProgressoOS os={os} /></div>
    </div>
  );
}

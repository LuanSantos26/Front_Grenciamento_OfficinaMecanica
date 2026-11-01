import type { OrdemServico } from '../../../types';
import { useOficina } from '../../../contexto/OficinaContext';
import { useConsultas } from '../../../hooks/useConsultas';
import { Card } from '../../../componentes/ui/Basicos';
import { UploadFotos } from '../../fotos/UploadFotos';
import { GaleriaFotos } from '../../fotos/GaleriaFotos';

/** Fotos do veículo, do problema, do serviço, das peças trocadas e da saída */
export function AbaFotos({ os }: { os: OrdemServico }) {
  const { executar } = useOficina();
  const q = useConsultas();
  return (
    <>
      <Card titulo="Adicionar fotos" className="mb">
        <UploadFotos categoriaInicial={os.status === 'Em execução' ? 'SERVICO' : 'PROBLEMA'}
          onAdicionar={(fotos) => executar((r) => r.adicionarFotos(os.id, fotos), `${fotos.length} foto(s) adicionada(s)`).then(() => undefined)} />
      </Card>
      <Card titulo="Galeria">
        <GaleriaFotos fotos={q.fotosDa(os.id)} onRemover={(id) => executar((r) => r.removerFoto(id), 'Foto excluída')} />
      </Card>
    </>
  );
}

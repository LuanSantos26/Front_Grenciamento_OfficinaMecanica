import { useMemo } from 'react';
import { useOficina } from '../contexto/OficinaContext';

/** Atalhos de busca por id usados em todas as telas */
export function useConsultas() {
  const { dados } = useOficina();
  return useMemo(() => {
    const porId = <T extends { id: string }>(l: T[]) => new Map(l.map((x) => [x.id, x]));
    const vs = porId(dados.veiculos), cs = porId(dados.clientes), fs = porId(dados.funcionarios), es = porId(dados.estoque), os = porId(dados.ordens);
    return {
      veiculo: (id: string) => vs.get(id),
      cliente: (id: string) => cs.get(id),
      funcionario: (id?: string) => (id ? fs.get(id) : undefined),
      peca: (id?: string | null) => (id ? es.get(id) : undefined),
      ordem: (id: string) => os.get(id),
      fotosDa: (osId: string) => dados.fotos.filter((f) => f.osId === osId),
    };
  }, [dados]);
}

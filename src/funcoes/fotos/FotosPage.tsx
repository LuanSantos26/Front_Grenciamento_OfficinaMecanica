import { useMemo, useState } from 'react';
import type { CategoriaFoto } from '../../types';
import { CATEGORIAS_FOTO } from '../../constants/dominio';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Cabecalho, Card, Vazio } from '../../componentes/ui/Basicos';
import { Selecao } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagStatus } from '../../componentes/ui/Tags';
import { GaleriaFotos } from './GaleriaFotos';
import { UploadFotos } from './UploadFotos';

/** Todas as fotos da oficina, por OS, com envio rápido para qualquer OS aberta */
export function FotosPage() {
  const { dados, executar } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  const [cat, setCat] = useState<'' | CategoriaFoto>('');
  const [busca, setBusca] = useState('');
  const abertasLista = dados.ordens.filter((o) => o.status !== 'Entregue');
  const [destino, setDestino] = useState(abertasLista[0]?.id || '');

  const grupos = useMemo(() => {
    const t = busca.toLowerCase();
    return dados.ordens
      .map((o) => ({ os: o, fotos: dados.fotos.filter((f) => f.osId === o.id && (!cat || f.categoria === cat)) }))
      .filter((g) => g.fotos.length && (!t || `${q.veiculo(g.os.veiculoId)?.placa} ${g.os.num}`.toLowerCase().includes(t)))
      .sort((a, b) => b.os.abertura.localeCompare(a.os.abertura));
  }, [dados, cat, busca, q]);

  return (
    <>
      <Cabecalho titulo="Fotos" sub={`${dados.fotos.length} fotos de veículos, defeitos, serviços e peças`}>
        <div className="search"><Icone nome="busca" tam={15} /><input className="in" placeholder="Placa ou nº da OS" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <Selecao valor={cat} opcoes={[['', 'Todas as categorias'], ...CATEGORIAS_FOTO.map((c) => [c.id, c.nome] as [string, string])]} onChange={(v) => setCat(v as '' | CategoriaFoto)} />
      </Cabecalho>
      <Card className="mb" titulo="Enviar fotos para uma OS">
        {abertasLista.length ? <>
          <Selecao rotulo="Ordem de serviço" valor={destino} onChange={setDestino}
            opcoes={abertasLista.map((o) => [o.id, `#${o.num} — ${q.veiculo(o.veiculoId)?.placa} ${q.veiculo(o.veiculoId)?.modelo} (${o.status})`] as [string, string])} />
          <div className="mt"><UploadFotos onAdicionar={(f) => executar((r) => r.adicionarFotos(destino, f), `${f.length} foto(s) adicionada(s)`).then(() => undefined)} /></div>
        </> : <Vazio>Nenhuma OS aberta.</Vazio>}
      </Card>
      {grupos.length ? grupos.map((g) => (
        <Card key={g.os.id} className="mb" titulo={<><Placa placa={q.veiculo(g.os.veiculoId)?.placa} /> OS #{g.os.num} <TagStatus status={g.os.status} /></>}
          acoes={<button type="button" className="btn sm ghost" onClick={() => abrir(g.os.id, 'fotos')}>Abrir OS</button>}>
          <GaleriaFotos fotos={g.fotos} onRemover={(id) => executar((r) => r.removerFoto(id), 'Foto excluída')} />
        </Card>
      )) : <Card><Vazio>Nenhuma foto encontrada. Use o envio acima ou a aba “Fotos” dentro da OS.</Vazio></Card>}
    </>
  );
}

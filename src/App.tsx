import type { ComponentType } from 'react';
import { useEffect } from 'react';
import { useRota } from './hooks/useRota';
import { Sidebar } from './componentes/layout/Sidebar';
import { BannerConexao } from './componentes/layout/BannerConexao';
import { DetalheOS } from './funcoes/os/DetalheOS';
import { DialogoSaida } from './funcoes/movimentacao/DialogoSaida';
import { PainelPage } from './funcoes/painel/PainelPage';
import { EntradaPage } from './funcoes/entrada/EntradaPage';
import { OrdensPage } from './funcoes/os/OrdensPage';
import { MovimentacaoPage } from './funcoes/movimentacao/MovimentacaoPage';
import { FotosPage } from './funcoes/fotos/FotosPage';
import { DefeitosPage } from './funcoes/defeitos/DefeitosPage';
import { PatioPage } from './funcoes/patio/PatioPage';
import { PecasUsadasPage } from './funcoes/pecas/PecasUsadasPage';
import { EstoquePage } from './funcoes/estoque/EstoquePage';
import { FrotasPage } from './funcoes/frotas/FrotasPage';
import { RelatoriosPage } from './funcoes/relatorios/RelatoriosPage';

const PAGINAS: Record<string, ComponentType> = {
  painel: PainelPage,
  entrada: EntradaPage,
  os: OrdensPage,
  movimentacao: MovimentacaoPage,
  fotos: FotosPage,
  defeitos: DefeitosPage,
  patio: PatioPage,
  'pecas-usadas': PecasUsadasPage,
  estoque: EstoquePage,
  frotas: FrotasPage,
  relatorios: RelatoriosPage,
};

export function App() {
  const rota = useRota();
  const Pagina = PAGINAS[rota] || PainelPage;
  useEffect(() => { window.scrollTo(0, 0); }, [rota]);
  return (
    <div className="app">
      <Sidebar rota={rota} />
      <main>
        <BannerConexao />
        <Pagina />
      </main>
      <DetalheOS />
      <DialogoSaida />
    </div>
  );
}

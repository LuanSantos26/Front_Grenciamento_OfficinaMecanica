import { useOficina } from '../../contexto/OficinaContext';
import { Alerta } from '../ui/Basicos';

export function BannerConexao() {
  const { modo, erroConexao, apiUrl, recarregar, trocarModo } = useOficina();
  if (modo !== 'api' || !erroConexao) return null;
  return (
    <div className="mb">
      <Alerta icone="defeitos" cor="bad">
        <b>Não foi possível conectar à API.</b> {erroConexao}
        <div className="muted" style={{ marginTop: 4 }}>Confira se o Spring Boot está rodando em {apiUrl} e se o CORS está liberado. Enquanto isso, os dados de exemplo aparecem abaixo.</div>
        <div className="row" style={{ marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={recarregar}>Tentar de novo</button>
          <button type="button" className="btn sm ghost" onClick={() => trocarModo('demo')}>Usar demonstração</button>
        </div>
      </Alerta>
    </div>
  );
}

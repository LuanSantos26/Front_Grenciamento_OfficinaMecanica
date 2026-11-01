import { useState } from 'react';
import { abertas } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { RepositorioDemo } from '../../repositorio/RepositorioDemo';
import { Icone } from '../ui/Icone';
import { Dialogo } from '../ui/Modal';
import { Campo } from '../ui/Campos';

export const MENU: { rota: string; nome: string; icone: string; grupo?: string }[] = [
  { rota: 'painel', nome: 'Painel', icone: 'painel' },
  { rota: 'entrada', nome: 'Entrada de veículo', icone: 'entrada', grupo: 'Operação' },
  { rota: 'os', nome: 'Ordens de serviço', icone: 'os' },
  { rota: 'movimentacao', nome: 'Entrada e saída', icone: 'movimentacao' },
  { rota: 'fotos', nome: 'Fotos', icone: 'fotos' },
  { rota: 'defeitos', nome: 'Defeitos e reclamações', icone: 'defeitos' },
  { rota: 'patio', nome: 'Pátio e boxes', icone: 'patio' },
  { rota: 'pecas-usadas', nome: 'Peças utilizadas', icone: 'pecas', grupo: 'Gestão' },
  { rota: 'estoque', nome: 'Estoque de peças', icone: 'estoque' },
  { rota: 'frotas', nome: 'Clientes e frotas', icone: 'frotas' },
  { rota: 'relatorios', nome: 'Relatórios', icone: 'relatorios' },
];

export function Sidebar({ rota }: { rota: string }) {
  const { dados, modo, apiUrl, trocarModo, erroConexao, recursos, recarregar, executar, repo } = useOficina();
  const [dlgApi, setDlgApi] = useState(false);
  const [url, setUrl] = useState(apiUrl);
  const contagem: Record<string, number> = {
    os: abertas(dados).length,
    defeitos: dados.ordens.flatMap((o) => o.reclamacoes).filter((r) => r.status === 'Aberta').length,
    estoque: dados.estoque.filter((p) => p.qtd < p.min).length,
    movimentacao: abertas(dados).filter((o) => o.status === 'Pronto p/ retirada').length,
  };
  const faltando = recursos ? Object.entries(recursos).filter(([, ok]) => !ok).map(([k]) => k) : [];

  return (
    <aside className="side">
      <div className="brand">
        <div className="logo"><Icone nome="chave" tam={22} /></div>
        <div><b>Oficina Pro</b><small>Linha pesada · Diesel</small></div>
      </div>
      <nav className="nav">
        {MENU.map((m) => (
          <div key={m.rota}>
            {m.grupo && <div className="sep">{m.grupo}</div>}
            <a href={`#${m.rota}`} className={rota === m.rota ? 'on' : ''}>
              <Icone nome={m.icone} /><span className="l">{m.nome}</span>
              {contagem[m.rota] ? <span className="cnt">{contagem[m.rota]}</span> : null}
            </a>
          </div>
        ))}
      </nav>
      <div className="foot">
        <div style={{ marginBottom: 6 }}>Fonte de dados</div>
        <div className="seg" style={{ width: '100%' }}>
          <button type="button" style={{ flex: 1 }} className={modo === 'demo' ? 'on' : ''} onClick={() => trocarModo('demo')}>Demonstração</button>
          <button type="button" style={{ flex: 1 }} className={modo === 'api' ? 'on' : ''} onClick={() => { setUrl(apiUrl); setDlgApi(true); }}>API Spring</button>
        </div>
        <div style={{ marginTop: 8 }}>
          {modo === 'api'
            ? erroConexao
              ? <><span className="dot" style={{ background: 'var(--bad)' }} /> Sem conexão · <a href="#" onClick={(e) => { e.preventDefault(); recarregar(); }}>tentar de novo</a></>
              : <><span className="dot" style={{ background: 'var(--ok)' }} /> {apiUrl} · <a href="#" onClick={(e) => { e.preventDefault(); recarregar(); }}>atualizar</a>
                {faltando.length > 0 && <div style={{ color: 'var(--warn)' }}>Back-end sem: {faltando.join(', ')}</div>}</>
            : <>Dados salvos neste navegador.<br /><a href="#" onClick={(e) => { e.preventDefault(); if (repo instanceof RepositorioDemo) executar(() => repo.restaurarExemplo(), 'Dados de exemplo restaurados'); }}>Restaurar dados de exemplo</a></>}
        </div>
      </div>
      <Dialogo titulo="Conectar à API do Gerenciador_Oficina" aberto={dlgApi} onFechar={() => setDlgApi(false)} rotuloSalvar="Conectar"
        onSalvar={() => { setDlgApi(false); trocarModo('api', url.trim()); }}>
        <p className="muted" style={{ marginTop: 0 }}>Endereço do back-end Spring Boot. Ele precisa estar rodando, com a classe <span className="mono">CorsConfig</span>.</p>
        <Campo rotulo="URL da API" required valor={url} onChange={setUrl} />
      </Dialogo>
    </aside>
  );
}

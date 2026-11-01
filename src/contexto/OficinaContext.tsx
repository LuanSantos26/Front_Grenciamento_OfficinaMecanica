import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Dados, RecursosApi } from '../types';
import { RepositorioDemo } from '../repositorio/RepositorioDemo';
import { RepositorioApi } from '../repositorio/RepositorioApi';
import type { RepositorioLocal } from '../repositorio/RepositorioLocal';
import { lsTexto, lsTextoGravar } from '../services/armazenamento';
import { useToast } from './ToastContext';

export type Modo = 'demo' | 'api';

interface OficinaCtx {
  dados: Dados;
  repo: RepositorioLocal;
  modo: Modo;
  apiUrl: string;
  recursos: RecursosApi | null;
  carregando: boolean;
  erroConexao: string | null;
  /** Executa uma ação do repositório, atualiza a tela e mostra o resultado em um aviso */
  executar: <T>(acao: (repo: RepositorioLocal) => Promise<T>, sucesso?: string) => Promise<T | undefined>;
  trocarModo: (modo: Modo, url?: string) => void;
  recarregar: () => Promise<void>;
}

const Ctx = createContext<OficinaCtx | null>(null);
const URL_PADRAO = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

export function OficinaProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [modo, setModo] = useState<Modo>(() => (lsTexto('oficina-modo', 'demo') as Modo));
  const [apiUrl, setApiUrl] = useState(() => lsTexto('oficina-api', URL_PADRAO));
  const repoRef = useRef<RepositorioLocal>(new RepositorioDemo());
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroConexao, setErro] = useState<string | null>(null);
  const [, setVersao] = useState(0);

  const atualizarTela = useCallback(() => {
    setDados({ ...repoRef.current.dados });
    setVersao((v) => v + 1);
  }, []);

  const iniciar = useCallback(async (m: Modo, url: string) => {
    setCarregando(true);
    setErro(null);
    const repo = m === 'api' ? new RepositorioApi(url) : new RepositorioDemo();
    try {
      await repo.carregar();
      repoRef.current = repo;
    } catch (e) {
      // sem conexão: mostra os dados de exemplo (somente leitura) e o aviso
      setErro((e as Error).message);
      const demo = new RepositorioDemo();
      await demo.carregar();
      repoRef.current = demo;
    }
    atualizarTela();
    setCarregando(false);
  }, [atualizarTela]);

  useEffect(() => { iniciar(modo, apiUrl); }, [modo, apiUrl, iniciar]);

  const executar = useCallback(async <T,>(acao: (r: RepositorioLocal) => Promise<T>, sucesso?: string) => {
    try {
      const r = await acao(repoRef.current);
      if (sucesso) toast(sucesso, 'ok');
      return r;
    } catch (e) {
      toast((e as Error).message, 'erro');
      return undefined;
    } finally {
      atualizarTela();
    }
  }, [toast, atualizarTela]);

  const trocarModo = useCallback((m: Modo, url?: string) => {
    if (url) { setApiUrl(url); lsTextoGravar('oficina-api', url); }
    lsTextoGravar('oficina-modo', m);
    setModo(m);
  }, []);

  if (!dados) return <div className="tela-cheia">Carregando a oficina…</div>;

  const repo = repoRef.current;
  return (
    <Ctx.Provider value={{
      dados, repo, modo, apiUrl, carregando, erroConexao, executar, trocarModo,
      recursos: repo instanceof RepositorioApi ? repo.recursos : null,
      recarregar: () => iniciar(modo, apiUrl),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useOficina() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOficina fora do OficinaProvider');
  return c;
}

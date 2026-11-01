import { createContext, useContext, useState, type ReactNode } from 'react';

export type AbaOS = 'resumo' | 'progresso' | 'reclamacoes' | 'servicos' | 'fotos' | 'entrada' | 'historico';
interface DetalheCtx {
  osId: string | null; aba: AbaOS; abrir: (id: string, aba?: AbaOS) => void; fechar: () => void; setAba: (a: AbaOS) => void;
  /** OS cuja saída (entrega do veículo) está sendo registrada */
  saidaOsId: string | null; pedirSaida: (id: string) => void; fecharSaida: () => void;
}
const Ctx = createContext<DetalheCtx>({ osId: null, aba: 'resumo', abrir: () => {}, fechar: () => {}, setAba: () => {}, saidaOsId: null, pedirSaida: () => {}, fecharSaida: () => {} });

/** Controla a gaveta de detalhes da OS, que pode ser aberta de qualquer tela */
export function DetalheProvider({ children }: { children: ReactNode }) {
  const [osId, setOs] = useState<string | null>(null);
  const [aba, setAba] = useState<AbaOS>('resumo');
  const [saidaOsId, setSaida] = useState<string | null>(null);
  return (
    <Ctx.Provider value={{
      osId, aba, setAba, abrir: (id, a = 'resumo') => { setOs(id); setAba(a); }, fechar: () => setOs(null),
      saidaOsId, pedirSaida: setSaida, fecharSaida: () => setSaida(null),
    }}>
      {children}
    </Ctx.Provider>
  );
}
export const useDetalhe = () => useContext(Ctx);

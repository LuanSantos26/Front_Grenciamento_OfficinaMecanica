import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tipo = 'ok' | 'erro' | 'aviso' | 'info';
interface Toast { id: number; texto: string; tipo: Tipo }
const Ctx = createContext<(texto: string, tipo?: Tipo) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Toast[]>([]);
  const mostrar = useCallback((texto: string, tipo: Tipo = 'ok') => {
    const id = Date.now() + Math.random();
    setLista((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), tipo === 'erro' ? 5500 : 3200);
  }, []);
  return (
    <Ctx.Provider value={mostrar}>
      {children}
      <div className="toasts">
        {lista.map((t) => <div key={t.id} className={`toast toast-${t.tipo}`}>{t.texto}</div>)}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

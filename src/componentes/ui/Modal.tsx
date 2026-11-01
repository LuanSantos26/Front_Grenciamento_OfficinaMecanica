import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Icone } from './Icone';

/** Janela central para formulários curtos */
export function Dialogo({ titulo, aberto, onFechar, onSalvar, rotuloSalvar = 'Salvar', children, largura = 520 }: {
  titulo: ReactNode; aberto: boolean; onFechar: () => void; onSalvar?: () => void | Promise<void>; rotuloSalvar?: string; children: ReactNode; largura?: number;
}) {
  useEsc(aberto, onFechar);
  if (!aberto) return null;
  const enviar = async (e: FormEvent) => { e.preventDefault(); await onSalvar?.(); };
  return (
    <div className="ov center" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="dlg" style={{ width: `min(${largura}px, 94vw)` }} onSubmit={enviar}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{titulo}</h3><span className="sp" />
          <button type="button" className="btn sm ghost" onClick={onFechar} aria-label="Fechar"><Icone nome="x" tam={14} /></button>
        </div>
        {children}
        {onSalvar && (
          <div className="wfoot">
            <button type="button" className="btn ghost" onClick={onFechar}>Cancelar</button>
            <button className="btn pri">{rotuloSalvar}</button>
          </div>
        )}
      </form>
    </div>
  );
}

/** Painel lateral (detalhe da OS) */
export function Gaveta({ aberto, onFechar, children }: { aberto: boolean; onFechar: () => void; children: ReactNode }) {
  useEsc(aberto, onFechar);
  if (!aberto) return null;
  return (
    <div className="ov" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="drawer">{children}</div>
    </div>
  );
}

// Pilha de janelas abertas: o Esc fecha só a que está por cima
const pilha: { current: () => void }[] = [];
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pilha.length) pilha[pilha.length - 1].current(); });
}

export function useEsc(ativo: boolean, fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!ativo) return;
    pilha.push(ref);
    return () => { const i = pilha.indexOf(ref); if (i >= 0) pilha.splice(i, 1); };
  }, [ativo]);
}

import type { InputHTMLAttributes, ReactNode } from 'react';

type Opcao = string | [string, string];
const par = (o: Opcao) => (Array.isArray(o) ? o : [o, o]);

export function Campo({ rotulo, valor, onChange, className = '', ...resto }: { rotulo: ReactNode; valor: string | number; onChange: (v: string) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <label className={`f ${className}`}>{rotulo}
      <input className="in" value={valor ?? ''} onChange={(e) => onChange(e.target.value)} {...resto} />
    </label>
  );
}

export function Selecao({ rotulo, valor, opcoes, onChange, className = '', required }: { rotulo?: ReactNode; valor: string; opcoes: Opcao[]; onChange: (v: string) => void; className?: string; required?: boolean }) {
  const sel = (
    <select className="in" value={valor} required={required} onChange={(e) => onChange(e.target.value)}>
      {opcoes.map((o) => { const [v, t] = par(o); return <option key={v} value={v}>{t}</option>; })}
    </select>
  );
  return rotulo ? <label className={`f ${className}`}>{rotulo}{sel}</label> : sel;
}

export function AreaTexto({ rotulo, valor, onChange, className = '', placeholder, required }: { rotulo: ReactNode; valor: string; onChange: (v: string) => void; className?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className={`f ${className}`}>{rotulo}
      <textarea className="in" value={valor} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** Botões de escolha única (OK / Atenção / Avaria…) */
export function Segmentado<T extends string>({ valor, opcoes, onChange, render }: { valor: T | undefined; opcoes: readonly T[]; onChange: (v: T) => void; render?: (v: T) => ReactNode }) {
  return (
    <div className="seg">
      {opcoes.map((o) => (
        <button type="button" key={o} data-v={o} className={valor === o ? 'on' : ''} onClick={() => onChange(o)}>{render ? render(o) : o}</button>
      ))}
    </div>
  );
}

export const Abas = <T extends string>({ abas, ativa, onChange }: { abas: [T, ReactNode][]; ativa: T; onChange: (a: T) => void }) => (
  <div className="tabs">
    {abas.map(([k, l]) => <button type="button" key={k} className={ativa === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>)}
  </div>
);

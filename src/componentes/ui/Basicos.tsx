import type { ReactNode } from 'react';
import { Icone } from './Icone';

export function Kpi({ titulo, valor, rodape, icone, cor }: { titulo: string; valor: ReactNode; rodape?: ReactNode; icone: string; cor: string }) {
  return (
    <div className="card kpi">
      <div className="kpi-ic" style={{ background: `color-mix(in srgb, ${cor} 15%, transparent)`, color: cor }}><Icone nome={icone} /></div>
      <div className="kpi-lb">{titulo}</div>
      <div className="kpi-vl">{valor}</div>
      {rodape && <div className="kpi-ft">{rodape}</div>}
    </div>
  );
}

export function Cabecalho({ titulo, sub, children }: { titulo: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="top">
      <div><h1>{titulo}</h1>{sub && <div className="sub">{sub}</div>}</div>
      <div className="sp" />
      {children}
    </div>
  );
}

export function Card({ titulo, acoes, children, className = '' }: { titulo?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`card ${className}`}>
      {titulo && <h3>{titulo}<span className="sp" />{acoes}</h3>}
      {children}
    </div>
  );
}

export const Vazio = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export const Progresso = ({ pct, cor }: { pct: number; cor?: string }) =>
  <div className="prog"><i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: cor }} /></div>;

export function Alerta({ icone, cor, children, onClick }: { icone: string; cor: 'ok' | 'warn' | 'bad' | 'info' | 'vio'; children: ReactNode; onClick?: () => void }) {
  return (
    <div className={`alert${onClick ? ' click' : ''}`} onClick={onClick}>
      <div className="alert-ic" style={{ background: `var(--${cor}bg)`, color: `var(--${cor})` }}><Icone nome={icone} tam={15} /></div>
      <div>{children}</div>
    </div>
  );
}

/** Gráfico de barras horizontais simples (sem biblioteca) */
export function Barras({ itens, formato = (v) => String(v), larguraRotulo = 160 }: { itens: { rotulo: ReactNode; valor: number; cor?: string }[]; formato?: (v: number) => string; larguraRotulo?: number }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="bars">
      {itens.map((i, k) => (
        <div className="bar-l" key={k} style={{ gridTemplateColumns: `${larguraRotulo}px 1fr auto` }}>
          <span className="tx2">{i.rotulo}</span>
          <div className="bar-tr"><div className="bar-fl" style={{ width: `${(i.valor / max) * 100}%`, background: i.cor }} /></div>
          <b className="mono">{formato(i.valor)}</b>
        </div>
      ))}
    </div>
  );
}

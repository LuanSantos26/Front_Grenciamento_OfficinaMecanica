import type { ReactNode } from 'react';
import type { Prioridade, StatusOS } from '../../types';
import { COR_STATUS } from '../../constants/dominio';

export const Placa = ({ placa, grande }: { placa?: string; grande?: boolean }) =>
  <span className={`placa${grande ? ' placa-g' : ''}`}>{placa || '—'}</span>;

export function TagStatus({ status }: { status: StatusOS }) {
  const c = COR_STATUS[status];
  return (
    <span className="tag" style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}>
      <span className="dot" style={{ background: c }} />{status}
    </span>
  );
}

export const TagPrioridade = ({ p }: { p: Prioridade }) =>
  <span className={`tag ${p === 'Crítica' ? 'bad' : p === 'Alta' ? 'warn' : p === 'Normal' ? 'info' : ''}`}>{p}</span>;

export const TagSeveridade = ({ s }: { s: string }) =>
  <span className={`tag ${/Crít/.test(s) ? 'bad' : s === 'Alta' ? 'warn' : s === 'Média' ? 'ac' : ''}`}>{s}</span>;

export const Tag = ({ children, cor = '' }: { children: ReactNode; cor?: string }) => <span className={`tag ${cor}`}>{children}</span>;

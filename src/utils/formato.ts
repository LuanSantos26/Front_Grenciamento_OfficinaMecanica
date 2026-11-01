export const brl = (v: number | string | undefined | null) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const num = (v: number | string | undefined | null) => (Number(v) || 0).toLocaleString('pt-BR');
export const uid = () => Math.random().toString(36).slice(2, 10);
export const agora = () => new Date().toISOString();
export const dataHora = (d?: string | null) =>
  d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
export const data = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
export const horasDesde = (d: string, ate?: string | null) =>
  Math.max(0, ((ate ? new Date(ate).getTime() : Date.now()) - new Date(d).getTime()) / 36e5);
export const duracao = (h: number) => (h < 24 ? `${Math.round(h)}h` : `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`);
export const diasAtras = (dias: number, h = 0) => new Date(Date.now() - dias * 864e5 - h * 36e5).toISOString();
export const diasAFrente = (dias: number, h = 0) => new Date(Date.now() + dias * 864e5 + h * 36e5).toISOString();
export const normPlaca = (p: string) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/** ISO -> valor para <input type="datetime-local"> */
export const paraInputLocal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
export const inicioDoDia = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

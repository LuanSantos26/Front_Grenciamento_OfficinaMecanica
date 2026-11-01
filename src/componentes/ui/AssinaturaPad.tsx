import { useEffect, useRef, type PointerEvent } from 'react';

/** Campo de assinatura com dedo ou mouse. Devolve PNG em dataURL. */
export function AssinaturaPad({ valor, onChange }: { valor: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);

  useEffect(() => {
    const cv = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    const r = cv.getBoundingClientRect();
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    const ctx = cv.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#14213d';
    if (valor) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height); im.src = valor; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: PointerEvent) => { const b = ref.current!.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const; };
  const ctx = () => ref.current!.getContext('2d')!;

  return (
    <div>
      <canvas ref={ref} className="sig"
        onPointerDown={(e) => { desenhando.current = true; ref.current!.setPointerCapture(e.pointerId); ctx().beginPath(); ctx().moveTo(...pos(e)); }}
        onPointerMove={(e) => { if (!desenhando.current) return; ctx().lineTo(...pos(e)); ctx().stroke(); }}
        onPointerUp={() => { desenhando.current = false; onChange(ref.current!.toDataURL()); }} />
      <div className="row" style={{ marginTop: 6 }}>
        <button type="button" className="btn sm ghost" onClick={() => { const c = ref.current!; ctx().clearRect(0, 0, c.width, c.height); onChange(null); }}>Limpar assinatura</button>
        <span className="sp" /><span className="muted" style={{ fontSize: 12 }}>{new Date().toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}

import type { MouseEvent } from 'react';
import type { MarcaAvaria } from '../../types';
import { COR_AVARIA } from '../../constants/dominio';

/** Vista superior de um cavalo mecânico. Clique para marcar avarias (quando onMarcar é informado). */
export function DiagramaCaminhao({ marcas, onMarcar }: { marcas: MarcaAvaria[]; onMarcar?: (x: number, y: number) => void }) {
  function clique(e: MouseEvent<SVGSVGElement>) {
    if (!onMarcar) return;
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    onMarcar(Math.round(p.x), Math.round(p.y));
  }
  const t = { fill: '#6f7c8b', fontSize: 11, fontFamily: 'Inter' };
  return (
    <svg viewBox="0 0 640 240" onClick={clique} style={{ cursor: onMarcar ? 'crosshair' : 'default', width: '100%', display: 'block' }}>
      <defs><pattern id="grade" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#232b35" /></pattern></defs>
      <rect width="640" height="240" fill="url(#grade)" />
      <text x="20" y="18" {...t}>◀ FRENTE</text><text x="560" y="18" {...t}>TRASEIRA ▶</text>
      <text x="300" y="234" {...t}>LADO DIREITO</text><text x="300" y="14" {...t}>LADO ESQUERDO</text>
      <g stroke="#56637a" strokeWidth="2" fill="#1e252e">
        <rect x="150" y="96" width="440" height="12" rx="2" /><rect x="150" y="132" width="440" height="12" rx="2" />
        <rect x="60" y="40" width="22" height="22" rx="4" /><rect x="60" y="178" width="22" height="22" rx="4" />
        <rect x="80" y="56" width="120" height="128" rx="18" fill="#26303b" />
        <rect x="84" y="66" width="16" height="108" rx="4" fill="#3a6f9a" opacity=".7" />
        <rect x="215" y="150" width="100" height="36" rx="10" fill="#2c3540" />
        <rect x="325" y="152" width="44" height="32" rx="5" fill="#2c3540" />
        <rect x="215" y="56" width="100" height="26" rx="10" fill="#2c3540" />
        <circle cx="480" cy="120" r="34" fill="#2c3540" /><circle cx="480" cy="120" r="8" />
      </g>
      <text x="235" y="173" fill="#8a96a6" fontSize="11">DIESEL</text><text x="331" y="172" fill="#8a96a6" fontSize="10">ARLA</text><text x="236" y="73" fill="#8a96a6" fontSize="10">AR / BAT</text>
      <g fill="#0b0d10" stroke="#56637a" strokeWidth="2">
        <rect x="100" y="22" width="56" height="22" rx="5" /><rect x="100" y="196" width="56" height="22" rx="5" />
        {[420, 520].map((x) => (
          <g key={x}><rect x={x} y="18" width="58" height="20" rx="5" /><rect x={x} y="40" width="58" height="20" rx="5" /><rect x={x} y="180" width="58" height="20" rx="5" /><rect x={x} y="202" width="58" height="20" rx="5" /></g>
        ))}
      </g>
      {marcas.map((m, i) => (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="11" fill={COR_AVARIA[m.tipo]} stroke="#0f1216" strokeWidth="2" />
          <text x={m.x} y={m.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

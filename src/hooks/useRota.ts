import { useEffect, useState } from 'react';

/** Roteamento simples por hash (#painel, #entrada…) — funciona aberto de qualquer pasta, sem servidor */
export function useRota(padrao = 'painel') {
  const ler = () => (window.location.hash.replace(/^#\/?/, '') || padrao).split('?')[0];
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const f = () => setRota(ler());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return rota;
}

export const irPara = (rota: string) => { window.location.hash = rota; };

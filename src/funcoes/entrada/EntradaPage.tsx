import { useCallback, useEffect, useState } from 'react';
import type { RascunhoEntrada } from '../../types';
import { useOficina } from '../../contexto/OficinaContext';
import { useToast } from '../../contexto/ToastContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { lsGravar, lsLer } from '../../services/armazenamento';
import { irPara } from '../../hooks/useRota';
import { Cabecalho } from '../../componentes/ui/Basicos';
import { Icone } from '../../componentes/ui/Icone';
import { PASSOS, clonar, novoRascunho, validarPasso } from './rascunho';
import { EtapaVeiculo } from './EtapaVeiculo';
import { EtapaReclamacoes } from './EtapaReclamacoes';
import { EtapaChecklist } from './EtapaChecklist';
import { EtapaPneus } from './EtapaPneus';
import { EtapaAvarias } from './EtapaAvarias';
import { EtapaFotos } from './EtapaFotos';
import { EtapaRevisao } from './EtapaRevisao';

const CHAVE = 'oficina-rascunho-entrada';
const ETAPAS = [EtapaVeiculo, EtapaReclamacoes, EtapaChecklist, EtapaPneus, EtapaAvarias, EtapaFotos, EtapaRevisao];

/** Recepção técnica: assistente em 7 passos que termina abrindo a OS */
export function EntradaPage() {
  const { dados, executar, modo, erroConexao } = useOficina();
  const toast = useToast();
  const detalhe = useDetalhe();
  // o rascunho (sem fotos) sobrevive a um recarregamento da página
  const [r, setR] = useState<RascunhoEntrada>(() => ({ ...lsLer(CHAVE, novoRascunho()), fotos: [] }));
  const [salvando, setSalvando] = useState(false);
  const modoApi = modo === 'api' && !erroConexao;

  useEffect(() => { lsGravar(CHAVE, { ...r, fotos: [] }); }, [r]);
  const set = useCallback((f: (x: RascunhoEntrada) => void) => setR((prev) => { const n = clonar(prev); f(n); return n; }), []);

  function irParaPasso(destino: number) {
    for (let p = r.passo; p < destino; p++) {
      const erro = validarPasso(p, r, dados, modoApi);
      if (erro) { toast(erro, 'aviso'); set((x) => { x.passo = p; }); return; }
    }
    set((x) => { x.passo = destino; });
    window.scrollTo(0, 0);
  }

  async function salvar() {
    for (let p = 0; p < PASSOS.length; p++) {
      const erro = validarPasso(p, r, dados, modoApi);
      if (erro) { toast(erro, 'aviso'); set((x) => { x.passo = p; }); return; }
    }
    setSalvando(true);
    const os = await executar((repo) => repo.abrirOS(r));
    setSalvando(false);
    if (os) {
      toast(`OS #${os.num} aberta`, 'ok');
      setR(novoRascunho());
      irPara('os');
      detalhe.abrir(os.id);
    }
  }

  const Etapa = ETAPAS[r.passo];
  return (
    <>
      <Cabecalho titulo="Entrada de veículo" sub="Recepção técnica — registre tudo antes de o veículo entrar no box">
        <button type="button" className="btn ghost" onClick={() => setR(novoRascunho())}>Limpar</button>
      </Cabecalho>
      <div className="steps">
        {PASSOS.map((t, i) => (
          <button type="button" key={t} className={`st ${i === r.passo ? 'on' : i < r.passo ? 'done' : ''}`} onClick={() => irParaPasso(i)}>
            <span className="n">{i < r.passo ? '✓' : i + 1}</span>{t}
          </button>
        ))}
      </div>
      <div className="card"><Etapa r={r} set={set} /></div>
      <div className="wfoot">
        {r.passo > 0 && <button type="button" className="btn" onClick={() => set((x) => { x.passo--; })}>← Voltar</button>}
        {r.passo < PASSOS.length - 1
          ? <button type="button" className="btn pri" onClick={() => irParaPasso(r.passo + 1)}>Avançar →</button>
          : <button type="button" className="btn pri" disabled={salvando} onClick={salvar}><Icone nome="check" tam={16} />{salvando ? 'Abrindo OS…' : 'Abrir ordem de serviço'}</button>}
      </div>
    </>
  );
}

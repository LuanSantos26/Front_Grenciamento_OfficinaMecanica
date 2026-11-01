import { useState } from 'react';
import type { OrdemServico, StatusReclamacao } from '../../../types';
import { QUANDO_OCORRE, SEVERIDADES, SISTEMAS } from '../../../constants/dominio';
import { useOficina } from '../../../contexto/OficinaContext';
import { Card } from '../../../componentes/ui/Basicos';
import { Dialogo } from '../../../componentes/ui/Modal';
import { AreaTexto, Campo, Selecao } from '../../../componentes/ui/Campos';
import { Icone } from '../../../componentes/ui/Icone';
import { TagSeveridade } from '../../../componentes/ui/Tags';

const NOVA = { texto: '', sistema: 'Motor', quando: 'Sempre', sev: 'Média', dtc: '' };

/** Cada reclamação termina com causa raiz e solução — base do relatório de defeitos */
export function AbaReclamacoes({ os }: { os: OrdemServico }) {
  const { executar } = useOficina();
  const [nova, setNova] = useState<typeof NOVA | null>(null);
  const salvar = (rid: string, patch: Record<string, string>) => executar((r) => r.atualizarReclamacao(os.id, rid, patch));
  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted">Registre causa raiz e solução: é isso que alimenta o relatório de defeitos e reincidências.</span><span className="sp" />
        <button type="button" className="btn sm" onClick={() => setNova({ ...NOVA })}><Icone nome="mais" tam={14} />Nova reclamação</button>
      </div>
      {os.reclamacoes.map((r, i) => (
        <Card key={r.id} className="mb">
          <div className="row wrap">
            <b>{i + 1}.</b><span className="tag">{r.sistema}</span><TagSeveridade s={r.sev} /><span className="tag">{r.quando}</span>{r.dtc && <span className="tag mono">{r.dtc}</span>}
            <span className="sp" />
            <select className="in auto" value={r.status} onChange={(e) => salvar(r.id, { status: e.target.value as StatusReclamacao })}>
              {['Aberta', 'Diagnosticada', 'Resolvida', 'Não procede'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <p style={{ margin: '10px 0' }}>“{r.texto}”</p>
          <div className="fg">
            <label className="f">Causa raiz<input className="in" defaultValue={r.causa} placeholder="O que realmente causou o defeito" onBlur={(e) => e.target.value !== r.causa && salvar(r.id, { causa: e.target.value })} /></label>
            <label className="f">Solução aplicada<input className="in" defaultValue={r.solucao || ''} placeholder="O que foi feito" onBlur={(e) => e.target.value !== (r.solucao || '') && salvar(r.id, { solucao: e.target.value })} /></label>
          </div>
        </Card>
      ))}
      <Dialogo titulo="Nova reclamação" aberto={!!nova} onFechar={() => setNova(null)}
        onSalvar={async () => { if (!nova?.texto.trim()) return; await executar((r) => r.adicionarReclamacao(os.id, nova), 'Reclamação registrada'); setNova(null); }}>
        {nova && <>
          <AreaTexto rotulo="Relato *" required valor={nova.texto} onChange={(v) => setNova({ ...nova, texto: v })} />
          <div className="fg mt">
            <Selecao rotulo="Sistema" valor={nova.sistema} opcoes={SISTEMAS} onChange={(v) => setNova({ ...nova, sistema: v })} />
            <Selecao rotulo="Severidade" valor={nova.sev} opcoes={SEVERIDADES} onChange={(v) => setNova({ ...nova, sev: v })} />
            <Selecao rotulo="Quando ocorre" valor={nova.quando} opcoes={QUANDO_OCORRE} onChange={(v) => setNova({ ...nova, quando: v })} />
            <Campo rotulo="Códigos DTC" valor={nova.dtc} onChange={(v) => setNova({ ...nova, dtc: v })} />
          </div>
        </>}
      </Dialogo>
    </>
  );
}

import type { RascunhoEntrada } from '../../types';
import { QUANDO_OCORRE, SEVERIDADES, SISTEMAS } from '../../constants/dominio';
import { AreaTexto, Campo, Selecao } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };

/** Passo 2 — relato do cliente/motorista, um item por sintoma */
export function EtapaReclamacoes({ r, set }: Props) {
  return (
    <>
      <h3>Reclamações do cliente / motorista<span className="sp" />
        <button type="button" className="btn sm" onClick={() => set((x) => { x.reclamacoes.push({ texto: '', sistema: 'Motor', quando: 'Sempre', sev: 'Média', dtc: '' }); })}>
          <Icone nome="mais" tam={14} />Adicionar reclamação
        </button>
      </h3>
      <p className="muted" style={{ marginTop: -4 }}>Registre com as palavras do motorista. Um sintoma por item: cada um vira uma linha no diagnóstico e no histórico do veículo.</p>
      {r.reclamacoes.map((rc, i) => (
        <div className="caixa" key={i} style={{ marginBottom: 10 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <b>Reclamação {i + 1}</b><span className="sp" />
            {r.reclamacoes.length > 1 && <button type="button" className="btn sm ghost danger" onClick={() => set((x) => { x.reclamacoes.splice(i, 1); })}>Remover</button>}
          </div>
          <div className="fg">
            <AreaTexto rotulo="Relato *" className="wf" valor={rc.texto} placeholder="Ex.: perde força na subida carregado e a luz amarela do motor acende"
              onChange={(v) => set((x) => { x.reclamacoes[i].texto = v; })} />
            <Selecao rotulo="Sistema" valor={rc.sistema} opcoes={SISTEMAS} onChange={(v) => set((x) => { x.reclamacoes[i].sistema = v; })} />
            <Selecao rotulo="Quando ocorre" valor={rc.quando} opcoes={QUANDO_OCORRE} onChange={(v) => set((x) => { x.reclamacoes[i].quando = v; })} />
            <Selecao rotulo="Severidade" valor={rc.sev} opcoes={SEVERIDADES} onChange={(v) => set((x) => { x.reclamacoes[i].sev = v; })} />
            <Campo rotulo="Códigos de falha (DTC)" className="mono" valor={rc.dtc} placeholder="P20EE, SPN 3226…" onChange={(v) => set((x) => { x.reclamacoes[i].dtc = v; })} />
          </div>
        </div>
      ))}
      <AreaTexto rotulo="Observações gerais da recepção" valor={r.entrada.obs} placeholder="Serviços solicitados, restrições do cliente, autorização prévia de valores…"
        onChange={(v) => set((x) => { x.entrada.obs = v; })} />
    </>
  );
}

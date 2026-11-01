import { useCallback } from 'react';
import type { OrdemServico, Prioridade, StatusOS } from '../../types';
import { PRIORIDADES, STATUS } from '../../constants/dominio';
import { brl, dataHora, paraInputLocal } from '../../utils/formato';
import { totalOS } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe, type AbaOS } from '../../contexto/DetalheContext';
import { useToast } from '../../contexto/ToastContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Gaveta } from '../../componentes/ui/Modal';
import { Abas } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagPrioridade, TagStatus } from '../../componentes/ui/Tags';
import { AbaResumo } from './abas/AbaResumo';
import { AbaReclamacoes } from './abas/AbaReclamacoes';
import { AbaServicos } from './abas/AbaServicos';
import { AbaFotos } from './abas/AbaFotos';
import { AbaEntrada } from './abas/AbaEntrada';
import { AbaHistorico } from './abas/AbaHistorico';
import { ProgressoOS } from '../progresso/ProgressoOS';

/** Gaveta lateral com tudo sobre uma OS */
export function DetalheOS() {
  const { osId, aba, setAba, fechar, pedirSaida } = useDetalhe();
  const fecharCb = useCallback(() => fechar(), [fechar]);
  const q = useConsultas();
  const os = osId ? q.ordem(osId) : undefined;
  return (
    <Gaveta aberto={!!os} onFechar={fecharCb}>
      {os && <Conteudo os={os} aba={aba} setAba={setAba} fechar={fechar} pedirSaida={pedirSaida} />}
    </Gaveta>
  );
}

function Conteudo({ os, aba, setAba, fechar, pedirSaida }: { os: OrdemServico; aba: AbaOS; setAba: (a: AbaOS) => void; fechar: () => void; pedirSaida: (id: string) => void }) {
  const { dados, executar } = useOficina();
  const toast = useToast();
  const q = useConsultas();
  const v = q.veiculo(os.veiculoId);
  const c = q.cliente(os.clienteId);
  const nFotos = q.fotosDa(os.id).length;
  const entregue = os.status === 'Entregue';

  function trocarStatus(s: StatusOS) {
    if (s === 'Entregue') return pedirSaida(os.id);
    executar((r) => r.mudarStatus(os.id, s));
  }

  async function copiarResumo() {
    const t = [
      `OS #${os.num} — ${v?.placa} ${v?.marca} ${v?.modelo}`, `Cliente: ${c?.nome}`, `Etapa: ${os.status}`, '',
      'Reclamações:', ...os.reclamacoes.map((r, i) => `${i + 1}. ${r.texto}${r.causa ? ` → ${r.causa}` : ''}`), '',
      'Serviços:', ...(os.servicos.map((s) => `- ${s.desc}`).length ? os.servicos.map((s) => `- ${s.desc}`) : ['-']),
      'Peças:', ...(os.pecas.length ? os.pecas.map((p) => `- ${p.qtd}x ${p.desc} ${brl(p.qtd * p.valorUnit)}`) : ['-']),
      '', `TOTAL: ${brl(totalOS(os, dados.funcionarios))}`, os.previsao ? `Previsão: ${dataHora(os.previsao)}` : '',
    ].join('\n');
    try { await navigator.clipboard.writeText(t); toast('Resumo copiado — pronto para colar no WhatsApp'); } catch { toast('Não foi possível copiar neste navegador', 'erro'); }
  }

  const abas: [AbaOS, string][] = [
    ['resumo', 'Resumo'], ['progresso', 'Progresso'], ['reclamacoes', `Reclamações (${os.reclamacoes.length})`],
    ['servicos', `Serviços e peças (${os.servicos.length + os.pecas.length})`], ['fotos', `Fotos (${nFotos})`], ['entrada', 'Entrada e saída'], ['historico', 'Histórico'],
  ];

  return (
    <>
      <div className="row wrap">
        <Placa placa={v?.placa} grande /><h2 style={{ margin: 0, fontSize: 20 }}>OS #{os.num}</h2><TagStatus status={os.status} /><TagPrioridade p={os.prioridade} />
        <span className="sp" />
        {os.status === 'Pronto p/ retirada' && <button type="button" className="btn sm pri" onClick={() => pedirSaida(os.id)}><Icone nome="saida" tam={14} />Registrar saída</button>}
        <button type="button" className="btn sm" onClick={copiarResumo}><Icone nome="copiar" tam={14} />Copiar resumo</button>
        <button type="button" className="btn sm ghost" onClick={fechar} aria-label="Fechar"><Icone nome="x" tam={14} /></button>
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        {v?.marca} {v?.modelo} {v?.ano} · {v?.tipo} · {c?.nome} · entrada {dataHora(os.abertura)}
        {os.saida && ` · saída ${dataHora(os.saida.data)}`}
        {os.retornoDe && <> · <span className="tag vio">Retorno da OS #{os.retornoDe}</span></>}
      </div>
      <div className="grid g4" style={{ marginTop: 14 }}>
        <label className="f">Etapa
          <select className="in" value={os.status} disabled={entregue} onChange={(e) => trocarStatus(e.target.value as StatusOS)}>
            {STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="f">Prioridade
          <select className="in" value={os.prioridade} onChange={(e) => executar((r) => r.atualizarOS(os.id, { prioridade: e.target.value as Prioridade }, `Prioridade: ${e.target.value}`))}>
            {PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="f">Box
          <select className="in" value={os.box || 'Pátio'} disabled={entregue} onChange={(e) => executar((r) => r.atualizarOS(os.id, { box: e.target.value }, `Movido para ${e.target.value}`))}>
            {['Pátio', ...dados.boxes].map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label className="f">Previsão de entrega
          <input type="datetime-local" className="in" value={paraInputLocal(os.previsao)}
            onChange={(e) => { const val = e.target.value ? new Date(e.target.value).toISOString() : ''; executar((r) => r.atualizarOS(os.id, { previsao: val }, `Previsão: ${dataHora(val)}`)); }} />
        </label>
      </div>
      <Abas abas={abas} ativa={aba} onChange={setAba} />
      {aba === 'resumo' && <AbaResumo os={os} />}
      {aba === 'progresso' && <div className="card"><ProgressoOS os={os} /></div>}
      {aba === 'reclamacoes' && <AbaReclamacoes os={os} />}
      {aba === 'servicos' && <AbaServicos os={os} />}
      {aba === 'fotos' && <AbaFotos os={os} />}
      {aba === 'entrada' && <AbaEntrada os={os} />}
      {aba === 'historico' && <AbaHistorico os={os} />}
    </>
  );
}

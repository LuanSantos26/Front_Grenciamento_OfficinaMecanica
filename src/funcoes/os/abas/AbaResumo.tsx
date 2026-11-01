import { useState } from 'react';
import type { OrdemServico } from '../../../types';
import { SISTEMAS } from '../../../constants/dominio';
import { brl, data, dataHora, num } from '../../../utils/formato';
import { totalMaoDeObra, totalOS, totalPecas } from '../../../utils/calculos';
import { useOficina } from '../../../contexto/OficinaContext';
import { useDetalhe } from '../../../contexto/DetalheContext';
import { useConsultas } from '../../../hooks/useConsultas';
import { Alerta, Card } from '../../../componentes/ui/Basicos';
import { Dialogo } from '../../../componentes/ui/Modal';
import { AreaTexto, Campo, Selecao } from '../../../componentes/ui/Campos';
import { Icone } from '../../../componentes/ui/Icone';
import { TagStatus } from '../../../componentes/ui/Tags';

export function AbaResumo({ os }: { os: OrdemServico }) {
  const { dados, executar } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  const [diag, setDiag] = useState(os.diagnostico);
  const [dlgAprov, setDlgAprov] = useState(false);
  const [dlgRet, setDlgRet] = useState(false);
  const [aprov, setAprov] = useState({ por: '', meio: 'WhatsApp' });
  const [ret, setRet] = useState({ texto: '', sistema: os.reclamacoes[0]?.sistema || 'Motor', km: '' });
  const anteriores = dados.ordens.filter((x) => x.veiculoId === os.veiculoId && x.id !== os.id).sort((a, b) => b.num - a.num);
  const horas = os.servicos.reduce((a, s) => a + (s.horas || 0), 0);

  return (
    <div className="grid g2">
      <Card titulo="Orçamento">
        <div className="sum"><span>Mão de obra ({horas} h)</span><span className="mono">{brl(totalMaoDeObra(os, dados.funcionarios))}</span></div>
        <div className="sum"><span>Peças ({os.pecas.length} itens)</span><span className="mono">{brl(totalPecas(os))}</span></div>
        <div className="sum tot"><span>Total</span><span>{brl(totalOS(os, dados.funcionarios))}</span></div>
        <hr className="s" />
        {os.aprovado
          ? <Alerta icone="check" cor="ok"><b>Aprovado</b> em {dataHora(os.aprovado.data)}<div className="muted">{os.aprovado.por}</div></Alerta>
          : <>
            <Alerta icone="dinheiro" cor="vio"><b>Aguardando aprovação do cliente</b><div className="muted">Registre quem aprovou e por qual meio.</div></Alerta>
            <button type="button" className="btn pri sm" onClick={() => setDlgAprov(true)}>Registrar aprovação</button>
          </>}
      </Card>
      <Card titulo="Diagnóstico técnico" acoes={diag !== os.diagnostico && <button type="button" className="btn sm pri" onClick={() => executar((r) => r.atualizarOS(os.id, { diagnostico: diag }, 'Diagnóstico atualizado'), 'Diagnóstico salvo')}>Salvar</button>}>
        <textarea className="in" style={{ minHeight: 140 }} value={diag} placeholder="Testes realizados, medições, códigos lidos, causa provável…" onChange={(e) => setDiag(e.target.value)} />
      </Card>
      <Card titulo="Chegada">
        <div className="grid g2">
          <div><div className="muted">Hodômetro</div><b className="mono">{num(os.entrada.km)} km</b></div>
          <div><div className="muted">Combustível</div><b>{os.entrada.combustivel}/8</b></div>
          <div><div className="muted">Motorista</div><b>{os.entrada.motorista || '—'}</b></div>
          <div><div className="muted">Atendimento</div><b>{os.tipo}</b></div>
        </div>
      </Card>
      <Card titulo={<>Histórico do veículo <span className="tag">{anteriores.length}</span></>}>
        {anteriores.length ? anteriores.map((h) => (
          <div key={h.id} className="row linha click" onClick={() => abrir(h.id)}>
            <span className="mono">#{h.num}</span><span className="muted">{data(h.abertura)}</span>
            <span className="corta" style={{ flex: 1 }}>{h.reclamacoes[0]?.texto}</span><TagStatus status={h.status} />
          </div>
        )) : <div className="muted">Primeira passagem pela oficina.</div>}
        {os.status === 'Entregue' && <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => setDlgRet(true)}><Icone nome="retorno" tam={14} />Abrir retorno em garantia</button>}
      </Card>

      <Dialogo titulo="Registrar aprovação do orçamento" aberto={dlgAprov} onFechar={() => setDlgAprov(false)} rotuloSalvar="Aprovar"
        onSalvar={async () => { if (!aprov.por.trim()) return; await executar((r) => r.aprovar(os.id, `${aprov.por} — ${aprov.meio}`), 'Orçamento aprovado'); setDlgAprov(false); }}>
        <div className="fg">
          <Campo rotulo="Aprovado por *" required valor={aprov.por} onChange={(v) => setAprov({ ...aprov, por: v })} />
          <Selecao rotulo="Meio" valor={aprov.meio} opcoes={['WhatsApp', 'Telefone', 'E-mail', 'Presencial (assinado)', 'Contrato / pré-autorizado']} onChange={(v) => setAprov({ ...aprov, meio: v })} />
        </div>
      </Dialogo>
      <Dialogo titulo="Abrir retorno em garantia" aberto={dlgRet} onFechar={() => setDlgRet(false)} rotuloSalvar="Abrir retorno"
        onSalvar={async () => {
          if (!ret.texto.trim() || !ret.km) return;
          const n = await executar((r) => r.abrirRetorno(os.id, ret.texto, ret.sistema, Number(ret.km)), 'OS de retorno aberta');
          setDlgRet(false); if (n) abrir(n.id);
        }}>
        <p className="muted" style={{ marginTop: 0 }}>Cria uma OS do tipo <b>Garantia / Retorno</b> ligada à OS #{os.num} ({q.veiculo(os.veiculoId)?.placa}).</p>
        <AreaTexto rotulo="O que o cliente relatou? *" required valor={ret.texto} onChange={(v) => setRet({ ...ret, texto: v })} />
        <div className="fg mt">
          <Selecao rotulo="Sistema" valor={ret.sistema} opcoes={SISTEMAS} onChange={(v) => setRet({ ...ret, sistema: v })} />
          <Campo rotulo="Km atual *" type="number" required valor={ret.km} onChange={(v) => setRet({ ...ret, km: v })} />
        </div>
      </Dialogo>
    </div>
  );
}

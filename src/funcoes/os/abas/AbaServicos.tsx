import { useState } from 'react';
import type { OrdemServico } from '../../../types';
import { SISTEMAS } from '../../../constants/dominio';
import { brl, dataHora } from '../../../utils/formato';
import { totalOS, valorServico } from '../../../utils/calculos';
import { useOficina } from '../../../contexto/OficinaContext';
import { useToast } from '../../../contexto/ToastContext';
import { useConsultas } from '../../../hooks/useConsultas';
import { Alerta, Card, Vazio } from '../../../componentes/ui/Basicos';
import { Dialogo } from '../../../componentes/ui/Modal';
import { Campo, Selecao } from '../../../componentes/ui/Campos';
import { Icone } from '../../../componentes/ui/Icone';

/** Mão de obra e peças usadas na OS */
export function AbaServicos({ os }: { os: OrdemServico }) {
  const { dados, executar, modo, erroConexao } = useOficina();
  const toast = useToast();
  const q = useConsultas();
  const api = modo === 'api' && !erroConexao;
  const fechada = os.status === 'Entregue';
  const primeiroMec = dados.funcionarios[0]?.id || '';
  const [serv, setServ] = useState<{ desc: string; sistema: string; mecId: string; horas: string } | null>(null);
  const [peca, setPeca] = useState<{ pecaId: string; qtd: string; mecId: string } | null>(null);
  const estoqueSel = peca ? q.peca(peca.pecaId) : undefined;

  const bloquear = () => { if (fechada) { toast('OS finalizada: não aceita novos itens.', 'aviso'); return true; } if (!dados.funcionarios.length) { toast('Cadastre um funcionário primeiro (Painel → Equipe).', 'aviso'); return true; } return false; };

  return (
    <>
      {os.itensOk === false && <Alerta icone="defeitos" cor="warn">O back-end não lista os itens da OS (falta <span className="mono">GET /api/ordens-servico/&#123;id&#125;/itens</span>). O total vem da API, mas o detalhamento só aparece com o back-end atualizado.</Alerta>}
      <Card className="mb" titulo="Mão de obra" acoes={<button type="button" className="btn sm" onClick={() => !bloquear() && setServ({ desc: '', sistema: 'Motor', mecId: primeiroMec, horas: '1' })}><Icone nome="mais" tam={14} />Serviço</button>}>
        {os.servicos.length ? (
          <div className="tbl"><table>
            <thead><tr><th /><th>Serviço</th><th>Sistema</th><th>Mecânico</th><th>Horas</th><th className="dir">Valor</th><th /></tr></thead>
            <tbody>{os.servicos.map((s) => (
              <tr key={s.id}>
                <td><input type="checkbox" checked={s.feito} title="Concluído" onChange={() => executar((r) => r.alternarServico(os.id, s.id))} /></td>
                <td className={s.feito ? 'riscado' : ''}>{s.desc}</td>
                <td><span className="tag">{s.sistema}</span></td>
                <td>{q.funcionario(s.mecId)?.nome || '—'}</td>
                <td className="mono">{s.horas ?? '—'}</td>
                <td className="dir mono">{brl(valorServico(s, dados.funcionarios))}</td>
                <td>{!api && !fechada && <button type="button" className="btn sm ghost danger" onClick={() => executar((r) => r.removerServico(os.id, s.id))}><Icone nome="x" tam={13} /></button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Vazio>Nenhum serviço lançado</Vazio>}
      </Card>

      <Card titulo="Peças utilizadas" acoes={<button type="button" className="btn sm" onClick={() => !bloquear() && setPeca({ pecaId: dados.estoque[0]?.id || '', qtd: '1', mecId: primeiroMec })}><Icone nome="mais" tam={14} />Peça</button>}>
        {os.pecas.length ? (
          <div className="tbl"><table>
            <thead><tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Unit.</th><th className="dir">Subtotal</th><th>Aplicada por</th><th>Quando</th><th /></tr></thead>
            <tbody>{os.pecas.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.cod || '—'}</td><td>{p.desc}</td><td className="mono">{p.qtd}</td><td className="mono">{brl(p.valorUnit)}</td>
                <td className="dir mono">{brl(p.qtd * p.valorUnit)}</td><td>{q.funcionario(p.mecId)?.nome || '—'}</td><td className="muted">{dataHora(p.data)}</td>
                <td>{!api && !fechada && <button type="button" className="btn sm ghost danger" title="Devolver ao estoque" onClick={() => executar((r) => r.removerPeca(os.id, p.id))}><Icone nome="x" tam={13} /></button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Vazio>Nenhuma peça lançada</Vazio>}
        <div className="sum tot"><span>Total da OS</span><span>{brl(totalOS(os, dados.funcionarios))}</span></div>
      </Card>

      <Dialogo titulo="Lançar serviço" aberto={!!serv} onFechar={() => setServ(null)}
        onSalvar={async () => {
          if (!serv?.desc.trim() || !Number(serv.horas)) return;
          await executar((r) => r.lancarServico(os.id, { ...serv, horas: Number(serv.horas) }), 'Serviço lançado');
          setServ(null);
        }}>
        {serv && <div className="fg">
          <Campo rotulo="Descrição do serviço *" className="wf" required valor={serv.desc} placeholder="Ex.: Regulagem de válvulas" onChange={(v) => setServ({ ...serv, desc: v })} />
          <Selecao rotulo="Sistema" valor={serv.sistema} opcoes={SISTEMAS} onChange={(v) => setServ({ ...serv, sistema: v })} />
          <Selecao rotulo="Mecânico" valor={serv.mecId} opcoes={dados.funcionarios.map((m) => [m.id, `${m.nome} (${brl(m.valorHora)}/h)`] as [string, string])} onChange={(v) => setServ({ ...serv, mecId: v })} />
          <Campo rotulo="Tempo (h) *" type="number" step="0.5" min="0.5" required valor={serv.horas} onChange={(v) => setServ({ ...serv, horas: v })} />
          <div className="f"><span>Valor</span><b className="mono" style={{ padding: '8px 0' }}>{brl(Number(serv.horas) * (q.funcionario(serv.mecId)?.valorHora || 150))}</b></div>
        </div>}
      </Dialogo>

      <Dialogo titulo="Lançar peça" aberto={!!peca} onFechar={() => setPeca(null)}
        onSalvar={async () => {
          if (!peca?.pecaId || !Number(peca.qtd)) return;
          const aviso = await executar((r) => r.lancarPeca(os.id, { pecaId: peca.pecaId, qtd: Number(peca.qtd), mecId: peca.mecId }), 'Peça lançada');
          if (aviso) toast(aviso, 'aviso');
          setPeca(null);
        }}>
        {peca && <div className="fg">
          <Selecao rotulo="Peça do estoque" className="wf" valor={peca.pecaId} onChange={(v) => setPeca({ ...peca, pecaId: v })}
            opcoes={dados.estoque.map((p) => [p.id, `${p.cod} — ${p.desc} (${p.qtd} em estoque)`] as [string, string])} />
          <Campo rotulo="Quantidade *" type="number" min="1" required valor={peca.qtd} onChange={(v) => setPeca({ ...peca, qtd: v })} />
          <Selecao rotulo="Aplicada por" valor={peca.mecId} opcoes={dados.funcionarios.map((m) => [m.id, m.nome] as [string, string])} onChange={(v) => setPeca({ ...peca, mecId: v })} />
          {estoqueSel && <div className="wf muted">Unitário {brl(estoqueSel.venda)} · subtotal <b className="tx">{brl(estoqueSel.venda * Number(peca.qtd || 0))}</b>
            {Number(peca.qtd) > estoqueSel.qtd && <span className="tag bad" style={{ marginLeft: 8 }}>estoque insuficiente</span>}</div>}
        </div>}
      </Dialogo>
    </>
  );
}

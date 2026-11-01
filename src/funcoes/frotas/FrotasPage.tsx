import { useState } from 'react';
import { brl, num } from '../../utils/formato';
import { totalOS } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { Cabecalho, Card, Progresso } from '../../componentes/ui/Basicos';
import { Dialogo } from '../../componentes/ui/Modal';
import { Campo, Selecao } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';
import { Placa, TagStatus } from '../../componentes/ui/Tags';

const NOVO = { nome: '', doc: '', tel: '', contato: '', tipo: 'Frotista', prazo: 'À vista' };

export function FrotasPage() {
  const { dados, executar, modo } = useOficina();
  const { abrir } = useDetalhe();
  const [novo, setNovo] = useState<typeof NOVO | null>(null);
  return (
    <>
      <Cabecalho titulo="Clientes e frotas" sub="Cadastro, histórico e controle de preventiva por km">
        <button type="button" className="btn pri" onClick={() => setNovo({ ...NOVO })}><Icone nome="mais" tam={16} />Novo cliente</button>
      </Cabecalho>
      {dados.clientes.map((c) => {
        const vs = dados.veiculos.filter((v) => v.clienteId === c.id);
        const gasto = dados.ordens.filter((o) => o.clienteId === c.id).reduce((a, o) => a + totalOS(o, dados.funcionarios), 0);
        return (
          <Card key={c.id} className="mb" titulo={<>{c.nome} {c.tipo && <span className={`tag ${c.tipo === 'Frotista' ? 'info' : ''}`}>{c.tipo}</span>}</>}
            acoes={<span className="muted" style={{ fontWeight: 500, fontSize: 12.5 }}>{c.doc} · {c.tel} {c.contato && `· ${c.contato}`} · Total em OS: <b className="tx2">{brl(gasto)}</b></span>}>
            <div className="tbl"><table>
              <thead><tr><th>Placa</th><th>Frota</th><th>Veículo</th><th>Km atual</th><th>Preventiva</th><th>Passagens</th><th>Situação</th></tr></thead>
              <tbody>{vs.length ? vs.map((v) => {
                const rod = v.km - v.ultRevKm; const pct = v.intRev ? (rod / v.intRev) * 100 : 0;
                const os = dados.ordens.filter((o) => o.veiculoId === v.id); const aberta = os.find((o) => o.status !== 'Entregue');
                return (
                  <tr key={v.id}>
                    <td><Placa placa={v.placa} /></td><td className="mono">{v.frota || '—'}</td><td>{v.marca} {v.modelo} <span className="muted">{v.ano} · {v.tipo}</span></td>
                    <td className="mono">{num(v.km)}</td>
                    <td style={{ minWidth: 170 }}><Progresso pct={pct} cor={pct >= 100 ? 'var(--bad)' : pct >= 90 ? 'var(--warn)' : 'var(--ok)'} />
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{num(rod)} / {num(v.intRev)} km{pct >= 100 && <b style={{ color: 'var(--bad)' }}> · VENCIDA</b>}</div></td>
                    <td className="mono">{os.length}</td>
                    <td>{aberta ? <span className="click" onClick={() => abrir(aberta.id)}><TagStatus status={aberta.status} /></span> : <span className="tag">Em operação</span>}</td>
                  </tr>
                );
              }) : <tr><td colSpan={7} className="empty">Sem veículos</td></tr>}</tbody>
            </table></div>
          </Card>
        );
      })}
      <Dialogo titulo="Novo cliente" aberto={!!novo} onFechar={() => setNovo(null)}
        onSalvar={async () => { if (!novo?.nome.trim() || (modo === 'api' && !novo.doc.trim())) return; await executar((r) => r.cadastrarCliente(novo), 'Cliente cadastrado'); setNovo(null); }}>
        {novo && <div className="fg">
          <Campo rotulo="Nome / razão social *" className="w2" required valor={novo.nome} onChange={(v) => setNovo({ ...novo, nome: v })} />
          <Campo rotulo={`CNPJ / CPF${modo === 'api' ? ' *' : ''}`} required={modo === 'api'} valor={novo.doc} onChange={(v) => setNovo({ ...novo, doc: v })} />
          <Campo rotulo="Telefone" valor={novo.tel} onChange={(v) => setNovo({ ...novo, tel: v })} />
          <Campo rotulo="Contato" valor={novo.contato} onChange={(v) => setNovo({ ...novo, contato: v })} />
          <Selecao rotulo="Tipo" valor={novo.tipo} opcoes={['Frotista', 'Autônomo', 'Locadora', 'Concessionária (terceirização)']} onChange={(v) => setNovo({ ...novo, tipo: v })} />
          <Campo rotulo="Prazo de pagamento" valor={novo.prazo} onChange={(v) => setNovo({ ...novo, prazo: v })} />
        </div>}
      </Dialogo>
    </>
  );
}

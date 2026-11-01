import { useState } from 'react';
import { brl } from '../../utils/formato';
import { abertas } from '../../utils/calculos';
import { useOficina } from '../../contexto/OficinaContext';
import { Cabecalho } from '../../componentes/ui/Basicos';
import { Dialogo } from '../../componentes/ui/Modal';
import { Campo } from '../../componentes/ui/Campos';
import { Icone } from '../../componentes/ui/Icone';

const NOVA = { cod: '', desc: '', apl: '', qtd: '0', min: '1', custo: '', venda: '' };

export function EstoquePage() {
  const { dados, executar } = useOficina();
  const [busca, setBusca] = useState('');
  const [nova, setNova] = useState<typeof NOVA | null>(null);
  const [entrada, setEntrada] = useState<{ id: string; qtd: string } | null>(null);
  const t = busca.toLowerCase();
  const lista = dados.estoque.filter((p) => !t || [p.cod, p.desc, p.apl].join(' ').toLowerCase().includes(t));
  const emUso = (id: string) => abertas(dados).reduce((a, o) => a + o.pecas.filter((p) => p.pecaId === id).reduce((x, p) => x + p.qtd, 0), 0);
  const pecaEntrada = entrada ? dados.estoque.find((p) => p.id === entrada.id) : undefined;
  return (
    <>
      <Cabecalho titulo="Estoque de peças" sub={`${dados.estoque.length} itens · ${brl(dados.estoque.reduce((a, p) => a + p.qtd * p.custo, 0))} em estoque (custo)`}>
        <div className="search"><Icone nome="busca" tam={15} /><input className="in" placeholder="Código, descrição, aplicação" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <a className="btn" href="#pecas-usadas"><Icone nome="pecas" tam={15} />Peças utilizadas</a>
        <button type="button" className="btn pri" onClick={() => setNova({ ...NOVA })}><Icone nome="mais" tam={16} />Nova peça</button>
      </Cabecalho>
      <div className="card tbl"><table>
        <thead><tr><th>Código</th><th>Descrição</th><th>Aplicação</th><th>Estoque</th><th>Mínimo</th><th>Em OS abertas</th><th>Custo</th><th>Venda</th><th>Margem</th><th /></tr></thead>
        <tbody>{lista.map((p) => (
          <tr key={p.id}>
            <td className="mono">{p.cod}</td><td><b>{p.desc}</b></td><td className="muted">{p.apl}</td>
            <td><span className={`tag ${p.qtd <= 0 ? 'bad' : p.qtd < p.min ? 'warn' : 'ok'}`}>{p.qtd}</span></td><td className="mono">{p.min}</td>
            <td className="mono">{emUso(p.id) || '—'}</td><td className="mono">{brl(p.custo)}</td><td className="mono">{brl(p.venda)}</td>
            <td className="mono">{p.custo ? Math.round((p.venda / p.custo - 1) * 100) : 0}%</td>
            <td><button type="button" className="btn sm" onClick={() => setEntrada({ id: p.id, qtd: '1' })}>+ Entrada</button></td>
          </tr>
        ))}</tbody>
      </table></div>
      <Dialogo titulo="Nova peça" aberto={!!nova} onFechar={() => setNova(null)}
        onSalvar={async () => { if (!nova?.cod || !nova.desc) return; await executar((r) => r.cadastrarPeca({ ...nova, qtd: +nova.qtd, min: +nova.min, custo: +nova.custo, venda: +nova.venda }), 'Peça cadastrada'); setNova(null); }}>
        {nova && <div className="fg">
          <Campo rotulo="Código *" required valor={nova.cod} onChange={(v) => setNova({ ...nova, cod: v })} />
          <Campo rotulo="Descrição *" required className="w2" valor={nova.desc} onChange={(v) => setNova({ ...nova, desc: v })} />
          <Campo rotulo="Aplicação" valor={nova.apl} onChange={(v) => setNova({ ...nova, apl: v })} />
          <Campo rotulo="Quantidade inicial" type="number" valor={nova.qtd} onChange={(v) => setNova({ ...nova, qtd: v })} />
          <Campo rotulo="Estoque mínimo" type="number" valor={nova.min} onChange={(v) => setNova({ ...nova, min: v })} />
          <Campo rotulo="Custo (R$)" type="number" step="0.01" valor={nova.custo} onChange={(v) => setNova({ ...nova, custo: v })} />
          <Campo rotulo="Venda (R$)" type="number" step="0.01" valor={nova.venda} onChange={(v) => setNova({ ...nova, venda: v })} />
        </div>}
      </Dialogo>
      <Dialogo titulo={`Entrada de estoque — ${pecaEntrada?.desc ?? ''}`} aberto={!!entrada} onFechar={() => setEntrada(null)}
        onSalvar={async () => { if (!entrada || !Number(entrada.qtd)) return; await executar((r) => r.entradaEstoque(entrada.id, Number(entrada.qtd)), 'Estoque atualizado'); setEntrada(null); }}>
        {entrada && <Campo rotulo="Quantidade recebida" type="number" min="1" valor={entrada.qtd} onChange={(v) => setEntrada({ ...entrada, qtd: v })} />}
      </Dialogo>
    </>
  );
}

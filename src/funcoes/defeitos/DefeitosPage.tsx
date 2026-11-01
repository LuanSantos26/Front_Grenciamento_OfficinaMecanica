import { useMemo, useState } from 'react';
import { SISTEMAS } from '../../constants/dominio';
import { data, horasDesde } from '../../utils/formato';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Alerta, Barras, Cabecalho, Card, Kpi } from '../../componentes/ui/Basicos';
import { Selecao } from '../../componentes/ui/Campos';
import { Placa, TagSeveridade } from '../../componentes/ui/Tags';

/** Todas as reclamações, com causa raiz e detecção de reincidência */
export function DefeitosPage() {
  const { dados } = useOficina();
  const { abrir } = useDetalhe();
  const q = useConsultas();
  const [sis, setSis] = useState('');
  const [st, setSt] = useState('');
  const todas = useMemo(() => dados.ordens.flatMap((o) => o.reclamacoes.map((r) => ({ ...r, os: o }))), [dados]);
  const lista = todas.filter((r) => (!sis || r.sistema === sis) && (!st || r.status === st)).sort((a, b) => b.data.localeCompare(a.data));
  const reinc = useMemo(() => {
    const m = new Map<string, Set<string>>();
    todas.filter((r) => horasDesde(r.data) < 90 * 24 && r.sistema !== '—').forEach((r) => { const k = `${r.os.veiculoId}|${r.sistema}`; m.set(k, (m.get(k) || new Set()).add(r.os.id)); });
    return [...m.entries()].filter(([, s]) => s.size > 1);
  }, [todas]);
  const porSistema = SISTEMAS.map((s) => ({ rotulo: s, valor: todas.filter((r) => r.sistema === s).length })).filter((x) => x.valor).sort((a, b) => b.valor - a.valor);

  return (
    <>
      <Cabecalho titulo="Defeitos e reclamações" sub="Tudo o que o cliente relatou, com causa raiz e reincidência" />
      <div className="grid g4">
        <Kpi titulo="Abertas" valor={todas.filter((r) => r.status === 'Aberta').length} rodape="sem diagnóstico" icone="defeitos" cor="var(--warn)" />
        <Kpi titulo="Críticas em andamento" valor={todas.filter((r) => /Crít/.test(r.sev) && r.status !== 'Resolvida').length} rodape="imobilizam o veículo" icone="defeitos" cor="var(--bad)" />
        <Kpi titulo="Reincidências (90 dias)" valor={reinc.length} rodape="mesmo veículo e sistema" icone="retorno" cor="var(--vio)" />
        <Kpi titulo="Resolvidas" valor={todas.filter((r) => r.status === 'Resolvida').length} rodape={`de ${todas.length} registradas`} icone="check" cor="var(--ok)" />
      </div>
      <div className="grid g21 mt">
        <Card titulo="Registro" acoes={<>
          <Selecao valor={sis} opcoes={[['', 'Todos os sistemas'], ...SISTEMAS.map((s) => [s, s] as [string, string])]} onChange={setSis} />
          <Selecao valor={st} opcoes={[['', 'Todos'], ...['Aberta', 'Diagnosticada', 'Resolvida', 'Não procede'].map((s) => [s, s] as [string, string])]} onChange={setSt} />
        </>}>
          <div className="tbl"><table>
            <thead><tr><th>Data</th><th>Veículo</th><th>Relato</th><th>Sistema</th><th>Severidade</th><th>Status</th></tr></thead>
            <tbody>{lista.map((r) => (
              <tr key={r.id} className="click" onClick={() => abrir(r.os.id, 'reclamacoes')}>
                <td>{data(r.data)}<div className="muted mono" style={{ fontSize: 11.5 }}>OS #{r.os.num}</div></td>
                <td><Placa placa={q.veiculo(r.os.veiculoId)?.placa} /></td>
                <td style={{ maxWidth: 320 }}>{r.texto}{r.causa && <div className="muted" style={{ fontSize: 12 }}>Causa: {r.causa}</div>}</td>
                <td><span className="tag">{r.sistema}</span></td><td><TagSeveridade s={r.sev} /></td>
                <td><span className={`tag ${r.status === 'Resolvida' ? 'ok' : r.status === 'Aberta' ? 'warn' : 'info'}`}>{r.status}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        </Card>
        <div>
          <Card titulo="Defeitos por sistema" className="mb"><Barras larguraRotulo={130} itens={porSistema} /></Card>
          <Card titulo="Reincidências">
            {reinc.length ? reinc.map(([k, s]) => { const [vid, sistema] = k.split('|'); return (
              <Alerta key={k} icone="retorno" cor="vio"><Placa placa={q.veiculo(vid)?.placa} /> <b>{sistema}</b><div className="muted">{s.size} passagens em 90 dias — revisar diagnóstico anterior e qualidade da peça.</div></Alerta>
            ); }) : <div className="muted">Nenhuma reincidência 👍</div>}
          </Card>
        </div>
      </div>
    </>
  );
}

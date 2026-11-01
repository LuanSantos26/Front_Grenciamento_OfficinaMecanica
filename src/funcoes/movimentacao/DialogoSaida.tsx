import { useEffect, useState } from 'react';
import type { Saida } from '../../types';
import { CONFERENCIA_SAIDA } from '../../constants/dominio';
import { agora, num } from '../../utils/formato';
import { totalOS } from '../../utils/calculos';
import { brl } from '../../utils/formato';
import { useOficina } from '../../contexto/OficinaContext';
import { useDetalhe } from '../../contexto/DetalheContext';
import { useConsultas } from '../../hooks/useConsultas';
import { Dialogo } from '../../componentes/ui/Modal';
import { Campo, AreaTexto } from '../../componentes/ui/Campos';
import { Alerta } from '../../componentes/ui/Basicos';
import { AssinaturaPad } from '../../componentes/ui/AssinaturaPad';
import { Placa } from '../../componentes/ui/Tags';
import { MedidorCombustivel } from '../entrada/EtapaVeiculo';
import { UploadFotos } from '../fotos/UploadFotos';

/** Registrar a saída (entrega) do veículo: km, quem retirou, conferência final e fotos */
export function DialogoSaida() {
  const { saidaOsId, fecharSaida, abrir } = useDetalhe();
  const { dados, executar } = useOficina();
  const q = useConsultas();
  const os = saidaOsId ? q.ordem(saidaOsId) : undefined;
  const [s, setS] = useState<Saida>(() => saidaVazia(0));
  const [fotos, setFotos] = useState<{ categoria: 'SAIDA'; descricao: string; src: string }[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => { if (os) { setS(saidaVazia(os.entrada.km)); setFotos([]); setErro(''); } }, [saidaOsId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!os) return null;
  const v = q.veiculo(os.veiculoId);
  const pendentes = os.servicos.filter((x) => !x.feito);
  const marcados = CONFERENCIA_SAIDA.filter((c) => s.conferencia[c]).length;

  async function confirmar() {
    if (!s.retiradoPor.trim()) return setErro('Informe quem está retirando o veículo.');
    if (!s.km || s.km < (os!.entrada.km || 0)) return setErro(`O km de saída não pode ser menor que o de entrada (${num(os!.entrada.km)} km).`);
    const ok = await executar(async (repo) => {
      if (fotos.length) await repo.adicionarFotos(os!.id, fotos);
      await repo.registrarSaida(os!.id, { ...s, data: agora() });
      return true;
    }, `Saída registrada — ${v?.placa} liberado`);
    if (ok) { fecharSaida(); abrir(os!.id, 'progresso'); }
  }

  return (
    <Dialogo aberto titulo={<>Saída do veículo <Placa placa={v?.placa} /> · OS #{os.num}</>} onFechar={fecharSaida} onSalvar={confirmar} rotuloSalvar="Confirmar saída" largura={760}>
      {pendentes.length > 0 && <Alerta icone="defeitos" cor="warn">Há {pendentes.length} serviço(s) não marcados como concluídos: {pendentes.map((x) => x.desc).join(', ')}.</Alerta>}
      {!os.aprovado && os.tipo !== 'Garantia / Retorno' && <Alerta icone="dinheiro" cor="vio">O orçamento desta OS não tem aprovação registrada.</Alerta>}
      <div className="fg" style={{ marginTop: 8 }}>
        <Campo rotulo={`Km de saída * (entrada: ${num(os.entrada.km)})`} type="number" className="mono" valor={s.km || ''} onChange={(x) => setS({ ...s, km: Number(x) })} />
        <Campo rotulo="Retirado por *" valor={s.retiradoPor} placeholder="Nome de quem retirou" onChange={(x) => setS({ ...s, retiradoPor: x })} />
        <Campo rotulo="Documento (RG/CPF/CNH)" valor={s.documento} onChange={(x) => setS({ ...s, documento: x })} />
        <MedidorCombustivel valor={s.combustivel} onChange={(x) => setS({ ...s, combustivel: x })} />
      </div>
      <h4 className="grupo" style={{ marginTop: 14 }}>Conferência de saída <span className="tag">{marcados}/{CONFERENCIA_SAIDA.length}</span></h4>
      <div className="grid g2" style={{ gap: 4 }}>
        {CONFERENCIA_SAIDA.map((c) => (
          <label key={c} className="row ck-linha"><input type="checkbox" checked={!!s.conferencia[c]} onChange={(e) => setS({ ...s, conferencia: { ...s.conferencia, [c]: e.target.checked } })} />{c}</label>
        ))}
      </div>
      <AreaTexto rotulo="Observações da entrega" className="mt" valor={s.obs} placeholder="Recomendações ao cliente, próximos serviços, garantia…" onChange={(x) => setS({ ...s, obs: x })} />
      <h4 className="grupo" style={{ marginTop: 14 }}>Fotos da saída {fotos.length > 0 && <span className="tag">{fotos.length}</span>}</h4>
      <UploadFotos compacto categorias={['SAIDA']} categoriaInicial="SAIDA" onAdicionar={(n) => setFotos((f) => [...f, ...n.map((x) => ({ ...x, categoria: 'SAIDA' as const }))])} />
      {fotos.length > 0 && <div className="photos" style={{ marginTop: 8 }}>{fotos.map((f, i) => <div className="ph" key={i}><img src={f.src} alt="" /></div>)}</div>}
      <h4 className="grupo" style={{ marginTop: 14 }}>Assinatura de quem retirou</h4>
      <AssinaturaPad valor={s.assinatura} onChange={(x) => setS({ ...s, assinatura: x })} />
      <div className="sum tot"><span>Total da OS</span><span>{brl(totalOS(os, dados.funcionarios))}</span></div>
      {erro && <div className="erro-form">{erro}</div>}
    </Dialogo>
  );
}

const saidaVazia = (km: number): Saida => ({ data: '', km, combustivel: 4, retiradoPor: '', documento: '', conferencia: {}, obs: '', assinatura: null });

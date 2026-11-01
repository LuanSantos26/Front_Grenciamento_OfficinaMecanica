import type { RascunhoEntrada } from '../../types';
import { PRIORIDADES, TIPOS_OS, TIPOS_VEICULO } from '../../constants/dominio';
import { normPlaca, num } from '../../utils/formato';
import { useOficina } from '../../contexto/OficinaContext';
import { Campo, Selecao } from '../../componentes/ui/Campos';
import { Alerta } from '../../componentes/ui/Basicos';

type Props = { r: RascunhoEntrada; set: (f: (r: RascunhoEntrada) => void) => void };

/** Passo 1 — identificação do veículo, cliente e condições de chegada */
export function EtapaVeiculo({ r, set }: Props) {
  const { dados } = useOficina();
  const existente = dados.veiculos.find((v) => v.placa === normPlaca(r.veiculo.placa));

  function trocarPlaca(valor: string) {
    const placa = normPlaca(valor).slice(0, 7);
    set((x) => {
      x.veiculo.placa = placa;
      const v = dados.veiculos.find((y) => y.placa === placa);
      if (v) { x.veiculo = { placa, frota: v.frota, tipo: v.tipo, marca: v.marca, modelo: v.modelo, ano: v.ano, chassi: v.chassi }; x.clienteId = v.clienteId; }
    });
  }

  return (
    <>
      <h3>Identificação do veículo</h3>
      <datalist id="placas">{dados.veiculos.map((v) => <option key={v.id} value={v.placa}>{v.marca} {v.modelo}</option>)}</datalist>
      <div className="fg">
        <label className="f">Placa *
          <input className="in mono in-placa" list="placas" value={r.veiculo.placa} placeholder="ABC1D23" onChange={(e) => trocarPlaca(e.target.value)} />
        </label>
        <Campo rotulo="Nº de frota" valor={r.veiculo.frota} onChange={(v) => set((x) => { x.veiculo.frota = v; })} placeholder="ex.: RS-031" />
        <Selecao rotulo="Tipo / configuração" valor={r.veiculo.tipo} opcoes={TIPOS_VEICULO} onChange={(v) => set((x) => { x.veiculo.tipo = v; x.entrada.pneus = {}; })} />
        <Campo rotulo="Marca *" valor={r.veiculo.marca} onChange={(v) => set((x) => { x.veiculo.marca = v; })} placeholder="Scania, Volvo, MB…" />
        <Campo rotulo="Modelo *" valor={r.veiculo.modelo} onChange={(v) => set((x) => { x.veiculo.modelo = v; })} placeholder="R 450" />
        <Campo rotulo="Ano" type="number" valor={r.veiculo.ano} onChange={(v) => set((x) => { x.veiculo.ano = v; })} />
        <Campo rotulo="Chassi (VIN)" className="w2" valor={r.veiculo.chassi} maxLength={17} onChange={(v) => set((x) => { x.veiculo.chassi = v.toUpperCase(); })} />
      </div>
      {existente && (
        <div style={{ marginTop: 12 }}>
          <Alerta icone="check" cor="ok">
            Veículo já cadastrado — dados preenchidos. Último km: <b className="mono">{num(existente.km)}</b> ·{' '}
            {dados.ordens.filter((o) => o.veiculoId === existente.id).length} passagem(ns) pela oficina.
          </Alerta>
        </div>
      )}

      <hr className="s" />
      <h3>Engate</h3>
      <div className="row wrap">
        <label className="row"><input type="checkbox" checked={r.entrada.carreta} onChange={(e) => set((x) => { x.entrada.carreta = e.target.checked; })} /> Entrou com carreta / implemento engatado</label>
        {r.entrada.carreta && <input className="in mono" style={{ width: 180 }} placeholder="Placa da carreta" value={r.entrada.carretaPlaca} onChange={(e) => set((x) => { x.entrada.carretaPlaca = normPlaca(e.target.value); })} />}
      </div>

      <hr className="s" />
      <h3>Cliente e motorista</h3>
      <div className="fg">
        <Selecao rotulo="Cliente *" className="w2" valor={r.clienteId} onChange={(v) => set((x) => { x.clienteId = v; })}
          opcoes={[['', '— selecione —'], ...dados.clientes.map((c) => [c.id, c.nome] as [string, string]), ['novo', '+ Novo cliente']]} />
        <Campo rotulo="Motorista que entregou" valor={r.entrada.motorista} onChange={(v) => set((x) => { x.entrada.motorista = v; })} />
        <Campo rotulo="Telefone do motorista" valor={r.entrada.motoristaTel} onChange={(v) => set((x) => { x.entrada.motoristaTel = v; })} placeholder="(00) 00000-0000" />
      </div>
      {r.clienteId === 'novo' && (
        <div className="fg caixa" style={{ marginTop: 12 }}>
          <Campo rotulo="Razão social / nome *" className="w2" valor={r.novoCliente.nome} onChange={(v) => set((x) => { x.novoCliente.nome = v; })} />
          <Campo rotulo="CNPJ / CPF" valor={r.novoCliente.doc} onChange={(v) => set((x) => { x.novoCliente.doc = v; })} />
          <Campo rotulo="Telefone" valor={r.novoCliente.tel} onChange={(v) => set((x) => { x.novoCliente.tel = v; })} />
          <Campo rotulo="Contato responsável" valor={r.novoCliente.contato} onChange={(v) => set((x) => { x.novoCliente.contato = v; })} />
        </div>
      )}

      <hr className="s" />
      <h3>Condições de chegada</h3>
      <div className="fg">
        <Campo rotulo="Hodômetro (km) *" type="number" className="mono" valor={r.entrada.km || ''} onChange={(v) => set((x) => { x.entrada.km = Number(v); })} />
        <Campo rotulo="Horímetro (h)" type="number" valor={r.entrada.horimetro} onChange={(v) => set((x) => { x.entrada.horimetro = v; })} />
        <MedidorCombustivel valor={r.entrada.combustivel} onChange={(v) => set((x) => { x.entrada.combustivel = v; })} />
        <Selecao rotulo="Tipo de atendimento" valor={r.os.tipo} opcoes={TIPOS_OS} onChange={(v) => set((x) => { x.os.tipo = v; })} />
        <Selecao rotulo="Prioridade" valor={r.os.prioridade} opcoes={PRIORIDADES} onChange={(v) => set((x) => { x.os.prioridade = v as typeof x.os.prioridade; })} />
        <Selecao rotulo="Destino" valor={r.os.box} opcoes={['Pátio', ...dados.boxes]} onChange={(v) => set((x) => { x.os.box = v; })} />
        <Campo rotulo="Previsão de entrega" type="datetime-local" valor={r.os.previsao} onChange={(v) => set((x) => { x.os.previsao = v; })} />
      </div>
    </>
  );
}

export function MedidorCombustivel({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <label className="f wf">Nível de combustível — <b>{valor}/8</b>
      <div className="fuel">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className={`${i < valor ? 'on' : ''} ${valor <= 1 ? 'low' : ''}`} onClick={() => onChange(i + 1)} />
        ))}
      </div>
    </label>
  );
}

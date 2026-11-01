import type { Dados, RascunhoEntrada } from '../../types';
import { entradaVazia } from '../../repositorio/seed';
import { normPlaca } from '../../utils/formato';

export const PASSOS = ['Veículo e cliente', 'Reclamações', 'Checklist', 'Pneus', 'Avarias', 'Fotos', 'Revisão e assinatura'];

export const novoRascunho = (): RascunhoEntrada => ({
  passo: 0,
  veiculo: { placa: '', frota: '', tipo: 'Cavalo mecânico 6x2', marca: '', modelo: '', ano: '', chassi: '' },
  clienteId: '',
  novoCliente: { nome: '', doc: '', tel: '', contato: '' },
  entrada: entradaVazia(0, 4),
  os: { tipo: 'Corretiva', prioridade: 'Normal', box: 'Pátio', previsao: '' },
  reclamacoes: [{ texto: '', sistema: 'Motor', quando: 'Sempre', sev: 'Média', dtc: '' }],
  fotos: [],
});

/** Copia o rascunho para atualização imutável (as fotos são reaproveitadas, não clonadas) */
export const clonar = (r: RascunhoEntrada): RascunhoEntrada => ({ ...structuredClone({ ...r, fotos: [] }), fotos: r.fotos });

/** Regras de validação de cada passo. Devolve a mensagem de erro ou null. */
export function validarPasso(passo: number, r: RascunhoEntrada, dados: Dados, modoApi: boolean): string | null {
  const existente = dados.veiculos.find((v) => v.placa === normPlaca(r.veiculo.placa));
  if (passo === 0) {
    if (normPlaca(r.veiculo.placa).length < 7) return 'Informe a placa completa (7 caracteres).';
    if (!r.clienteId) return 'Selecione o cliente.';
    if (r.clienteId === 'novo' && !r.novoCliente.nome.trim()) return 'Informe o nome do novo cliente.';
    if (modoApi && r.clienteId === 'novo' && !r.novoCliente.doc.trim()) return 'CPF/CNPJ é obrigatório para cadastrar o cliente na API.';
    if (!existente && (!r.veiculo.marca.trim() || !r.veiculo.modelo.trim())) return 'Informe marca e modelo do veículo.';
    if (!r.entrada.km) return 'Informe o hodômetro (km).';
    if (existente && Number(r.entrada.km) < existente.km) return `Hodômetro menor que o último registrado (${existente.km.toLocaleString('pt-BR')} km). Confira.`;
    if (existente && dados.ordens.some((o) => o.veiculoId === existente.id && o.status !== 'Entregue')) return 'Este veículo já tem uma OS aberta. Finalize-a ou lance o serviço nela.';
  }
  if (passo === 1 && !r.reclamacoes.some((x) => x.texto.trim())) return 'Registre pelo menos uma reclamação ou serviço solicitado.';
  return null;
}

import type { Dados, Funcionario, OrdemServico, Servico } from '../types';

export const valorServico = (s: Servico, funcionarios: Funcionario[]) =>
  s.valor ?? (s.horas || 0) * (funcionarios.find((f) => f.id === s.mecId)?.valorHora || 150);

export const totalMaoDeObra = (o: OrdemServico, funcionarios: Funcionario[]) =>
  o.servicos.reduce((a, s) => a + valorServico(s, funcionarios), 0);

export const totalPecas = (o: OrdemServico) => o.pecas.reduce((a, p) => a + p.qtd * p.valorUnit, 0);

export const totalOS = (o: OrdemServico, funcionarios: Funcionario[]) =>
  o.itensOk === false ? o.apiTotal || 0 : totalMaoDeObra(o, funcionarios) + totalPecas(o);

export const abertas = (d: Dados) => d.ordens.filter((o) => o.status !== 'Entregue');

export const atrasada = (o: OrdemServico) =>
  !!o.previsao && new Date(o.previsao) < new Date() && !['Pronto p/ retirada', 'Entregue'].includes(o.status);

/** Percentual de avanço da OS: etapa atual + serviços concluídos */
export function percentualOS(o: OrdemServico) {
  const etapas = ['Aguardando diagnóstico', 'Em diagnóstico', 'Aguardando aprovação', 'Aguardando peças', 'Em execução', 'Controle de qualidade', 'Pronto p/ retirada', 'Entregue'];
  const i = etapas.indexOf(o.status);
  if (o.status === 'Entregue') return 100;
  const base = (i / (etapas.length - 1)) * 100;
  if (o.status === 'Em execução' && o.servicos.length) {
    const feitos = o.servicos.filter((s) => s.feito).length / o.servicos.length;
    return Math.round(base + feitos * (100 / (etapas.length - 1)));
  }
  return Math.round(base);
}

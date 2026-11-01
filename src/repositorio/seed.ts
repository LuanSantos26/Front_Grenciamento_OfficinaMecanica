import type { Dados, Entrada, EtapaProgresso, OrdemServico, StatusOS } from '../types';
import { STATUS } from '../constants/dominio';
import { diasAFrente, diasAtras, uid } from '../utils/formato';

export const entradaVazia = (km = 0, combustivel = 4): Entrada => ({
  km, horimetro: '', combustivel, motorista: '', motoristaTel: '', checklist: {}, ckObs: {}, pneus: {}, avarias: [],
  obs: '', pertences: '', assinatura: null, carreta: false, carretaPlaca: '',
});

/** Gera o histórico de etapas até o status atual, espaçado entre a abertura e agora */
function progressoAte(status: StatusOS, abertura: string, fim?: string): EtapaProgresso[] {
  const i = STATUS.indexOf(status);
  const ini = new Date(abertura).getTime();
  const ate = fim ? new Date(fim).getTime() : Date.now();
  const passos = [0, 1, 2, 4, 5, 6, 7].filter((k) => k <= i);
  if (!passos.includes(i)) passos.push(i);
  return passos.map((k, n) => ({ status: STATUS[k], data: new Date(ini + ((ate - ini) * n) / Math.max(1, passos.length)).toISOString() }));
}

export function dadosDeExemplo(): Dados {
  const funcionarios = [
    { id: 'm1', nome: 'Carlos Mendes', cargo: 'Mecânico diesel — motor/injeção', valorHora: 180 },
    { id: 'm2', nome: 'Rafael Souza', cargo: 'Mecânico — freios/suspensão', valorHora: 150 },
    { id: 'm3', nome: 'Anderson Lima', cargo: 'Eletricista automotivo', valorHora: 190 },
    { id: 'm4', nome: 'Paulo Henrique', cargo: 'Mecânico — transmissão/diferencial', valorHora: 170 },
    { id: 'm5', nome: 'Diego Rocha', cargo: 'Funileiro / geral', valorHora: 120 },
  ];
  const clientes = [
    { id: 'c1', nome: 'Transportadora Rota Sul Ltda', doc: '12.345.678/0001-90', tel: '(51) 3333-4400', contato: 'Marcos (frota)', tipo: 'Frotista', prazo: '28 dias' },
    { id: 'c2', nome: 'Agro Cerrado Logística', doc: '98.765.432/0001-10', tel: '(64) 3621-8800', contato: 'Juliana (manutenção)', tipo: 'Frotista', prazo: '21 dias' },
    { id: 'c3', nome: 'José Ferreira da Silva', doc: '123.456.789-00', tel: '(11) 98888-1234', contato: 'Próprio', tipo: 'Autônomo', prazo: 'À vista' },
  ];
  const veiculos = [
    { id: 'v1', placa: 'RST4A21', frota: 'RS-031', clienteId: 'c1', tipo: 'Cavalo mecânico 6x2', marca: 'Scania', modelo: 'R 450', ano: '2021', chassi: '9BSR6X200M3912345', km: 412300, ultRevKm: 400000, intRev: 40000 },
    { id: 'v2', placa: 'QAZ7B88', frota: 'RS-044', clienteId: 'c1', tipo: 'Cavalo mecânico 6x4', marca: 'Volvo', modelo: 'FH 540', ano: '2022', chassi: '9BVAG30D0NE776655', km: 288900, ultRevKm: 250000, intRev: 40000 },
    { id: 'v3', placa: 'GOI2C45', frota: 'AC-12', clienteId: 'c2', tipo: 'Cavalo mecânico 6x4', marca: 'Mercedes-Benz', modelo: 'Actros 2651', ano: '2020', chassi: '9BM963404LB112233', km: 530120, ultRevKm: 520000, intRev: 30000 },
    { id: 'v4', placa: 'GOI9D10', frota: 'AC-27', clienteId: 'c2', tipo: 'Truck 6x2', marca: 'Volkswagen', modelo: 'Constellation 24.280', ano: '2019', chassi: '9532N8247KR445566', km: 615400, ultRevKm: 590000, intRev: 25000 },
    { id: 'v5', placa: 'FJS3E77', frota: '', clienteId: 'c3', tipo: 'Toco 4x2', marca: 'Iveco', modelo: 'Tector 11-190', ano: '2017', chassi: '93ZA1RFH0H8998877', km: 701500, ultRevKm: 690000, intRev: 20000 },
    { id: 'v6', placa: 'RSU8F12', frota: 'RS-050', clienteId: 'c1', tipo: 'Cavalo mecânico 6x2', marca: 'DAF', modelo: 'XF 530', ano: '2023', chassi: 'XLRTE47MS0E123456', km: 198000, ultRevKm: 160000, intRev: 40000 },
  ];
  const estoque = [
    { id: 'p1', cod: 'SC-1873016', desc: 'Filtro de óleo lubrificante', apl: 'Scania DC13', qtd: 14, min: 6, custo: 98, venda: 165 },
    { id: 'p2', cod: 'VO-21479', desc: 'Lona de freio (jogo eixo)', apl: 'Volvo FH', qtd: 3, min: 4, custo: 420, venda: 690 },
    { id: 'p3', cod: 'MB-A0004', desc: 'Bolsa de ar suspensão traseira', apl: 'Actros', qtd: 2, min: 2, custo: 780, venda: 1190 },
    { id: 'p4', cod: 'UNI-ARLA20', desc: 'ARLA 32 (balde 20 L)', apl: 'Universal', qtd: 22, min: 10, custo: 62, venda: 95 },
    { id: 'p5', cod: 'UNI-15W40', desc: 'Óleo motor 15W40 CK-4 (litro)', apl: 'Universal diesel', qtd: 180, min: 80, custo: 24, venda: 39 },
    { id: 'p6', cod: 'VW-KIT-EMB', desc: 'Kit de embreagem 430 mm', apl: 'Constellation', qtd: 1, min: 1, custo: 3900, venda: 5650 },
    { id: 'p7', cod: 'BOS-0445', desc: 'Bico injetor common rail', apl: 'Cummins ISL / MWM', qtd: 0, min: 2, custo: 1850, venda: 2790 },
    { id: 'p8', cod: 'UNI-LAMP-H7', desc: 'Lâmpada H7 24V', apl: 'Universal', qtd: 30, min: 10, custo: 14, venda: 29 },
    { id: 'p9', cod: 'WAB-VALV', desc: 'Válvula relé de freio', apl: 'Wabco', qtd: 4, min: 2, custo: 540, venda: 860 },
    { id: 'p10', cod: 'SC-SENS-NOX', desc: 'Sensor NOx', apl: 'Scania Euro 6', qtd: 1, min: 1, custo: 2600, venda: 3890 },
    { id: 'p11', cod: 'UNI-FILT-COMB', desc: 'Filtro de combustível separador', apl: 'Universal diesel', qtd: 12, min: 6, custo: 85, venda: 140 },
  ];
  const peca = (pid: string, qtd: number, quando: string, mecId?: string) => {
    const p = estoque.find((x) => x.id === pid)!;
    return { id: uid(), pecaId: pid, cod: p.cod, desc: p.desc, qtd, valorUnit: p.venda, custoUnit: p.custo, mecId, data: quando };
  };
  const rec = (texto: string, sistema: string, sev: string, status: 'Aberta' | 'Diagnosticada' | 'Resolvida', causa = '', quando = 'Sempre', dtc = '', dataR = diasAtras(1)) =>
    ({ id: uid(), texto, sistema, quando, sev, dtc, status, causa, data: dataR });

  type Base = Omit<OrdemServico, 'progresso' | 'saida' | 'hist'> & { hist?: OrdemServico['hist']; saida?: OrdemServico['saida'] };
  const montar = (o: Base): OrdemServico => ({
    ...o,
    saida: o.saida ?? null,
    hist: o.hist ?? [{ d: o.abertura, t: `Veículo recebido · ${o.entrada.km.toLocaleString('pt-BR')} km` }],
    progresso: progressoAte(o.status, o.abertura, o.saida?.data),
  });
  const saida = (dataS: string, km: number, por: string) => ({
    data: dataS, km, combustivel: 5, retiradoPor: por, documento: '', obs: '', assinatura: null,
    conferencia: { 'Todos os serviços da OS conferidos': true, 'Teste de rodagem realizado': true },
  });

  const ordens: OrdemServico[] = [
    montar({ id: 'o1', num: 1041, veiculoId: 'v1', clienteId: 'c1', tipo: 'Corretiva', status: 'Em execução', prioridade: 'Alta', box: 'Box 2',
      entrada: { ...entradaVazia(412300, 5), motorista: 'Gilmar Pereira' }, abertura: diasAtras(1, 5), previsao: diasAFrente(0, 6),
      reclamacoes: [rec('Perda de potência em subida e luz de anomalia acesa no painel', 'Injeção / Pós-tratamento (ARLA)', 'Alta', 'Diagnosticada', 'Sensor NOx de saída com leitura incoerente', 'Em carga / subida', 'P20EE, P2BAD', diasAtras(1, 5))],
      diagnostico: 'Scanner indicou falha de eficiência do SCR. Teste de dosagem OK. Sensor NOx pós-catalisador com sinal travado.',
      servicos: [
        { id: uid(), desc: 'Diagnóstico eletrônico com scanner', sistema: 'Elétrica / Eletrônica', horas: 1.5, mecId: 'm3', feito: true },
        { id: uid(), desc: 'Substituição do sensor NOx', sistema: 'Injeção / Pós-tratamento (ARLA)', horas: 2, mecId: 'm1', feito: false },
      ],
      pecas: [peca('p10', 1, diasAtras(0, 18), 'm1'), peca('p4', 1, diasAtras(0, 18), 'm1')],
      aprovado: { data: diasAtras(0, 20), por: 'Marcos (frota) — WhatsApp' } }),
    montar({ id: 'o2', num: 1042, veiculoId: 'v3', clienteId: 'c2', tipo: 'Corretiva', status: 'Aguardando peças', prioridade: 'Crítica', box: 'Box 4',
      entrada: { ...entradaVazia(530120, 3), motorista: 'Edson Batista' }, abertura: diasAtras(2, 2), previsao: diasAFrente(1),
      reclamacoes: [
        rec('Veículo arriando do lado esquerdo traseiro, alarme de pressão baixa', 'Suspensão', 'Crítica (imobiliza)', 'Diagnosticada', 'Bolsa de ar furada no 2º eixo LE', 'Sempre', '', diasAtras(2, 2)),
        rec('Ruído metálico ao frear em baixa velocidade', 'Freios / Pneumático', 'Média', 'Aberta', '', 'Ao frear', '', diasAtras(2, 2)),
      ],
      diagnostico: 'Bolsa de ar traseira LE rompida. Aguardando 2ª unidade do fornecedor para trocar o par.',
      servicos: [{ id: uid(), desc: 'Troca de bolsas de ar (par) 2º eixo', sistema: 'Suspensão', horas: 3, mecId: 'm2', feito: false }],
      pecas: [peca('p3', 2, diasAtras(1, 9), 'm2')], aprovado: { data: diasAtras(1, 10), por: 'Juliana — e-mail' } }),
    montar({ id: 'o3', num: 1043, veiculoId: 'v2', clienteId: 'c1', tipo: 'Preventiva', status: 'Aguardando aprovação', prioridade: 'Normal', box: 'Box 1',
      entrada: { ...entradaVazia(288900, 6), motorista: 'Luiz Carlos' }, abertura: diasAtras(0, 9), previsao: diasAFrente(1),
      reclamacoes: [rec('Revisão de 40.000 km + verificar freio puxando para a direita', 'Freios / Pneumático', 'Média', 'Diagnosticada', 'Lonas do eixo de tração no limite', 'Ao frear', '', diasAtras(0, 9))],
      diagnostico: 'Revisão programada. Lonas de freio com 3 mm. Recomendada troca do jogo do eixo de tração.',
      servicos: [
        { id: uid(), desc: 'Revisão 40.000 km (troca de óleo e filtros)', sistema: 'Motor', horas: 3, mecId: 'm1', feito: false },
        { id: uid(), desc: 'Substituição de lonas de freio — tração', sistema: 'Freios / Pneumático', horas: 4, mecId: 'm2', feito: false },
      ],
      pecas: [peca('p5', 38, diasAtras(0, 5), 'm1'), peca('p2', 1, diasAtras(0, 5), 'm2')], aprovado: null }),
    montar({ id: 'o4', num: 1044, veiculoId: 'v4', clienteId: 'c2', tipo: 'Garantia / Retorno', status: 'Em diagnóstico', prioridade: 'Alta', box: 'Box 3',
      entrada: { ...entradaVazia(615400, 4), motorista: 'Wellington' }, abertura: diasAtras(0, 4), previsao: diasAFrente(0, 10), retornoDe: 1029,
      reclamacoes: [rec('Embreagem patinando novamente — trocada há 25 dias nesta oficina', 'Transmissão / Embreagem', 'Alta', 'Aberta', '', 'Em carga / subida', '', diasAtras(0, 4))],
      diagnostico: '', servicos: [], pecas: [], aprovado: null }),
    montar({ id: 'o5', num: 1045, veiculoId: 'v5', clienteId: 'c3', tipo: 'Corretiva', status: 'Aguardando diagnóstico', prioridade: 'Normal', box: 'Pátio',
      entrada: { ...entradaVazia(701500, 2), motorista: 'José Ferreira' }, abertura: diasAtras(0, 1), previsao: diasAFrente(2),
      reclamacoes: [rec('Fumaça preta e falha na partida a frio', 'Motor', 'Média', 'Aberta', '', 'Motor frio', '', diasAtras(0, 1))],
      diagnostico: '', servicos: [], pecas: [], aprovado: null }),
    montar({ id: 'o6', num: 1040, veiculoId: 'v1', clienteId: 'c1', tipo: 'Preventiva', status: 'Pronto p/ retirada', prioridade: 'Normal', box: 'Box 5',
      entrada: entradaVazia(400010, 7), abertura: diasAtras(3), previsao: diasAtras(0, 3),
      reclamacoes: [rec('Revisão de 400.000 km', 'Motor', 'Baixa', 'Resolvida', '—', 'Sempre', '', diasAtras(3))],
      diagnostico: 'Revisão concluída.', servicos: [{ id: uid(), desc: 'Revisão completa 400.000 km', sistema: 'Motor', horas: 6, mecId: 'm1', feito: true }],
      pecas: [peca('p1', 2, diasAtras(2), 'm1'), peca('p5', 40, diasAtras(2), 'm1'), peca('p11', 2, diasAtras(2), 'm1')], aprovado: { data: diasAtras(3), por: 'Contrato de preventiva' } }),
    montar({ id: 'o7', num: 1029, veiculoId: 'v4', clienteId: 'c2', tipo: 'Corretiva', status: 'Entregue', prioridade: 'Normal', box: '',
      entrada: entradaVazia(598000, 4), abertura: diasAtras(27), previsao: diasAtras(25), saida: saida(diasAtras(25), 598012, 'Wellington'),
      reclamacoes: [rec('Embreagem patinando', 'Transmissão / Embreagem', 'Alta', 'Resolvida', 'Disco gasto', 'Em carga / subida', '', diasAtras(27))],
      diagnostico: 'Kit de embreagem substituído.', servicos: [{ id: uid(), desc: 'Troca do kit de embreagem', sistema: 'Transmissão / Embreagem', horas: 8, mecId: 'm4', feito: true }],
      pecas: [peca('p6', 1, diasAtras(26), 'm4')], aprovado: { data: diasAtras(27), por: 'Juliana' } }),
    montar({ id: 'o8', num: 1036, veiculoId: 'v6', clienteId: 'c1', tipo: 'Preventiva', status: 'Entregue', prioridade: 'Normal', box: '',
      entrada: entradaVazia(197950, 6), abertura: diasAtras(6, 3), previsao: diasAtras(5), saida: saida(diasAtras(5, 2), 197962, 'Sérgio (motorista)'),
      reclamacoes: [rec('Revisão + lâmpadas queimadas', 'Elétrica / Eletrônica', 'Baixa', 'Resolvida', 'Lâmpadas no fim da vida útil', 'Sempre', '', diasAtras(6, 3))],
      diagnostico: 'Revisão e troca de lâmpadas.', servicos: [{ id: uid(), desc: 'Revisão 160.000 km', sistema: 'Motor', horas: 4, mecId: 'm1', feito: true }, { id: uid(), desc: 'Troca de lâmpadas H7', sistema: 'Elétrica / Eletrônica', horas: 0.5, mecId: 'm3', feito: true }],
      pecas: [peca('p1', 1, diasAtras(6), 'm1'), peca('p5', 36, diasAtras(6), 'm1'), peca('p8', 4, diasAtras(6), 'm3')], aprovado: { data: diasAtras(6), por: 'Contrato de preventiva' } }),
    montar({ id: 'o9', num: 1038, veiculoId: 'v2', clienteId: 'c1', tipo: 'Corretiva', status: 'Entregue', prioridade: 'Alta', box: '',
      entrada: entradaVazia(286500, 3), abertura: diasAtras(9, 6), previsao: diasAtras(8), saida: saida(diasAtras(8, 1), 286520, 'Luiz Carlos'),
      reclamacoes: [rec('Vazamento de ar no circuito de freio', 'Freios / Pneumático', 'Alta', 'Resolvida', 'Válvula relé com diafragma rompido', 'Sempre', '', diasAtras(9, 6))],
      diagnostico: 'Válvula relé substituída.', servicos: [{ id: uid(), desc: 'Troca de válvula relé', sistema: 'Freios / Pneumático', horas: 2, mecId: 'm2', feito: true }],
      pecas: [peca('p9', 1, diasAtras(9), 'm2')], aprovado: { data: diasAtras(9), por: 'Marcos (frota)' } }),
  ];
  return {
    funcionarios, clientes, veiculos, estoque, ordens, fotos: [], seq: 1046,
    boxes: ['Box 1', 'Box 2', 'Box 3', 'Box 4', 'Box 5', 'Box 6 (valeta)', 'Box 7 (elétrica)', 'Rampa de lavagem'],
  };
}

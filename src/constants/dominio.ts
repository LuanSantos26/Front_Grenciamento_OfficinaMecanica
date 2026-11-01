import type { CategoriaFoto, Prioridade, StatusOS } from '../types';

export const STATUS: StatusOS[] = [
  'Aguardando diagnóstico', 'Em diagnóstico', 'Aguardando aprovação', 'Aguardando peças',
  'Em execução', 'Controle de qualidade', 'Pronto p/ retirada', 'Entregue',
];

export const COR_STATUS: Record<StatusOS, string> = {
  'Aguardando diagnóstico': 'var(--tx3)',
  'Em diagnóstico': 'var(--info)',
  'Aguardando aprovação': 'var(--vio)',
  'Aguardando peças': 'var(--warn)',
  'Em execução': 'var(--ac)',
  'Controle de qualidade': '#38c6c6',
  'Pronto p/ retirada': 'var(--ok)',
  'Entregue': 'var(--tx3)',
};

export const PRIORIDADES: Prioridade[] = ['Baixa', 'Normal', 'Alta', 'Crítica'];
export const TIPOS_OS = ['Corretiva', 'Preventiva', 'Garantia / Retorno', 'Socorro / Guincho', 'Revisão de concessionária', 'Inspeção / Laudo'];
export const SISTEMAS = [
  'Motor', 'Injeção / Pós-tratamento (ARLA)', 'Arrefecimento', 'Freios / Pneumático', 'Suspensão', 'Direção',
  'Transmissão / Embreagem', 'Diferencial / Eixos', 'Elétrica / Eletrônica', 'Cabine / Carroceria', 'Pneus / Rodas',
  'Quinta roda / Engate', 'Ar-condicionado', 'Implemento / Carreta',
];
export const SEVERIDADES = ['Baixa', 'Média', 'Alta', 'Crítica (imobiliza)'];
export const QUANDO_OCORRE = ['Sempre', 'Motor frio', 'Motor quente', 'Em carga / subida', 'Em alta velocidade', 'Ao frear', 'Ao fazer curvas', 'Em marcha lenta', 'Intermitente'];
export const TIPOS_VEICULO = ['Cavalo mecânico 4x2', 'Cavalo mecânico 6x2', 'Cavalo mecânico 6x4', 'Truck 6x2', 'Toco 4x2', 'Bitruck 8x2', 'Ônibus', 'Semirreboque / Carreta', 'Van / Utilitário'];

export const TIPOS_AVARIA = ['Amassado', 'Risco', 'Trinca', 'Quebrado', 'Ferrugem', 'Faltando', 'Vazamento'];
export const COR_AVARIA: Record<string, string> = {
  Amassado: '#f0a020', Risco: '#4aa3ff', Trinca: '#ef4f4f', Quebrado: '#ef4f4f', Ferrugem: '#b9773a', Faltando: '#a77bff', Vazamento: '#2fbf71',
};

export const CHECKLIST: Record<string, string[]> = {
  'Cabine e painel': ['Luzes de alerta no painel', 'Tacógrafo (disco/digital)', 'Buzina', 'Limpador e lavador', 'Retrovisores', 'Cintos de segurança', 'Para-brisa e vidros', 'Bancos e estofamento', 'Ar-condicionado'],
  'Iluminação e sinalização': ['Faróis (baixo/alto)', 'Lanternas', 'Setas e pisca-alerta', 'Luz de freio', 'Luz de ré e alarme sonoro', 'Faixas refletivas'],
  'Motor e fluidos': ['Nível do óleo do motor', 'Líquido de arrefecimento', 'Vazamentos aparentes', 'Correias e polias', 'Nível de ARLA 32', 'Indicador do filtro de ar', 'Fluido da direção hidráulica'],
  'Freios e sistema pneumático': ['Pressão de ar (manômetros)', 'Drenagem dos reservatórios', 'Freio de estacionamento', 'Mangueiras e engates (cuíca)', 'Lonas / pastilhas (visual)'],
  'Chassi e suspensão': ['Feixes de molas', 'Bolsas de ar', 'Amortecedores', 'Quinta roda / pino-rei', 'Para-lamas e para-barro', 'Para-choque e protetor lateral'],
  'Itens obrigatórios / pertences': ['Extintor (dentro da validade)', 'Triângulo', 'Macaco', 'Chave de roda', 'Estepe', 'CRLV / documentos', 'Cartão do tacógrafo'],
};

/** Conferência feita na saída do veículo */
export const CONFERENCIA_SAIDA = [
  'Todos os serviços da OS conferidos',
  'Teste de rodagem realizado',
  'Sem vazamentos após o serviço',
  'Painel sem luzes de alerta',
  'Peças substituídas entregues/mostradas ao cliente',
  'Pertences devolvidos',
  'Veículo limpo (cabine e volante)',
];

export const CATEGORIAS_FOTO: { id: CategoriaFoto; nome: string; dica: string }[] = [
  { id: 'VEICULO', nome: 'Veículo (entrada)', dica: 'Frente, laterais, traseira e painel com o km' },
  { id: 'PROBLEMA', nome: 'Problema / defeito', dica: 'Vazamento, peça quebrada, tela do scanner, desgaste' },
  { id: 'SERVICO', nome: 'Durante o serviço', dica: 'Desmontagem, medições, montagem' },
  { id: 'PECA', nome: 'Peça substituída', dica: 'Peça velha ao lado da nova — prova para o cliente' },
  { id: 'SAIDA', nome: 'Saída / entrega', dica: 'Veículo pronto e painel com o km de saída' },
];

export const CONFIG_PNEUS: Record<string, [string, string[]][]> = {
  '4x2': [['Dianteiro', ['E', 'D']], ['Tração', ['EE', 'EI', 'DI', 'DE']]],
  '6x2': [['Dianteiro', ['E', 'D']], ['Tração', ['EE', 'EI', 'DI', 'DE']], ['Auxiliar', ['EE', 'EI', 'DI', 'DE']]],
  '6x4': [['Dianteiro', ['E', 'D']], ['Tração 1', ['EE', 'EI', 'DI', 'DE']], ['Tração 2', ['EE', 'EI', 'DI', 'DE']]],
  '8x2': [['Dianteiro 1', ['E', 'D']], ['Dianteiro 2', ['E', 'D']], ['Tração', ['EE', 'EI', 'DI', 'DE']], ['Auxiliar', ['EE', 'EI', 'DI', 'DE']]],
  'Carreta 3 eixos': [['Eixo 1', ['EE', 'EI', 'DI', 'DE']], ['Eixo 2', ['EE', 'EI', 'DI', 'DE']], ['Eixo 3', ['EE', 'EI', 'DI', 'DE']]],
};

export const configPneus = (tipo: string) =>
  /6x4/.test(tipo) ? '6x4' : /8x2|Bitruck/.test(tipo) ? '8x2' : /6x2|Truck/.test(tipo) ? '6x2' : /Carreta|Semirreboque/.test(tipo) ? 'Carreta 3 eixos' : '4x2';

/** Correspondência entre as etapas do front e o enum StatusOS do back-end */
export const PARA_ENUM = (s: StatusOS): string =>
  s === 'Entregue' ? 'FINALIZADA'
    : s === 'Aguardando peças' ? 'AGUARDANDO_PECA'
    : ['Em execução', 'Controle de qualidade', 'Pronto p/ retirada'].includes(s) ? 'EM_ANDAMENTO'
    : 'ABERTA';

export const DO_ENUM: Record<string, StatusOS> = {
  ABERTA: 'Aguardando diagnóstico', EM_ANDAMENTO: 'Em execução', AGUARDANDO_PECA: 'Aguardando peças', FINALIZADA: 'Entregue',
};

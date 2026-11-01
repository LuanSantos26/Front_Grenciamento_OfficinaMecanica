// Tipos de domínio da oficina. Espelham as entidades do back-end Spring
// (Cliente, Funcionario, Veiculo, OrdemServico, ItemServico, FotoOS, HistoricoStatusOS)
// e acrescentam o que ainda só existe no front (checklist, pneus, avarias…).

export type StatusOS =
  | 'Aguardando diagnóstico'
  | 'Em diagnóstico'
  | 'Aguardando aprovação'
  | 'Aguardando peças'
  | 'Em execução'
  | 'Controle de qualidade'
  | 'Pronto p/ retirada'
  | 'Entregue';

export type Prioridade = 'Baixa' | 'Normal' | 'Alta' | 'Crítica';
export type StatusChecklist = 'OK' | 'Atenção' | 'Avaria' | 'N/A';
export type StatusReclamacao = 'Aberta' | 'Diagnosticada' | 'Resolvida' | 'Não procede';
export type CategoriaFoto = 'VEICULO' | 'PROBLEMA' | 'SERVICO' | 'PECA' | 'SAIDA';

export interface Cliente {
  id: string;
  nome: string;
  doc: string;
  tel: string;
  contato: string;
  tipo: string;
  prazo: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  valorHora: number;
}

export interface Veiculo {
  id: string;
  placa: string;
  frota: string;
  clienteId: string;
  tipo: string;
  marca: string;
  modelo: string;
  ano: string;
  chassi: string;
  km: number;
  ultRevKm: number;
  intRev: number;
}

export interface PecaEstoque {
  id: string;
  cod: string;
  desc: string;
  apl: string;
  qtd: number;
  min: number;
  custo: number;
  venda: number;
}

export interface Reclamacao {
  id: string;
  texto: string;
  sistema: string;
  quando: string;
  sev: string;
  dtc: string;
  status: StatusReclamacao;
  causa: string;
  solucao?: string;
  data: string;
}

export interface Servico {
  id: string;
  desc: string;
  sistema: string;
  horas: number | null;
  mecId: string;
  feito: boolean;
  /** valor fechado (vem da API); se ausente, é horas × valor-hora do mecânico */
  valor?: number;
  data?: string;
}

/** Peça aplicada em uma OS — base do relatório "Peças utilizadas" */
export interface PecaUsada {
  id: string;
  pecaId: string | null;
  cod: string;
  desc: string;
  qtd: number;
  valorUnit: number;
  custoUnit?: number;
  mecId?: string;
  data: string;
}

export interface Foto {
  id: string;
  osId: string;
  categoria: CategoriaFoto;
  descricao: string;
  data: string;
  /** dataURL (salva no navegador) ou URL do arquivo na API */
  src: string;
  origem: 'local' | 'api';
}

export interface EtapaProgresso {
  status: StatusOS;
  data: string;
  obs?: string;
}

export interface MarcaAvaria {
  x: number;
  y: number;
  tipo: string;
  obs: string;
}

export interface MedicaoPneu {
  sulco: string;
  pressao: string;
  marca: string;
  dot: string;
  estado: string;
}

export interface Entrada {
  km: number;
  horimetro: string;
  combustivel: number;
  motorista: string;
  motoristaTel: string;
  checklist: Record<string, StatusChecklist>;
  ckObs: Record<string, string>;
  pneus: Record<string, MedicaoPneu>;
  avarias: MarcaAvaria[];
  obs: string;
  pertences: string;
  assinatura: string | null;
  carreta: boolean;
  carretaPlaca: string;
}

export interface Saida {
  data: string;
  km: number;
  combustivel: number;
  retiradoPor: string;
  documento: string;
  conferencia: Record<string, boolean>;
  obs: string;
  assinatura: string | null;
}

export interface Aprovacao {
  data: string;
  por: string;
}

export interface Historico {
  d: string;
  t: string;
}

export interface OrdemServico {
  id: string;
  num: number;
  veiculoId: string;
  clienteId: string;
  tipo: string;
  status: StatusOS;
  prioridade: Prioridade;
  box: string;
  abertura: string;
  previsao: string;
  entrada: Entrada;
  saida: Saida | null;
  retornoDe?: number;
  reclamacoes: Reclamacao[];
  diagnostico: string;
  servicos: Servico[];
  pecas: PecaUsada[];
  progresso: EtapaProgresso[];
  aprovado: Aprovacao | null;
  hist: Historico[];
  /** só no modo API: total vindo do back-end quando ele não lista os itens */
  apiTotal?: number;
  itensOk?: boolean;
}

export interface Dados {
  clientes: Cliente[];
  funcionarios: Funcionario[];
  veiculos: Veiculo[];
  estoque: PecaEstoque[];
  ordens: OrdemServico[];
  fotos: Foto[];
  boxes: string[];
  seq: number;
}

/** Rascunho preenchido no assistente de entrada de veículo */
export interface RascunhoEntrada {
  passo: number;
  veiculo: { placa: string; frota: string; tipo: string; marca: string; modelo: string; ano: string; chassi: string };
  clienteId: string;
  novoCliente: { nome: string; doc: string; tel: string; contato: string };
  entrada: Entrada;
  os: { tipo: string; prioridade: Prioridade; box: string; previsao: string };
  reclamacoes: { texto: string; sistema: string; quando: string; sev: string; dtc: string }[];
  fotos: { categoria: CategoriaFoto; descricao: string; src: string }[];
}

export interface RecursosApi {
  itens: boolean;
  status: boolean;
  fotos: boolean;
  historico: boolean;
}

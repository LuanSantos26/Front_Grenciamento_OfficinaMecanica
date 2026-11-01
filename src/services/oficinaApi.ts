import type { Http } from './http';

// Formato JSON devolvido pelas entidades JPA do repositório Gerenciador_Oficina
export interface ClienteApi { id: number; nomeOuRazaoSocial: string; cpfOuCnpj: string; telefone?: string }
export interface FuncionarioApi { id: number; nome: string; cargo: string }
export interface VeiculoApi { id: number; placa: string; marca: string; modelo: string; anoFabricacao?: number; chassi?: string; cliente?: ClienteApi }
export interface OrdemServicoApi {
  id: number; veiculo?: VeiculoApi; defeitoRelatado: string; dataEntrada: string; dataSaida?: string | null;
  valorTotal: number; status: string; kmEntrada?: number | null; kmSaida?: number | null; retiradoPor?: string | null;
}
export interface ItemServicoApi {
  id: number; descricao: string; valor: number; funcionario?: FuncionarioApi;
  tipo?: 'PECA' | 'MAO_DE_OBRA'; quantidade?: number; codigoPeca?: string | null; dataLancamento?: string;
}
export interface FotoApi { id: number; categoria: string; descricao?: string; dataEnvio: string }
export interface HistoricoApi { id: number; status: string; dataHora: string; observacao?: string }

/** Todas as chamadas à API ficam aqui — as telas nunca chamam fetch diretamente. */
export function oficinaApi(http: Http) {
  const os = '/api/ordens-servico';
  return {
    listarClientes: () => http.get<ClienteApi[]>('/api/clientes'),
    cadastrarCliente: (c: Omit<ClienteApi, 'id'>) => http.post<ClienteApi>('/api/clientes', c),
    listarFuncionarios: () => http.get<FuncionarioApi[]>('/api/funcionarios'),
    cadastrarFuncionario: (f: Omit<FuncionarioApi, 'id'>) => http.post<FuncionarioApi>('/api/funcionarios', f),
    listarVeiculos: () => http.get<VeiculoApi[]>('/api/veiculos'),
    cadastrarVeiculo: (clienteId: number, v: Omit<VeiculoApi, 'id' | 'cliente'>) => http.post<VeiculoApi>(`/api/veiculos/${clienteId}`, v),

    listarOS: () => http.get<OrdemServicoApi[]>(os),
    abrirOS: (veiculoId: number, defeitoRelatado: string, kmEntrada?: number) => http.post<OrdemServicoApi>(os, { veiculoId, defeitoRelatado, kmEntrada }),
    listarItens: (id: number) => http.get<ItemServicoApi[]>(`${os}/${id}/itens`),
    adicionarItem: (id: number, item: { descricao: string; valor: number; funcionarioId: number; tipo?: string; quantidade?: number; codigoPeca?: string }) =>
      http.post<ItemServicoApi>(`${os}/${id}/itens`, item),
    alterarStatus: (id: number, status: string, observacao?: string) => http.put<OrdemServicoApi>(`${os}/${id}/status`, { status, observacao }),
    finalizar: (id: number, saida?: { kmSaida?: number; retiradoPor?: string }) => http.put<OrdemServicoApi>(`${os}/${id}/finalizar`, saida ?? {}),
    historico: (id: number) => http.get<HistoricoApi[]>(`${os}/${id}/historico`),

    listarFotos: (id: number) => http.get<FotoApi[]>(`${os}/${id}/fotos`),
    enviarFoto: (id: number, arquivo: Blob, categoria: string, descricao: string) => {
      const f = new FormData();
      f.append('arquivo', arquivo, `foto-${Date.now()}.jpg`);
      f.append('categoria', categoria);
      f.append('descricao', descricao);
      return http.upload<FotoApi>(`${os}/${id}/fotos`, f);
    },
    urlFoto: (fotoId: number) => `${http.base}/api/fotos/${fotoId}/arquivo`,
    removerFoto: (fotoId: number) => http.del<void>(`/api/fotos/${fotoId}`),
  };
}
export type OficinaApi = ReturnType<typeof oficinaApi>;

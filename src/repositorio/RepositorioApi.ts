import type {
  Cliente, Dados, EtapaProgresso, Foto, Funcionario, OrdemServico, PecaUsada, RascunhoEntrada, RecursosApi, Saida, Servico, StatusOS,
} from '../types';
import { DO_ENUM, PARA_ENUM } from '../constants/dominio';
import { criarHttp, naoExiste } from '../services/http';
import { oficinaApi, type ItemServicoApi, type OficinaApi } from '../services/oficinaApi';
import { lsGravar, lsLer } from '../services/armazenamento';
import { fotosDb } from '../services/fotosDb';
import { dataUrlParaBlob } from '../utils/imagem';
import { agora, normPlaca, uid } from '../utils/formato';
import { RepositorioLocal, type NovaFoto, type NovaPeca, type NovoServico } from './RepositorioLocal';
import { dadosDeExemplo, entradaVazia } from './seed';

const CHAVE_EXTRAS = 'oficina-pro-react-extras-v1';

/** O que o back-end ainda não guarda fica aqui, ligado ao id da API */
interface ExtrasOS {
  statusDet?: StatusOS; tipo?: string; prioridade?: OrdemServico['prioridade']; box?: string; previsao?: string; retornoDe?: number;
  entrada?: OrdemServico['entrada']; saida?: Saida | null; reclamacoes?: OrdemServico['reclamacoes']; diagnostico?: string;
  aprovado?: OrdemServico['aprovado']; hist?: OrdemServico['hist']; progresso?: EtapaProgresso[];
  servicos?: Record<number, { sistema: string; horas: number | null; feito: boolean }>;
  pecas?: Record<number, { pecaId: string | null; custoUnit?: number }>;
}
interface Extras {
  os: Partial<Record<number, ExtrasOS>>;
  veiculos: Partial<Record<number, { tipo: string; frota: string; km: number; ultRevKm: number; intRev: number }>>;
  funcionarios: Partial<Record<number, { valorHora: number }>>;
  clientes: Partial<Record<number, { contato: string; tipo: string; prazo: string }>>;
  estoque: Dados['estoque'] | null;
}

const idApi = (id: string) => Number(String(id).replace(/^[a-z]+/, ''));
const RE_PECA = /^\[Peça\]\s*(\d+)\s*[×x]\s*(.*?)(?:\s*\(([^)]*)\))?$/;

/** Monta o texto do campo defeitoRelatado (até 1000 caracteres no banco) a partir das reclamações */
export const textoDefeito = (lista: { texto: string; sistema: string }[]) => {
  const t = lista.map((r, i) => `${lista.length > 1 ? `${i + 1}) ` : ''}${r.texto.trim()} [${r.sistema}]`).join(' ');
  return t.length > 1000 ? t.slice(0, 997) + '...' : t;
};

/** Modo API: clientes, veículos, funcionários, OS, itens, fotos e histórico vêm do Spring Boot. */
export class RepositorioApi extends RepositorioLocal {
  readonly api: OficinaApi;
  recursos: RecursosApi = { itens: true, status: true, fotos: true, historico: true };
  private extras: Extras;

  constructor(readonly url: string) {
    super();
    this.api = oficinaApi(criarHttp(url));
    this.extras = lsLer<Extras>(CHAVE_EXTRAS, { os: {}, veiculos: {}, funcionarios: {}, clientes: {}, estoque: null });
  }

  /** Testa se um endpoint opcional existe; marca o recurso como ausente em caso de 404/405 */
  private async opcional<T>(recurso: keyof RecursosApi, fn: () => Promise<T>): Promise<T | null> {
    if (!this.recursos[recurso]) return null;
    try { return await fn(); } catch (e) { if (naoExiste(e)) { this.recursos[recurso] = false; return null; } throw e; }
  }

  async carregar() {
    const [cl, fu, ve, os] = await Promise.all([this.api.listarClientes(), this.api.listarFuncionarios(), this.api.listarVeiculos(), this.api.listarOS()]);
    this.recursos = { itens: true, status: true, fotos: true, historico: true };
    const X = this.extras;
    const porOS = await Promise.all(os.map(async (o) => ({
      itens: await this.opcional('itens', () => this.api.listarItens(o.id)),
      fotos: await this.opcional('fotos', () => this.api.listarFotos(o.id)),
      hist: await this.opcional('historico', () => this.api.historico(o.id)),
    })));
    const fotosLocais = await fotosDb.todas();

    const clientes: Cliente[] = cl.map((c) => ({ id: 'c' + c.id, nome: c.nomeOuRazaoSocial, doc: c.cpfOuCnpj, tel: c.telefone || '', contato: '', tipo: '', prazo: '', ...X.clientes[c.id] }));
    const funcionarios: Funcionario[] = fu.map((f) => ({ id: 'm' + f.id, nome: f.nome, cargo: f.cargo, valorHora: 150, ...X.funcionarios[f.id] }));
    const veiculos = ve.map((v) => ({
      id: 'v' + v.id, placa: normPlaca(v.placa), marca: v.marca, modelo: v.modelo, ano: v.anoFabricacao ? String(v.anoFabricacao) : '', chassi: v.chassi || '',
      clienteId: 'c' + v.cliente?.id, tipo: 'Truck 6x2', frota: '', km: 0, ultRevKm: 0, intRev: 30000, ...X.veiculos[v.id],
    }));
    const fotos: Foto[] = [];

    const ordens: OrdemServico[] = os.map((o, i) => {
      const x = X.os[o.id] || {};
      const { itens, fotos: fApi, hist } = porOS[i];
      const { servicos, pecas } = this.separarItens(itens || [], x);
      fApi?.forEach((f) => fotos.push({ id: 'a' + f.id, osId: 'o' + o.id, categoria: f.categoria as Foto['categoria'], descricao: f.descricao || '', data: f.dataEnvio, src: this.api.urlFoto(f.id), origem: 'api' }));
      fotosLocais.filter((f) => f.osId === 'o' + o.id && f.origem === 'local').forEach((f) => fotos.push(f));
      const status = this.statusCompativel(o.status, x.statusDet);
      const progresso = x.progresso?.length ? x.progresso
        : hist?.length ? hist.map((h) => ({ status: DO_ENUM[h.status] || 'Aguardando diagnóstico', data: h.dataHora, obs: h.observacao }))
        : [{ status: 'Aguardando diagnóstico' as StatusOS, data: o.dataEntrada }];
      const entrada = x.entrada || entradaVazia(o.kmEntrada || 0);
      const saida = o.status === 'FINALIZADA'
        ? { ...(x.saida || { combustivel: 0, documento: '', conferencia: {}, obs: '', assinatura: null }), data: o.dataSaida || x.saida?.data || o.dataEntrada, km: o.kmSaida ?? x.saida?.km ?? 0, retiradoPor: o.retiradoPor || x.saida?.retiradoPor || '—' }
        : null;
      return {
        id: 'o' + o.id, num: o.id, veiculoId: 'v' + o.veiculo?.id, clienteId: 'c' + o.veiculo?.cliente?.id, status,
        tipo: x.tipo || 'Corretiva', prioridade: x.prioridade || 'Normal', box: o.status === 'FINALIZADA' ? '' : x.box || 'Pátio',
        abertura: o.dataEntrada, previsao: x.previsao || '', retornoDe: x.retornoDe, entrada, saida,
        reclamacoes: x.reclamacoes || [{ id: 'r' + o.id, texto: o.defeitoRelatado, sistema: '—', quando: '—', sev: 'Média', dtc: '', status: o.status === 'FINALIZADA' ? 'Resolvida' : 'Aberta', causa: '', data: o.dataEntrada }],
        diagnostico: x.diagnostico || '', servicos, pecas, aprovado: x.aprovado || null, progresso,
        hist: x.hist || [{ d: o.dataEntrada, t: 'OS aberta — ' + o.defeitoRelatado }],
        apiTotal: Number(o.valorTotal || 0), itensOk: itens !== null,
      };
    });

    this.dados = { clientes, funcionarios, veiculos, ordens, fotos, estoque: X.estoque || dadosDeExemplo().estoque, boxes: dadosDeExemplo().boxes, seq: 0 };
  }

  /** ItemServico da API -> serviços (mão de obra) e peças usadas */
  private separarItens(itens: ItemServicoApi[], x: ExtrasOS) {
    const servicos: Servico[] = [];
    const pecas: PecaUsada[] = [];
    for (const it of itens) {
      const m = RE_PECA.exec(it.descricao);
      if (it.tipo === 'PECA' || m) {
        const qtd = it.quantidade || (m ? Number(m[1]) : 1) || 1;
        const meta = x.pecas?.[it.id];
        pecas.push({ id: 'i' + it.id, pecaId: meta?.pecaId ?? null, cod: it.codigoPeca || m?.[3] || '', desc: m ? m[2] : it.descricao, qtd,
          valorUnit: Number(it.valor) / qtd, custoUnit: meta?.custoUnit, mecId: it.funcionario ? 'm' + it.funcionario.id : undefined, data: it.dataLancamento || '' });
      } else {
        const meta = x.servicos?.[it.id];
        servicos.push({ id: 'i' + it.id, desc: it.descricao, valor: Number(it.valor), mecId: 'm' + it.funcionario?.id,
          sistema: meta?.sistema || '—', horas: meta?.horas ?? null, feito: meta?.feito ?? false, data: it.dataLancamento });
      }
    }
    return { servicos, pecas };
  }

  /** O front tem 8 etapas; o enum do back-end tem 4. Mantém a etapa detalhada quando for compatível. */
  private statusCompativel(apiStatus: string, det?: StatusOS): StatusOS {
    if (det && (PARA_ENUM(det) === apiStatus || (apiStatus === 'EM_ANDAMENTO' && PARA_ENUM(det) === 'ABERTA'))) return det;
    return DO_ENUM[apiStatus] || 'Aguardando diagnóstico';
  }

  protected async persistir() {
    const X = this.extras;
    for (const o of this.dados.ordens) {
      const servicos: ExtrasOS['servicos'] = {};
      o.servicos.forEach((s) => { if (s.id.startsWith('i')) servicos[idApi(s.id)] = { sistema: s.sistema, horas: s.horas, feito: s.feito }; });
      const pecas: ExtrasOS['pecas'] = {};
      o.pecas.forEach((p) => { if (p.id.startsWith('i')) pecas[idApi(p.id)] = { pecaId: p.pecaId, custoUnit: p.custoUnit }; });
      X.os[idApi(o.id)] = {
        ...X.os[idApi(o.id)], statusDet: o.status, tipo: o.tipo, prioridade: o.prioridade, box: o.box, previsao: o.previsao, retornoDe: o.retornoDe,
        entrada: o.entrada, saida: o.saida, reclamacoes: o.reclamacoes, diagnostico: o.diagnostico, aprovado: o.aprovado, hist: o.hist,
        progresso: o.progresso, servicos: { ...X.os[idApi(o.id)]?.servicos, ...servicos }, pecas: { ...X.os[idApi(o.id)]?.pecas, ...pecas },
      };
    }
    this.dados.veiculos.forEach((v) => (X.veiculos[idApi(v.id)] = { tipo: v.tipo, frota: v.frota, km: v.km, ultRevKm: v.ultRevKm, intRev: v.intRev }));
    this.dados.funcionarios.forEach((f) => (X.funcionarios[idApi(f.id)] = { valorHora: f.valorHora }));
    this.dados.clientes.forEach((c) => (X.clientes[idApi(c.id)] = { contato: c.contato, tipo: c.tipo, prazo: c.prazo }));
    X.estoque = this.dados.estoque;
    if (!lsGravar(CHAVE_EXTRAS, X)) throw new Error('Sem espaço no navegador para os dados complementares.');
  }

  /** Executa a alteração local, grava e recarrega tudo da API */
  private async salvarERecarregar() { await this.persistir(); await this.carregar(); }

  // ---------- operações que vão para o back-end ----------
  async abrirOS(r: RascunhoEntrada): Promise<OrdemServico> {
    const placa = normPlaca(r.veiculo.placa);
    let clienteApi = r.clienteId === 'novo' ? 0 : idApi(r.clienteId);
    if (!clienteApi) {
      const c = await this.api.cadastrarCliente({ nomeOuRazaoSocial: r.novoCliente.nome, cpfOuCnpj: r.novoCliente.doc, telefone: r.novoCliente.tel });
      clienteApi = c.id;
      this.extras.clientes[c.id] = { contato: r.novoCliente.contato, tipo: '', prazo: '' };
    }
    const existente = this.dados.veiculos.find((v) => v.placa === placa);
    const veiculoApi = existente ? idApi(existente.id)
      : (await this.api.cadastrarVeiculo(clienteApi, { placa, marca: r.veiculo.marca, modelo: r.veiculo.modelo, anoFabricacao: r.veiculo.ano ? Number(r.veiculo.ano) : undefined, chassi: r.veiculo.chassi || undefined })).id;
    const km = Number(r.entrada.km);
    this.extras.veiculos[veiculoApi] = { ultRevKm: km, intRev: 30000, ...this.extras.veiculos[veiculoApi], tipo: r.veiculo.tipo, frota: r.veiculo.frota, km };

    const reclamacoes = this.reclamacoesDoRascunho(r);
    const nova = await this.api.abrirOS(veiculoApi, textoDefeito(reclamacoes), km);
    const data = agora();
    this.extras.os[nova.id] = {
      statusDet: 'Aguardando diagnóstico', tipo: r.os.tipo, prioridade: r.os.prioridade, box: r.os.box,
      previsao: r.os.previsao ? new Date(r.os.previsao).toISOString() : '', entrada: structuredClone({ ...r.entrada, km }), reclamacoes,
      diagnostico: '', aprovado: null, hist: [{ d: data, t: `Veículo recebido — ${r.entrada.motorista || 'motorista não informado'} · ${km} km` }],
      progresso: [{ status: 'Aguardando diagnóstico', data, obs: 'Entrada do veículo' }],
    };
    lsGravar(CHAVE_EXTRAS, this.extras);
    if (r.fotos.length) await this.enviarFotos(nova.id, r.fotos);
    await this.carregar();
    return this.os('o' + nova.id);
  }

  async mudarStatus(id: string, status: StatusOS, obs?: string) {
    const o = this.os(id);
    if (o.status === status) return;
    const n = idApi(id);
    const alvo = PARA_ENUM(status);
    const atual = PARA_ENUM(o.status);
    if (status === 'Entregue') await this.api.finalizar(n);
    else if (alvo !== atual && this.recursos.status) {
      try { await this.api.alterarStatus(n, alvo, obs); } catch (e) { if (naoExiste(e)) this.recursos.status = false; else throw e; }
    }
    this.registrarEtapa(o, status, obs);
    await this.salvarERecarregar();
  }

  async lancarServico(id: string, s: NovoServico) {
    const o = this.os(id);
    this.garantirAberta(o);
    const valorHora = this.dados.funcionarios.find((f) => f.id === s.mecId)?.valorHora || 150;
    const it = await this.api.adicionarItem(idApi(id), { descricao: s.desc, valor: +(s.horas * valorHora).toFixed(2), funcionarioId: idApi(s.mecId), tipo: 'MAO_DE_OBRA', quantidade: 1 });
    this.log(o, `Serviço lançado: ${s.desc} (${s.horas} h) — ${this.nomeFunc(s.mecId)}`);
    await this.persistir();
    const x = (this.extras.os[idApi(id)] ??= {});
    x.servicos = { ...x.servicos, [it.id]: { sistema: s.sistema, horas: s.horas, feito: false } };
    lsGravar(CHAVE_EXTRAS, this.extras);
    await this.carregar();
  }

  async lancarPeca(id: string, p: NovaPeca): Promise<string | null> {
    const o = this.os(id);
    this.garantirAberta(o);
    const est = this.pecaEstoque(p.pecaId);
    const aviso = p.qtd > est.qtd ? `Estoque insuficiente de ${est.desc} (${est.qtd} un.). Faça o pedido de compra.` : null;
    // back-end novo guarda tipo/quantidade/código; o antigo só a descrição — por isso o prefixo [Peça]
    const descricao = this.recursos.historico ? est.desc : `[Peça] ${p.qtd}× ${est.desc} (${est.cod})`;
    const it = await this.api.adicionarItem(idApi(id), { descricao, valor: +(p.qtd * est.venda).toFixed(2), funcionarioId: idApi(p.mecId), tipo: 'PECA', quantidade: p.qtd, codigoPeca: est.cod });
    est.qtd -= Math.min(p.qtd, Math.max(est.qtd, 0));
    this.log(o, `Peça aplicada: ${p.qtd}× ${est.desc}`);
    await this.persistir();
    const x = (this.extras.os[idApi(id)] ??= {});
    x.pecas = { ...x.pecas, [it.id]: { pecaId: est.id, custoUnit: est.custo } };
    lsGravar(CHAVE_EXTRAS, this.extras);
    await this.carregar();
    return aviso;
  }

  async removerServico(): Promise<void> { throw new Error('A API ainda não tem endpoint para remover itens da OS.'); }
  async removerPeca(): Promise<void> { throw new Error('A API ainda não tem endpoint para remover itens da OS.'); }

  async registrarSaida(id: string, s: Saida) {
    const o = this.os(id);
    await this.api.finalizar(idApi(id), { kmSaida: s.km, retiradoPor: s.retiradoPor });
    this.aplicarSaida(o, s);
    await this.salvarERecarregar();
  }

  private async enviarFotos(osApi: number, fotos: NovaFoto[]) {
    if (this.recursos.fotos) {
      try {
        for (const f of fotos) await this.api.enviarFoto(osApi, dataUrlParaBlob(f.src), f.categoria, f.descricao);
        return;
      } catch (e) { if (!naoExiste(e)) throw e; this.recursos.fotos = false; }
    }
    // back-end sem endpoint de fotos: guarda no navegador
    await fotosDb.salvar(fotos.map((f) => ({ id: 'f' + uid(), osId: 'o' + osApi, categoria: f.categoria, descricao: f.descricao, src: f.src, data: agora(), origem: 'local' as const })));
  }

  async adicionarFotos(osId: string, novas: NovaFoto[]) {
    const o = this.os(osId);
    await this.enviarFotos(idApi(osId), novas);
    this.log(o, `${novas.length} foto(s) anexada(s)`);
    await this.salvarERecarregar();
  }

  async removerFoto(fotoId: string) {
    const f = this.dados.fotos.find((x) => x.id === fotoId);
    if (f?.origem === 'api') await this.api.removerFoto(idApi(fotoId));
    else await fotosDb.remover(fotoId);
    await this.carregar();
  }

  async cadastrarCliente(c: Omit<Cliente, 'id'>) {
    const n = await this.api.cadastrarCliente({ nomeOuRazaoSocial: c.nome, cpfOuCnpj: c.doc, telefone: c.tel });
    this.extras.clientes[n.id] = { contato: c.contato, tipo: c.tipo, prazo: c.prazo };
    await this.salvarERecarregar();
  }

  async cadastrarFuncionario(f: Omit<Funcionario, 'id'>) {
    const n = await this.api.cadastrarFuncionario({ nome: f.nome, cargo: f.cargo });
    this.extras.funcionarios[n.id] = { valorHora: f.valorHora };
    await this.salvarERecarregar();
  }

  async abrirRetorno(origemId: string, texto: string, sistema: string, km: number): Promise<OrdemServico> {
    const orig = this.os(origemId);
    const nova = await this.api.abrirOS(idApi(orig.veiculoId), textoDefeito([{ texto: `RETORNO da OS #${orig.num}: ${texto}`, sistema }]), km);
    const data = agora();
    this.extras.os[nova.id] = {
      statusDet: 'Aguardando diagnóstico', tipo: 'Garantia / Retorno', prioridade: 'Alta', box: 'Pátio', retornoDe: orig.num, entrada: entradaVazia(km),
      reclamacoes: [{ id: uid(), texto, sistema, quando: 'Sempre', sev: 'Alta', dtc: '', status: 'Aberta', causa: '', data }],
      hist: [{ d: data, t: `Retorno em garantia da OS #${orig.num}` }], progresso: [{ status: 'Aguardando diagnóstico', data, obs: `Retorno da OS #${orig.num}` }],
    };
    await this.salvarERecarregar();
    return this.os('o' + nova.id);
  }
}

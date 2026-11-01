import type {
  Cliente, Dados, Foto, Funcionario, OrdemServico, PecaEstoque, RascunhoEntrada, Reclamacao, Saida, StatusOS,
} from '../types';
import { agora, normPlaca, num, uid } from '../utils/formato';
import { fotosDb } from '../services/fotosDb';
import { entradaVazia } from './seed';

export type NovoServico = { desc: string; sistema: string; mecId: string; horas: number };
export type NovaPeca = { pecaId: string; qtd: number; mecId: string };
export type NovaFoto = { categoria: Foto['categoria']; descricao: string; src: string };

/**
 * Regras de negócio da oficina executadas sobre os dados em memória.
 * O modo Demonstração usa esta classe direto; o modo API herda dela e troca
 * só as operações que existem no back-end Spring Boot.
 */
export abstract class RepositorioLocal {
  dados!: Dados;

  abstract carregar(): Promise<void>;
  protected abstract persistir(): Promise<void>;

  // ---------- consultas ----------
  protected os(id: string): OrdemServico {
    const o = this.dados.ordens.find((x) => x.id === id);
    if (!o) throw new Error('OS não encontrada.');
    return o;
  }
  protected log(o: OrdemServico, t: string) { o.hist.push({ d: agora(), t }); }
  protected nomeFunc(id: string) { return this.dados.funcionarios.find((f) => f.id === id)?.nome || '—'; }

  // ---------- entrada de veículo ----------
  async abrirOS(r: RascunhoEntrada): Promise<OrdemServico> {
    let clienteId = r.clienteId;
    if (clienteId === 'novo') {
      clienteId = 'c' + uid();
      this.dados.clientes.push({ id: clienteId, nome: r.novoCliente.nome, doc: r.novoCliente.doc, tel: r.novoCliente.tel, contato: r.novoCliente.contato, tipo: 'Autônomo', prazo: 'À vista' });
    }
    const placa = normPlaca(r.veiculo.placa);
    let v = this.dados.veiculos.find((x) => x.placa === placa);
    const km = Number(r.entrada.km);
    if (!v) {
      v = { id: 'v' + uid(), ...r.veiculo, placa, clienteId, km, ultRevKm: km, intRev: 30000 };
      this.dados.veiculos.push(v);
    } else Object.assign(v, { ...r.veiculo, placa, clienteId, km });

    const data = agora();
    const o: OrdemServico = {
      id: 'o' + uid(), num: this.dados.seq++, veiculoId: v.id, clienteId, tipo: r.os.tipo, status: 'Aguardando diagnóstico',
      prioridade: r.os.prioridade, box: r.os.box, abertura: data, previsao: r.os.previsao ? new Date(r.os.previsao).toISOString() : '',
      entrada: structuredClone({ ...r.entrada, km }), saida: null,
      reclamacoes: this.reclamacoesDoRascunho(r),
      diagnostico: '', servicos: [], pecas: [], aprovado: null,
      progresso: [{ status: 'Aguardando diagnóstico', data, obs: 'Entrada do veículo' }],
      hist: [{ d: data, t: `Veículo recebido — ${r.entrada.motorista || 'motorista não informado'} · ${num(km)} km` }],
    };
    this.dados.ordens.push(o);
    if (r.fotos.length) await this.adicionarFotos(o.id, r.fotos, false);
    await this.persistir();
    return o;
  }

  protected reclamacoesDoRascunho(r: RascunhoEntrada): Reclamacao[] {
    return r.reclamacoes.filter((x) => x.texto.trim()).map((x) => ({ ...x, id: uid(), status: 'Aberta', causa: '', data: agora() }));
  }

  // ---------- OS ----------
  async atualizarOS(id: string, patch: Partial<OrdemServico>, registro?: string) {
    const o = this.os(id);
    Object.assign(o, patch);
    if (registro) this.log(o, registro);
    await this.persistir();
  }

  async mudarStatus(id: string, status: StatusOS, obs?: string) {
    const o = this.os(id);
    if (o.status === status) return;
    this.registrarEtapa(o, status, obs);
    await this.persistir();
  }

  protected registrarEtapa(o: OrdemServico, status: StatusOS, obs?: string) {
    this.log(o, `Etapa: ${o.status} → ${status}${obs ? ` (${obs})` : ''}`);
    o.status = status;
    o.progresso.push({ status, data: agora(), obs });
  }

  async aprovar(id: string, por: string) {
    const o = this.os(id);
    o.aprovado = { data: agora(), por };
    this.log(o, `Orçamento aprovado por ${por}`);
    if (o.status === 'Aguardando aprovação') this.registrarEtapa(o, 'Em execução', 'orçamento aprovado');
    await this.persistir();
  }

  async anotar(id: string, texto: string) { this.log(this.os(id), '📝 ' + texto); await this.persistir(); }

  async adicionarReclamacao(id: string, r: Omit<Reclamacao, 'id' | 'status' | 'causa' | 'data'>) {
    const o = this.os(id);
    o.reclamacoes.push({ ...r, id: uid(), status: 'Aberta', causa: '', data: agora() });
    this.log(o, 'Reclamação adicionada: ' + r.texto);
    await this.persistir();
  }

  async atualizarReclamacao(id: string, rid: string, patch: Partial<Reclamacao>) {
    const r = this.os(id).reclamacoes.find((x) => x.id === rid);
    if (r) Object.assign(r, patch);
    await this.persistir();
  }

  // ---------- serviços e peças ----------
  protected garantirAberta(o: OrdemServico) {
    if (o.status === 'Entregue') throw new Error('OS finalizada: não aceita novos itens.');
  }

  async lancarServico(id: string, s: NovoServico) {
    const o = this.os(id);
    this.garantirAberta(o);
    o.servicos.push({ id: uid(), ...s, feito: false, data: agora() });
    this.log(o, `Serviço lançado: ${s.desc} (${s.horas} h) — ${this.nomeFunc(s.mecId)}`);
    await this.persistir();
  }

  async alternarServico(id: string, servicoId: string) {
    const o = this.os(id);
    const s = o.servicos.find((x) => x.id === servicoId);
    if (!s) return;
    s.feito = !s.feito;
    this.log(o, `${s.feito ? 'Concluído' : 'Reaberto'}: ${s.desc}`);
    await this.persistir();
  }

  async removerServico(id: string, servicoId: string) {
    const o = this.os(id);
    const i = o.servicos.findIndex((x) => x.id === servicoId);
    if (i >= 0) this.log(o, 'Serviço removido: ' + o.servicos.splice(i, 1)[0].desc);
    await this.persistir();
  }

  /** Lança a peça na OS e dá baixa no estoque. Devolve aviso se o estoque não bastava. */
  async lancarPeca(id: string, p: NovaPeca): Promise<string | null> {
    const o = this.os(id);
    this.garantirAberta(o);
    const est = this.pecaEstoque(p.pecaId);
    const aviso = p.qtd > est.qtd ? `Estoque insuficiente de ${est.desc} (${est.qtd} un.). Faça o pedido de compra.` : null;
    est.qtd -= Math.min(p.qtd, Math.max(est.qtd, 0));
    o.pecas.push({ id: uid(), pecaId: est.id, cod: est.cod, desc: est.desc, qtd: p.qtd, valorUnit: est.venda, custoUnit: est.custo, mecId: p.mecId, data: agora() });
    this.log(o, `Peça aplicada: ${p.qtd}× ${est.desc}`);
    await this.persistir();
    return aviso;
  }

  async removerPeca(id: string, itemId: string) {
    const o = this.os(id);
    const i = o.pecas.findIndex((x) => x.id === itemId);
    if (i < 0) return;
    const [it] = o.pecas.splice(i, 1);
    const est = this.dados.estoque.find((x) => x.id === it.pecaId);
    if (est) est.qtd += it.qtd;
    this.log(o, `Peça devolvida ao estoque: ${it.qtd}× ${it.desc}`);
    await this.persistir();
  }

  protected pecaEstoque(pecaId: string): PecaEstoque {
    const p = this.dados.estoque.find((x) => x.id === pecaId);
    if (!p) throw new Error('Peça não encontrada no estoque.');
    return p;
  }

  // ---------- saída do veículo ----------
  async registrarSaida(id: string, s: Saida) {
    const o = this.os(id);
    this.aplicarSaida(o, s);
    await this.persistir();
  }

  protected aplicarSaida(o: OrdemServico, s: Saida) {
    o.saida = s;
    o.box = '';
    o.reclamacoes.forEach((r) => { if (r.status === 'Aberta' || r.status === 'Diagnosticada') r.status = 'Resolvida'; });
    const v = this.dados.veiculos.find((x) => x.id === o.veiculoId);
    if (v && s.km) v.km = Math.max(v.km, s.km);
    if (o.tipo === 'Preventiva' && v) v.ultRevKm = s.km || v.km;
    this.registrarEtapa(o, 'Entregue', `retirado por ${s.retiradoPor}`);
    this.log(o, `Saída do veículo · ${num(s.km)} km · retirado por ${s.retiradoPor}`);
  }

  // ---------- fotos ----------
  async adicionarFotos(osId: string, novas: NovaFoto[], salvar = true) {
    const o = this.os(osId);
    const fotos: Foto[] = novas.map((f) => ({ id: 'f' + uid(), osId, categoria: f.categoria, descricao: f.descricao, src: f.src, data: agora(), origem: 'local' }));
    this.dados.fotos.push(...fotos);
    await fotosDb.salvar(fotos);
    this.log(o, `${fotos.length} foto(s) anexada(s)`);
    if (salvar) await this.persistir();
  }

  async removerFoto(fotoId: string) {
    this.dados.fotos = this.dados.fotos.filter((f) => f.id !== fotoId);
    await fotosDb.remover(fotoId);
    await this.persistir();
  }

  // ---------- cadastros ----------
  async cadastrarCliente(c: Omit<Cliente, 'id'>) { this.dados.clientes.push({ id: 'c' + uid(), ...c }); await this.persistir(); }
  async cadastrarFuncionario(f: Omit<Funcionario, 'id'>) { this.dados.funcionarios.push({ id: 'm' + uid(), ...f }); await this.persistir(); }
  async cadastrarPeca(p: Omit<PecaEstoque, 'id'>) { this.dados.estoque.push({ id: 'p' + uid(), ...p }); await this.persistir(); }
  async entradaEstoque(pecaId: string, qtd: number) { this.pecaEstoque(pecaId).qtd += qtd; await this.persistir(); }

  async abrirRetorno(origemId: string, texto: string, sistema: string, km: number): Promise<OrdemServico> {
    const orig = this.os(origemId);
    const data = agora();
    const o: OrdemServico = {
      id: 'o' + uid(), num: this.dados.seq++, veiculoId: orig.veiculoId, clienteId: orig.clienteId, tipo: 'Garantia / Retorno',
      status: 'Aguardando diagnóstico', prioridade: 'Alta', box: 'Pátio', abertura: data, previsao: '', retornoDe: orig.num,
      entrada: entradaVazia(km), saida: null,
      reclamacoes: [{ id: uid(), texto, sistema, quando: 'Sempre', sev: 'Alta', dtc: '', status: 'Aberta', causa: '', data }],
      diagnostico: '', servicos: [], pecas: [], aprovado: null,
      progresso: [{ status: 'Aguardando diagnóstico', data, obs: `Retorno da OS #${orig.num}` }],
      hist: [{ d: data, t: `Retorno em garantia da OS #${orig.num}` }],
    };
    this.dados.ordens.push(o);
    await this.persistir();
    return o;
  }
}

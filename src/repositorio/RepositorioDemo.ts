import type { Dados } from '../types';
import { lsGravar, lsLer } from '../services/armazenamento';
import { fotosDb } from '../services/fotosDb';
import { RepositorioLocal } from './RepositorioLocal';
import { dadosDeExemplo } from './seed';

const CHAVE = 'oficina-pro-react-demo-v1';

/** Modo Demonstração: tudo salvo no navegador (dados no localStorage, fotos no IndexedDB). */
export class RepositorioDemo extends RepositorioLocal {
  async carregar() {
    const salvo = lsLer<Dados | null>(CHAVE, null);
    this.dados = salvo ?? dadosDeExemplo();
    this.dados.fotos = (await fotosDb.todas()).filter((f) => f.origem === 'local' && this.dados.ordens.some((o) => o.id === f.osId));
  }

  protected async persistir() {
    if (!lsGravar(CHAVE, { ...this.dados, fotos: [] })) throw new Error('Não foi possível salvar no navegador (armazenamento cheio).');
  }

  async restaurarExemplo() {
    await fotosDb.limpar();
    this.dados = dadosDeExemplo();
    await this.persistir();
  }
}

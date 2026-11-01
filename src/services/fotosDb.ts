import type { Foto } from '../types';

// Fotos ficam no IndexedDB (aguenta centenas de MB), não no localStorage (limite ~5 MB).
const BANCO = 'oficina-pro-fotos';
const TABELA = 'fotos';

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(BANCO, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(TABELA, { keyPath: 'id' });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function tx<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(TABELA, modo);
    const req = fn(t.objectStore(TABELA));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export const fotosDb = {
  async todas(): Promise<Foto[]> {
    try { return ((await tx<Foto[]>('readonly', (s) => s.getAll())) || []); } catch { return []; }
  },
  async salvar(fotos: Foto[]) {
    try { await tx('readwrite', (s) => { fotos.forEach((f) => s.put(f)); }); } catch { /* sem IndexedDB */ }
  },
  async remover(id: string) {
    try { await tx('readwrite', (s) => s.delete(id)); } catch { /* ignora */ }
  },
  async limpar() {
    try { await tx('readwrite', (s) => s.clear()); } catch { /* ignora */ }
  },
};

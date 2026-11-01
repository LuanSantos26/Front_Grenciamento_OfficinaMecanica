// localStorage pode estar indisponível (modo privado, cota cheia): tudo protegido por try/catch
export const lsLer = <T>(chave: string, padrao: T): T => {
  try { const v = localStorage.getItem(chave); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
};
export const lsGravar = (chave: string, valor: unknown): boolean => {
  try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch { return false; }
};
export const lsTexto = (chave: string, padrao = '') => { try { return localStorage.getItem(chave) ?? padrao; } catch { return padrao; } };
export const lsTextoGravar = (chave: string, v: string) => { try { localStorage.setItem(chave, v); } catch { /* ignora */ } };

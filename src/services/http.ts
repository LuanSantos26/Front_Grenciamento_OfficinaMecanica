/** Cliente HTTP para a API Spring Boot. Converte os erros do GlobalExceptionHandler ({ erro }) em Error. */
export class ErroApi extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function criarHttp(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, '');

  async function req<T>(caminho: string, opcoes: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
    let resp: Response;
    try {
      resp = await fetch(base + caminho, {
        method: opcoes.method || 'GET',
        headers: opcoes.form ? undefined : { 'Content-Type': 'application/json' },
        body: opcoes.form ?? (opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined),
      });
    } catch {
      throw new ErroApi(`Sem resposta de ${base}. O back-end está rodando e com o CORS liberado?`, 0);
    }
    const texto = await resp.text();
    let json: any = null;
    try { json = texto ? JSON.parse(texto) : null; } catch { /* resposta sem JSON */ }
    if (!resp.ok) throw new ErroApi(json?.erro || json?.message || json?.error || `Erro ${resp.status} em ${caminho}`, resp.status);
    return json as T;
  }

  return {
    base,
    get: <T>(c: string) => req<T>(c),
    post: <T>(c: string, body?: unknown) => req<T>(c, { method: 'POST', body }),
    put: <T>(c: string, body?: unknown) => req<T>(c, { method: 'PUT', body }),
    del: <T>(c: string) => req<T>(c, { method: 'DELETE' }),
    upload: <T>(c: string, form: FormData) => req<T>(c, { method: 'POST', form }),
  };
}
export type Http = ReturnType<typeof criarHttp>;

/** true quando o endpoint não existe no back-end (versão antiga) */
export const naoExiste = (e: unknown) => e instanceof ErroApi && (e.status === 404 || e.status === 405);

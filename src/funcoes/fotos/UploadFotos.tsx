import { useRef, useState } from 'react';
import type { CategoriaFoto } from '../../types';
import { CATEGORIAS_FOTO } from '../../constants/dominio';
import { comprimirImagem } from '../../utils/imagem';
import { Icone } from '../../componentes/ui/Icone';
import { useToast } from '../../contexto/ToastContext';

export interface FotoPendente { categoria: CategoriaFoto; descricao: string; src: string }

/**
 * Adicionar fotos do problema e do veículo.
 * - escolhe a categoria (veículo, problema, serviço, peça, saída)
 * - no celular abre a câmera direto (capture="environment")
 * - aceita arrastar e soltar; comprime antes de salvar/enviar
 */
export function UploadFotos({ onAdicionar, categoriaInicial = 'PROBLEMA', categorias = CATEGORIAS_FOTO.map((c) => c.id), compacto }: {
  onAdicionar: (fotos: FotoPendente[]) => void | Promise<void>; categoriaInicial?: CategoriaFoto; categorias?: CategoriaFoto[]; compacto?: boolean;
}) {
  const toast = useToast();
  const [categoria, setCategoria] = useState<CategoriaFoto>(categoriaInicial);
  const [descricao, setDescricao] = useState('');
  const [processando, setProcessando] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const inputCamera = useRef<HTMLInputElement>(null);
  const inputGaleria = useRef<HTMLInputElement>(null);
  const info = CATEGORIAS_FOTO.find((c) => c.id === categoria)!;

  async function receber(arquivos: FileList | File[] | null) {
    const lista = Array.from(arquivos || []).filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return toast('Selecione arquivos de imagem.', 'aviso');
    setProcessando(true);
    try {
      const fotos: FotoPendente[] = [];
      for (const a of lista) fotos.push({ categoria, descricao: descricao.trim(), src: await comprimirImagem(a) });
      await onAdicionar(fotos);
      setDescricao('');
    } catch (e) {
      toast((e as Error).message, 'erro');
    } finally {
      setProcessando(false);
      if (inputCamera.current) inputCamera.current.value = '';
      if (inputGaleria.current) inputGaleria.current.value = '';
    }
  }

  return (
    <div className="upload">
      <div className="seg seg-wrap">
        {CATEGORIAS_FOTO.filter((c) => categorias.includes(c.id)).map((c) => (
          <button type="button" key={c.id} className={categoria === c.id ? 'on' : ''} onClick={() => setCategoria(c.id)}>{c.nome}</button>
        ))}
      </div>
      {!compacto && <div className="muted" style={{ fontSize: 12, margin: '6px 0 10px' }}>Sugestão: {info.dica}</div>}
      <input className="in" placeholder="Descrição (opcional) — ex.: vazamento no retentor do cubo LD" value={descricao}
        onChange={(e) => setDescricao(e.target.value)} style={{ marginBottom: 10 }} />
      <div className={`drop${arrastando ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }} onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); receber(e.dataTransfer.files); }}>
        {processando ? 'Processando fotos…' : (
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn pri" onClick={() => inputCamera.current?.click()}><Icone nome="fotos" tam={16} />Tirar foto</button>
            <button type="button" className="btn" onClick={() => inputGaleria.current?.click()}>Escolher arquivos</button>
            <span className="muted">ou arraste as imagens para cá</span>
          </div>
        )}
      </div>
      <input ref={inputCamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => receber(e.target.files)} />
      <input ref={inputGaleria} type="file" accept="image/*" multiple hidden onChange={(e) => receber(e.target.files)} />
    </div>
  );
}

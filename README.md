<<<<<<< HEAD
# Oficina Pro — Front-end React + TypeScript

Front-end do **Gerenciador_Oficina** (oficina de caminhões / linha pesada), feito em React 19 + TypeScript + Vite.
Funciona sozinho (modo **Demonstração**, dados no navegador) ou ligado à API Spring Boot (modo **API Spring**).

## Como rodar

```bash
cd frontend-react
npm install
npm run dev        # abre em http://localhost:5173
```

Outros comandos: `npm run build` (gera `dist/`), `npm run typecheck` (checa os tipos), `npm run preview`.

Para usar a API: suba o back-end (`./mvnw spring-boot:run`) e, no rodapé do menu, clique em **API Spring**
e informe `http://localhost:8080` (ou defina `VITE_API_URL` num arquivo `.env`, veja `.env.example`).

## Funções (cada uma na sua pasta)

| Pasta `src/funcoes/` | O que faz |
|---|---|
| `entrada/` | Recepção do veículo em 7 passos: veículo/cliente, reclamações, checklist, pneus, avarias, **fotos**, revisão + assinatura. Cada passo é um componente (`EtapaVeiculo.tsx`, `EtapaChecklist.tsx`…) e as regras ficam em `rascunho.ts`. |
| `fotos/` | **Fotos do problema e do veículo**: `UploadFotos` (câmera do celular, arquivos ou arrastar; 5 categorias: veículo, problema, serviço, peça substituída, saída; compressão automática), `GaleriaFotos` (agrupada por categoria), `Visualizador` (tela cheia com ← →) e `FotosPage` (todas as fotos, filtro e envio para qualquer OS). |
| `progresso/` | **Progresso da OS**: `ProgressoOS` mostra as 8 etapas com data/hora de cada uma, tempo parado em cada etapa e % concluído; `BarraProgressoOS` é a barra usada nos cartões. |
| `movimentacao/` | **Entrada e saída de veículos**: `MovimentacaoPage` (entradas/saídas por período, gráfico de 14 dias, quem está no pátio com o progresso, registro com km e quem entregou/retirou, permanência) e `DialogoSaida` (km de saída, quem retirou, documento, conferência final, fotos e assinatura). |
| `pecas/` | **Peças utilizadas**: relatório por peça, por veículo ou detalhado (data, OS, placa, código, qtd, valor, quem aplicou), margem e cópia em formato de planilha. |
| `os/` | Quadro (kanban) e lista de OS, cartão, gaveta de detalhes e as abas (`abas/AbaServicos.tsx`, `AbaFotos.tsx`, `AbaEntrada.tsx`…). |
| `painel/`, `defeitos/`, `patio/`, `estoque/`, `frotas/`, `relatorios/` | Demais telas. |

## Arquitetura

```
src/
  types/            tipos do domínio (OrdemServico, Foto, Saida, PecaUsada…)
  constants/        etapas, checklist, categorias de foto, mapa de pneus
  services/         http.ts (fetch + erros), oficinaApi.ts (todos os endpoints), fotosDb.ts (IndexedDB), armazenamento.ts
  repositorio/      regras de negócio:
                      RepositorioLocal  → regras comuns (lançar peça, saída, fotos…)
                      RepositorioDemo   → salva no navegador
                      RepositorioApi    → usa a API Spring e guarda no navegador só o que a API ainda não tem
  contexto/         OficinaContext (dados + executar ações), DetalheContext (gaveta da OS e saída), ToastContext
  hooks/            useRota (navegação por #hash), useConsultas (buscas por id)
  componentes/ui/   botões, campos, modais, tags, assinatura, ícones
  componentes/layout/ menu lateral e aviso de conexão
  funcoes/          uma pasta por função (tabela acima)
```

As telas nunca chamam `fetch` direto: chamam `executar(repo => repo.acao(...))`, e o repositório decide
se a ação vai para a API ou fica no navegador.

## O que vai para a API

| Ação | Endpoint |
|---|---|
| Clientes / funcionários | `GET/POST /api/clientes`, `GET/POST /api/funcionarios` |
| Veículo novo na entrada | `POST /api/veiculos/{clienteId}` |
| Abrir OS (com km de entrada) | `POST /api/ordens-servico` |
| Serviço e peça | `POST /api/ordens-servico/{id}/itens` (`tipo`: `MAO_DE_OBRA` ou `PECA`, `quantidade`, `codigoPeca`) |
| Listar itens | `GET /api/ordens-servico/{id}/itens` |
| Mudar etapa | `PUT /api/ordens-servico/{id}/status` |
| Progresso | `GET /api/ordens-servico/{id}/historico` |
| Saída do veículo | `PUT /api/ordens-servico/{id}/finalizar` (`kmSaida`, `retiradoPor`) |
| Fotos | `POST/GET /api/ordens-servico/{id}/fotos`, `GET /api/fotos/{id}/arquivo`, `DELETE /api/fotos/{id}` |

Se o back-end for a versão antiga (sem fotos/histórico/itens), o front detecta o 404 e guarda essas
informações no navegador, avisando no rodapé do menu.

Ainda ficam só no navegador (falta entidade no back-end): checklist, pneus, avarias, assinatura,
prioridade, box, previsão, reclamações detalhadas, diagnóstico, aprovação do orçamento e estoque de peças.
=======
# Front_Grenciamento_OfficinaMecanica
>>>>>>> dbc90d8823e0d63e9d7707b45ff170c5c02bdf94

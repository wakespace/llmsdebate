# 🧠 Sistema de Deliberação Assistida por múltiplos LLMs

Bem-vindo ao **LLMs Debate**, uma plataforma interativa de *Raciocínio Multi-Agente* (Multi-Agent Reasoning) construída com Next.js 16, React e CSS moderno. 

Este projeto permite que você envie um _prompt_ e observe dezenas de diferentes IAs (Large Language Models) debatendo e refletindo sobre o seu problema em paralelo. O sistema permite rodadas de deliberação consecutivas (onde os modelos leem o que os outros especialistas disseram nas rodadas anteriores e melhoram suas próprias respostas) até convergir para uma síntese estruturada perfeita.

---

## ✨ Principais Funcionalidades

- **Múltiplos Provedores de API Integrados:** Suporte ativo nativo para **OpenRouter**, **OpenAI**, **Google Gemini**, **Gemma** e **Perplexity** em uma única interface.
- **OpenAI Responses API:** Todos os modelos OpenAI utilizam o endpoint `/v1/responses` (Responses API), incluindo suporte completo para modelos Codex, Pro, Deep Research e modelos de uso geral.
- **Gemma via SDK Oficial:** Modelos da família Gemma são integrados através do SDK `@google/genai`, garantindo compatibilidade total com suas particularidades de API.
- **Atualização Dinâmica de Modelos:** Uma pipeline automatizada via GitHub Actions e Node.js atualiza regularmente os modelos suportados, com filtragem inteligente que exclui automaticamente modelos incompatíveis (áudio, imagem, robotics, nano-banana, search-preview, etc.).
- **Catálogo de Modelos Interativo:** Página `/models` completa com:
  - **Busca inteligente por tarefa** — Digite "código", "raciocínio", "pesquisa", "matemática" e o sistema ranqueia os modelos mais relevantes.
  - **Filtro "Somente Grátis"** — Toggle para exibir apenas modelos gratuitos.
  - **Filtro por Provedor** — Dropdown para filtrar por OpenAI, Google, OpenRouter, Perplexity.
  - **Seletor de Instâncias (0x-10x)** — Dropdown direto em cada card do catálogo para definir quantas instâncias ativas.
  - **Botões "Todos 1x" e "Limpar"** — Ações em massa para selecionar/desselecionar rapidamente.
  - **Informações detalhadas** — Nome, custo, provedor, context window (em K/M tokens), descrição e tags de capacidades.
- **Seletor de Instâncias Simplificado:** Na barra lateral de configurações, cada modelo exibe um dropdown compacto (0x-10x) para definir a quantidade de instâncias, eliminando o fluxo antigo de expandir → clicar "Adicionar".
- **Múltiplas Instâncias Concorrentes:** Execute o mesmo modelo com diferentes personas em paralelo, com escalonamento automático de requests (2.5s de delay) para evitar rate limits.
- **Reflexão por Rodadas (Aprofundamento):** Os modelos não respondem apenas uma vez. Você pode iniciar novas rodadas onde o sistema injeta as respostas de todos os especialistas da rodada passada no contexto, forçando-os a repensar suas visões.
- **Personas Customizadas (Especialistas):** Crie e atribua "Especialistas" (como Arquiteto, Engenheiro de Qualidade, Product Manager, etc.) aos modelos. O sistema injeta automaticamente o papel e as diretrizes do especialista no *system_prompt* antes do debate.
- **Juízes Selecionáveis:** Escolha quais modelos podem atuar como "Juiz" da síntese com um toggle dedicado (⚖️) em cada modelo, disponível tanto na sidebar quanto no catálogo.
- **Juiz Integrado (Judge LLM):** Utiliza um LLM superior como "Juiz" para ler o histórico da deliberação, comparar argumentos, resolver divergências e construir um consenso bem elaborado.
- **Transcrição e Síntese Final:** Exporte toda a cadeia de raciocínio da deliberação em formato `.MD` com o clique de um botão.
- **Gestão de Prompts Dinâmicos:** Controle total sobre os *"System Prompts"*, divididos em categoria *Initial* (rodada 1) e *Round* (rodadas subsequentes).
- **Proteção de Carga de Contexto (Preflight Modals):** Pop-ups de confirmação interativos estimam em tempo-real se a carga de Histórico e Prompts vai estourar a *Context Window* de algum dos especialistas.
- **Cancelamento de Requisições (AbortController):** Ao iniciar uma nova deliberação, todas as requisições em voo são automaticamente canceladas via AbortController, e um guard de Session ID impede que respostas tardias contaminem a nova sessão.
- **Persistência Inteligente:** Seleção de modelos, personas, prompts e preferências persistem entre sessões via Zustand + localStorage. "Nova Deliberação" preserva a seleção de modelos do usuário.

---

## 🚀 Como instalar e rodar

1. Clone o repositório em sua máquina:
   ```bash
   git clone https://github.com/darlanvsvs/llmsdebate.git
   cd llmsdebate
   ```

2. Instale as dependências através do NPM ou do gerenciador de sua preferência:
   ```bash
   npm install
   ```

3. Modifique o nome do arquivo `.env.example` (se houver) para `.env.local` e preencha as suas chaves de API:
   ```env
   OPENAI_API_KEY="sua_chave_aqui"
   OPENROUTER_API_KEY="sua_chave_aqui"
   GEMINI_API_KEY="sua_chave_aqui"
   PERPLEXITY_API_KEY="sua_chave_aqui"
   ```

4. Inicialize o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. O aplicativo estará rodando em `http://localhost:3000`.

---

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 16 (App Router + Turbopack), React 19, Zustand (State Management com persistência em LocalStorage), CSS moderno (Glassmorphism UI), Lucide Icons.
- **Backend:** Rotas de API via Next.js com suporte a OpenAI Responses API, Google Gemini REST API, SDK `@google/genai` (Gemma), OpenRouter e Perplexity.
- **SDKs:** `@google/genai` para modelos Gemma.
- **Automação:** GitHub Actions para atualização dinâmica do registro de modelos.

---

## 📋 Changelog Recente (Mar/2026)

### Novas Funcionalidades
- **Catálogo de Modelos Interativo** — Página `/models` redesenhada com busca por tarefa, filtros, seletor de instâncias e cards detalhados.
- **Seletor de Instâncias Inline** — Dropdown (0x-10x) direto em cada modelo, substituindo o workflow de expandir e adicionar.
- **Botões "Todos 1x" e "Limpar"** — Ações em massa na página de modelos.
- **OpenAI Responses API** — Todos os modelos OpenAI agora usam `/v1/responses` com suporte a Codex e modelos Pro.
- **Gemma via SDK** — Integração dos modelos Gemma usando `@google/genai`.
- **Múltiplas Instâncias** — Execute o mesmo modelo com diferentes personas simultaneamente.
- **Juízes Selecionáveis** — Toggle para marcar modelos como juízes da síntese.
- **Cancelamento de Requisições** — AbortController + Session ID guard para prevenir respostas obsoletas.

### Correções
- **Modelos fantasma** — Corrigido bug onde modelos antigos reapareciam após reload (migração one-time com `hasMigratedInstances`).
- **Navegação** — Página de modelos abre na mesma aba para manter estado sincronizado.
- **Filtragem** — Excluídos modelos incompatíveis: Nano Banana, search-preview, áudio, imagem, robotics, etc.
- **Nova Deliberação** — Preserva seleção de modelos do usuário.
- **Nomes de modelos** — Removido prefixo "OpenAI" de modelos dinamicamente carregados.

---

## 🎨 Sobre a Interface

O design foca em imersão com tons escuros profundos inspirados no universo espacial (efeitos glassmorphism, translucidez com desfoque de cenário `backdrop-blur`). As respostas dos especialistas são fragmentadas automaticamente pelo sistema em duas fases visuais obrigatórias: **Análise** e **Conclusão Final**, facilitando a leitura e comparação instantânea do raciocínio analítico com o veredicto daquele modelo para o usuário final.

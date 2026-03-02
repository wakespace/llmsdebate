# 🧠 Sistema de Deliberação Assistida por múltiplos LLMs

Bem-vindo ao **LLMs Debate**, uma plataforma interativa de *Raciocínio Multi-Agente* (Multi-Agent Reasoning) construída com Next.js 14, React e Tailwind CSS. 

Este projeto permite que você envie um _prompt_ e observe dezenas de diferentes IAs (Large Language Models) debatendo e refletindo sobre o seu problema em paralelo. O sistema permite rodadas de deliberação consecutivas (onde os modelos leem o que os outros especialistas disseram nas rodadas anteriores e melhoram suas próprias respostas) até convergir para uma síntese estruturada perfeita.

---

## ✨ Principais Funcionalidades

- **Múltiplos Provedores de API Integrados:** Suporte ativo nativo para **OpenRouter**, **OpenAI**, **Perplexity** e **Google Gemini** em uma única interface.
- **Atualização Dinâmica de Modelos:** Uma pipeline automatizada via GitHub Actions e Node.js atualiza regularmente os modelos suportados puxando do registro da OpenRouter, com suporte simultâneo a chaves da OpenAI, Gemini, Perplexity e Anthropic.
- **Múltiplos Modelos Especialistas:** Escolha a dedo qual IA fará parte do seu grupo de deliberação a partir de uma lista expansiva e atualizada.
- **Reflexão por Rodadas (Aprofundamento):** Os modelos não respondem apenas uma vez. Você pode iniciar novas rodadas onde o sistema injeta as respostas de todos os especialistas da rodada passada no contexto, forçando-os a repensar suas visões.
- **Personas Customizadas (Especialistas):** Crie e atribua "Especialistas" (como Arquiteto, Engenheiro de Qualidade, Product Manager, etc.) aos modelos. O sistema injeta automaticamente o papel e as diretrizes do especialista no *system_prompt* antes do debate, mudando radicalmente os pontos de vista da deliberação.
- **Juiz Integrado (Judge LLM):** Utiliza um LLM superior como "Juiz" para ler o histórico da deliberação, comparar argumentos, resolver divergências e construir um consenso bem elaborado.
- **Transcrição e Síntese Final:** Exporte toda a cadeia de raciocínio da deliberação em formato `.MD` com o clique de um botão.
- **Gestão de Prompts Dinâmicos:** Controle total sobre os *"System Prompts"*, divididos agora em categoria *Initial* (rodada 1) e *Round* (rodadas subsequentes). Personalize o comportamento geral do sistema para cada estágio da deliberação.
- **Proteção de Carga de Contexto (Preflight Modals):** Pop-ups de confirmação interativos estimam em tempo-real (`char/4`) se a carga de Histórico e Prompts vai estourar a *Context Window* de algum dos especialistas. Contas com validações ativas alertam se é necessário ativar a "Sumarização Automática". O mesmo se aplica ao solicitar a Síntese Final pelo Juiz.

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

- **Frontend:** Next.js 14 (App Router), React 18, Zustand (State Management LocalStorage), Tailwind CSS (Glassmorphism UI), Lucide Icons.
- **Backend:** Rotas de API Edge via Next.js lidando com parse, stream e mapeamento estrito para os 4 provedores diferentes.

---

## 🎨 Sobre a Interface

O design foca em imersão com tons escuros profundos inspirados no universo espacial (efeitos glassmorphism, translucidez com desfoque de cenário `backdrop-blur`). As respostas dos especialistas são fragmentadas automaticamente pelo sistema em duas fases visuais obrigatórias: **Análise** e **Conclusão Final**, facilitando a leitura e comparação instantânea do raciocínio analítico com o veredicto daquele modelo para o usuário final.

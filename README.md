# 🧠 Sistema de Deliberação Assistida por múltiplos LLMs

Bem-vindo ao **LLMs Debate**, uma plataforma interativa de *Raciocínio Multi-Agente* (Multi-Agent Reasoning) construída com Next.js 14, React e Tailwind CSS. 

Este projeto permite que você envie um _prompt_ e observe dezenas de diferentes IAs (Large Language Models) debatendo e refletindo sobre o seu problema em paralelo. O sistema permite rodadas de deliberação consecutivas (onde os modelos leem o que os outros especialistas disseram nas rodadas anteriores e melhoram suas próprias respostas) até convergir para uma síntese estruturada perfeita.

---

## ✨ Principais Funcionalidades

- **Múltiplos Provedores de API Integrados:** Suporte ativo nativo para **OpenRouter**, **OpenAI**, **Perplexity** e **Google Gemini** em uma única interface.
- **26 Modelos Especialistas:** Escolha a dedo qual IA vai fazer parte do seu grupo de deliberação. O sistema suporta os melhores raciocinadores do mundo:
   - *Família Claude 4.5 e 4.6 (Opus, Sonnet, Haiku)* (Removidos da OpenRouter; requer chave API direta no futuro)
   - *Família GPT-5 (High, Codex, Pro, Mini)* (Via OpenAI API)
   - *Família Gemini 3 (Pro e Flash com 1M de Tokens)* (Via Google Gemini API)
   - *Série Perplexity Sonar (Pesquisa web ao vivo)* (Via Perplexity API)
   - *5 Gigantes 100% Gratuitos via OpenRouter:* Qwen Next 80B Instruct, Llama 3.3 70B Instruct, Qwen3 VL Thinking (30B), Upstage Solar Pro 3 e Liquid LFM-2.5 1.2b Thinking.
- **Reflexão por Rodadas (Aprofundamento):** Os modelos não respondem apenas uma vez. Você pode iniciar a "Rodada 2", onde o sistema injeta as respostas de todos os especialistas da rodada passada no contexto, forçando-os a repensar suas ideias com base nas críticas uns dos outros.
- **Transcrição e Síntese Final:** Exporte toda a cadeia de raciocínio da deliberação em formato `.MD` com o clique de um botão.
- **Modelos Locais Offline:** O sistema consegue varrer automaticamente o seu **LM Studio** na porta `1234` e adicionar modelos locais executando diretos do seu equipamento (ex: Llama 3 70B, Qwen, etc) para participarem das rodadas sem custo de nuvem.

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

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel


Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Monitor BR 🇧🇷

Dashboard de monitoramento de produtos irregulares no Brasil com IA integrada.

## Features

- 🗺️ Mapa interativo com clustering de markers
- 📊 Estatísticas em tempo real
- 📡 Feed de notícias reais (Google News RSS)
- 🤖 Pesquisa inteligente com IA (Llama via Groq)
- 🔍 Filtros por severidade e fonte
- 🔔 Notificações de novos alertas
- 📱 Design responsivo

## Stack

- **Backend**: Node.js + Express
- **Frontend**: HTML/CSS/JS + Leaflet
- **IA**: Groq (Llama 3.1 8B) — gratuito
- **Dados**: Google News RSS (notícias reais)

## Deploy no Render

1. Faça fork deste repositório
2. No [Render](https://render.com), crie um novo **Web Service**
3. Conecte seu repositório
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
5. Adicione a variável de ambiente:
   - `GROQ_API_KEY` — obtenha grátis em [console.groq.com](https://console.groq.com)
6. Deploy!

## Rodar localmente

```bash
npm install
GROQ_API_KEY=sua_chave node backend/server.js
```

Abra `http://localhost:5000`

## Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/incidents` | GET | Incidentes (notícias reais) |
| `/api/news` | GET | Feed de notícias bruto |
| `/api/stats` | GET | Estatísticas |
| `/api/states` | GET | Ranking por estado |
| `/api/search?q=` | GET | Busca textual |
| `/api/ai-search` | POST | Pesquisa com IA |
| `/api/ai-status` | GET | Status da IA |

## Limites da IA (Groq - Gratuito)

- 30 requisições/minuto
- 14.400 requisições/dia
- 500.000 tokens/dia

## Licença

MIT

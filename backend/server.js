const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 300 }); // cache 5 min

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ===================== AI CONFIG =====================
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

// ===================== COORDENADAS =====================
const STATE_COORDS = {
  AC:{lat:-9.02,lon:-70.81}, AL:{lat:-9.57,lon:-36.78}, AP:{lat:1.41,lon:-51.77},
  AM:{lat:-3.47,lon:-65.10}, BA:{lat:-12.97,lon:-41.52}, CE:{lat:-5.20,lon:-39.53},
  DF:{lat:-15.78,lon:-47.93}, ES:{lat:-19.19,lon:-40.34}, GO:{lat:-16.64,lon:-49.31},
  MA:{lat:-4.96,lon:-45.27}, MT:{lat:-12.64,lon:-55.42}, MS:{lat:-20.51,lon:-54.54},
  MG:{lat:-18.10,lon:-44.38}, PA:{lat:-3.79,lon:-52.48}, PB:{lat:-7.12,lon:-36.72},
  PR:{lat:-24.89,lon:-51.55}, PE:{lat:-8.38,lon:-37.86}, PI:{lat:-6.60,lon:-42.28},
  RJ:{lat:-22.25,lon:-42.66}, RN:{lat:-5.81,lon:-36.59}, RS:{lat:-30.03,lon:-53.21},
  RO:{lat:-10.90,lon:-63.34}, RR:{lat:1.99,lon:-61.33}, SC:{lat:-27.45,lon:-50.95},
  SP:{lat:-22.19,lon:-48.78}, SE:{lat:-10.57,lon:-37.45}, TO:{lat:-10.17,lon:-48.30}
};

const STATE_NAMES = {
  AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",
  DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",
  MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",
  PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",
  SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins"
};

// Cidades conhecidas para geolocalização de notícias
const CITY_COORDS = {
  'são paulo':{lat:-23.55,lon:-46.63,uf:'SP'}, 'rio de janeiro':{lat:-22.9,lon:-43.17,uf:'RJ'},
  'belo horizonte':{lat:-19.92,lon:-43.94,uf:'MG'}, 'salvador':{lat:-12.97,lon:-38.5,uf:'BA'},
  'brasília':{lat:-15.78,lon:-47.93,uf:'DF'}, 'fortaleza':{lat:-3.72,lon:-38.54,uf:'CE'},
  'curitiba':{lat:-25.43,lon:-49.27,uf:'PR'}, 'manaus':{lat:-3.1,lon:-60.02,uf:'AM'},
  'porto alegre':{lat:-30.03,lon:-51.23,uf:'RS'}, 'recife':{lat:-8.05,lon:-34.88,uf:'PE'},
  'goiânia':{lat:-16.68,lon:-49.25,uf:'GO'}, 'belém':{lat:-1.46,lon:-48.49,uf:'PA'},
  'campinas':{lat:-22.9,lon:-47.06,uf:'SP'}, 'santos':{lat:-23.96,lon:-46.32,uf:'SP'},
  'florianópolis':{lat:-27.59,lon:-48.54,uf:'SC'}, 'vitória':{lat:-20.32,lon:-40.34,uf:'ES'},
  'campo grande':{lat:-20.44,lon:-54.64,uf:'MS'}, 'cuiabá':{lat:-15.6,lon:-56.1,uf:'MT'},
  'joão pessoa':{lat:-7.12,lon:-34.86,uf:'PB'}, 'natal':{lat:-5.79,lon:-35.21,uf:'RN'},
  'maceió':{lat:-9.67,lon:-35.74,uf:'AL'}, 'aracaju':{lat:-10.91,lon:-37.07,uf:'SE'},
  'teresina':{lat:-5.09,lon:-42.8,uf:'PI'}, 'são luís':{lat:-2.53,lon:-44.28,uf:'MA'},
  'foz do iguaçu':{lat:-25.5,lon:-54.5,uf:'PR'}, 'osasco':{lat:-23.53,lon:-46.79,uf:'SP'},
  'guarulhos':{lat:-23.45,lon:-46.53,uf:'SP'}, 'sorocaba':{lat:-23.5,lon:-47.46,uf:'SP'},
  'ribeirão preto':{lat:-21.18,lon:-47.81,uf:'SP'}, 'uberlândia':{lat:-18.92,lon:-48.28,uf:'MG'},
  'londrina':{lat:-23.31,lon:-51.16,uf:'PR'}, 'joinville':{lat:-26.3,lon:-48.85,uf:'SC'},
  'niterói':{lat:-22.88,lon:-43.11,uf:'RJ'}, 'campos dos goytacazes':{lat:-21.75,lon:-41.32,uf:'RJ'},
  'macapá':{lat:0.03,lon:-51.07,uf:'AP'}, 'rio branco':{lat:-9.97,lon:-67.81,uf:'AC'},
  'boa vista':{lat:2.82,lon:-60.67,uf:'RR'}, 'palmas':{lat:-10.17,lon:-48.33,uf:'TO'},
  'ponta grossa':{lat:-25.09,lon:-50.16,uf:'PR'}, 'caxias do sul':{lat:-29.17,lon:-51.18,uf:'RS'},
  'pelotas':{lat:-31.77,lon:-52.34,uf:'RS'}, 'anápolis':{lat:-16.33,lon:-48.95,uf:'GO'},
};

// ===================== RSS FEEDS (notícias reais) =====================
const RSS_FEEDS = [
  // Google News - termos de fiscalização
  'https://news.google.com/rss/search?q=apreensão+produtos+irregulares+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=contrabando+Brasil+apreendido&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=ANVISA+interdição+produto&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=Receita+Federal+apreensão+fronteira&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=produto+falsificado+Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=INMETRO+irregular+multa&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=combustível+adulterado+operação&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  'https://news.google.com/rss/search?q=medicamento+falso+apreendido&hl=pt-BR&gl=BR&ceid=BR:pt-419',
];

// ===================== RSS PARSER =====================
function parseRSSItems(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const source = extractTag(itemXml, 'source');
    const description = extractTag(itemXml, 'description');

    if (title) {
      items.push({
        title: cleanHTML(title),
        link,
        pubDate: pubDate ? new Date(pubDate) : new Date(),
        source: source || 'Google News',
        description: cleanHTML(description || '').slice(0, 300)
      });
    }
  }

  return items;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function cleanHTML(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// ===================== NEWS FETCHER =====================
async function fetchAllNews() {
  const cacheKey = 'all_news';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const allItems = [];

  const promises = RSS_FEEDS.map(async (feedUrl) => {
    try {
      const resp = await axios.get(feedUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'MonitorBR/1.0' }
      });
      const items = parseRSSItems(resp.data);
      allItems.push(...items);
    } catch (e) {
      console.log(`Feed falhou: ${feedUrl.split('q=')[1]?.split('&')[0] || feedUrl}`);
    }
  });

  await Promise.allSettled(promises);

  // Ordenar por data (mais recente primeiro)
  allItems.sort((a, b) => b.pubDate - a.pubDate);

  // Deduplicar por título
  const seen = new Set();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  cache.set(cacheKey, unique);
  return unique;
}

// ===================== NEWS → INCIDENTS =====================
function newsToIncidents(newsItems) {
  return newsItems.map((item, idx) => {
    const titleLower = item.title.toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const combined = titleLower + ' ' + descLower;

    // Detectar severidade
    let severity = 'medium';
    if (combined.includes('crítica') || combined.includes('grave') || combined.includes('grandes quantidades') ||
        combined.includes('milhões') || combined.includes('operação') || combined.includes('policia federal')) {
      severity = 'critical';
    } else if (combined.includes('apreensão') || combined.includes('apreendido') || combined.includes('multa') ||
               combined.includes('interdição') || combined.includes('falsificado')) {
      severity = 'high';
    }

    // Detectar categoria
    let category = 'Geral';
    if (combined.includes('contrabando') || combined.includes('contrabando')) category = 'Contrabando';
    else if (combined.includes('falsific')) category = 'Falsificação';
    else if (combined.includes('medicamento') || combined.includes('farmac') || combined.includes('remédio')) category = 'Medicamentos';
    else if (combined.includes('alimento') || combined.includes('carne') || combined.includes('bebida')) category = 'Alimentos';
    else if (combined.includes('combustível') || combined.includes('gasolina') || combined.includes('diesel')) category = 'Combustível';
    else if (combined.includes('cosmético') || combined.includes('beleza')) category = 'Cosméticos';
    else if (combined.includes('eletrônic') || combined.includes('celular') || combined.includes('computador')) category = 'Eletrônicos';
    else if (combined.includes('agrotóxic') || combined.includes('pesticida')) category = 'Agronegócio';
    else if (combined.includes('brinquedo') || combined.includes('inmetro')) category = 'Segurança';
    else if (combined.includes('anvisa') || combined.includes('saúde')) category = 'Saúde';

    // Detectar localização
    let lat = -14.5 + (Math.random() - 0.5) * 20;
    let lon = -52 + (Math.random() - 0.5) * 15;
    let state = 'BR';
    let city = 'Brasil';

    for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
      if (combined.includes(cityName)) {
        lat = coords.lat + (Math.random() - 0.5) * 0.5;
        lon = coords.lon + (Math.random() - 0.5) * 0.5;
        state = coords.uf;
        city = cityName.charAt(0).toUpperCase() + cityName.slice(1);
        break;
      }
    }

    // Tentar detectar estado por sigla
    if (state === 'BR') {
      for (const [uf, name] of Object.entries(STATE_NAMES)) {
        if (combined.includes(uf.toLowerCase()) || combined.includes(name.toLowerCase())) {
          state = uf;
          const coords = STATE_COORDS[uf];
          if (coords) {
            lat = coords.lat + (Math.random() - 0.5) * 2;
            lon = coords.lon + (Math.random() - 0.5) * 2;
          }
          break;
        }
      }
    }

    return {
      id: `news_${idx}_${Date.now()}`,
      title: item.title,
      desc: item.description || item.title,
      state,
      city,
      lat,
      lon,
      severity,
      category,
      value: 0,
      source: item.source || 'Google News',
      date: item.pubDate.toISOString().split('T')[0],
      link: item.link,
      isNews: true
    };
  });
}

// ===================== ENDPOINTS =====================

// GET /api/incidents - Notícias reais como incidentes
app.get('/api/incidents', async (req, res) => {
  try {
    const news = await fetchAllNews();
    const incidents = newsToIncidents(news);

    res.json({
      incidents,
      total: incidents.length,
      source: 'Google News (notícias reais)',
      timestamp: new Date().toISOString(),
      isLive: true
    });
  } catch (error) {
    console.error('Erro /api/incidents:', error.message);
    res.json(getFallbackIncidents());
  }
});

// GET /api/news - Feed de notícias bruto
app.get('/api/news', async (req, res) => {
  try {
    const news = await fetchAllNews();
    res.json({
      items: news.slice(0, 30),
      total: news.length,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats
app.get('/api/stats', async (req, res) => {
  try {
    const news = await fetchAllNews();
    const incidents = newsToIncidents(news);

    const states = new Set(incidents.map(i => i.state).filter(s => s !== 'BR'));
    const critical = incidents.filter(i => i.severity === 'critical').length;

    res.json({
      totalAlerts: incidents.length,
      criticalCases: critical,
      affectedStates: states.size,
      estimatedValue: 0,
      sources: ['Google News'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/states
app.get('/api/states', async (req, res) => {
  try {
    const news = await fetchAllNews();
    const incidents = newsToIncidents(news);

    const counts = {};
    incidents.forEach(i => {
      if (i.state !== 'BR') counts[i.state] = (counts[i.state] || 0) + 1;
    });

    const ranked = Object.entries(counts)
      .map(([uf, count]) => ({
        state: uf,
        name: STATE_NAMES[uf] || uf,
        count,
        coords: STATE_COORDS[uf]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/search?q=
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const news = await fetchAllNews();
    const qLower = q.toLowerCase();
    const filtered = news.filter(n =>
      n.title.toLowerCase().includes(qLower) ||
      (n.description || '').toLowerCase().includes(qLower)
    );

    res.json(filtered.slice(0, 20).map(n => ({
      title: n.title,
      source: n.source,
      date: n.pubDate,
      link: n.link
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai-search - Pesquisa inteligente com IA
app.post('/api/ai-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query obrigatória' });

    // 1. Buscar notícias reais
    const allNews = await fetchAllNews();
    const qLower = query.toLowerCase();

    // Filtrar notícias relevantes
    const relevantNews = allNews.filter(n => {
      const combined = (n.title + ' ' + (n.description || '')).toLowerCase();
      return combined.includes(qLower) ||
             qLower.split(' ').some(word => word.length > 3 && combined.includes(word));
    });

    // Buscar mais notícias específicas
    let extraNews = [];
    try {
      const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query + ' Brasil')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
      const resp = await axios.get(searchUrl, { timeout: 10000, headers: { 'User-Agent': 'MonitorBR/1.0' } });
      extraNews = parseRSSItems(resp.data);
    } catch {}

    const combinedNews = [...relevantNews, ...extraNews];
    // Deduplicate
    const seen = new Set();
    const uniqueNews = combinedNews.filter(n => {
      const key = n.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 15);

    // 2. Buscar Wikipedia
    let wikiResults = [];
    try {
      const wikiSearch = await axios.get('https://pt.wikipedia.org/w/api.php', {
        params: { action: 'query', list: 'search', srsearch: query, srlimit: 3, format: 'json', origin: '*' },
        timeout: 8000
      });
      if (wikiSearch.data.query?.search) {
        for (const item of wikiSearch.data.query.search) {
          try {
            const summary = await axios.get(
              `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`,
              { timeout: 5000 }
            );
            if (summary.data.extract) wikiResults.push(summary.data);
          } catch {}
        }
      }
    } catch {}

    // 3. Montar contexto para IA
    let context = `Pesquisa: "${query}"\n\nContexto: Monitor BR - monitoramento de produtos irregulares no Brasil.\n\n`;

    if (uniqueNews.length > 0) {
      context += `=== NOTÍCIAS REAIS ENCONTRADAS (${uniqueNews.length}) ===\n`;
      uniqueNews.forEach((n, i) => {
        context += `${i+1}. [${n.source}] ${n.title}\n   ${n.description || ''}\n   Data: ${n.pubDate.toISOString().split('T')[0]}\n\n`;
      });
    }

    if (wikiResults.length > 0) {
      context += `=== REFERÊNCIAS WIKIPEDIA ===\n`;
      wikiResults.forEach(w => {
        context += `- ${w.title}: ${w.extract}\n`;
      });
      context += '\n';
    }

    context += `=== INSTRUÇÕES ===\n`;
    context += `Com base nas notícias acima, forneça um relatório sobre "${query}" no contexto de produtos irregulares/fiscalização no Brasil.\n`;
    context += `Formato:\n1. Resumo em 2-3 parágrafos\n2. Bullet points com os achados principais\n3. Fontes citadas\n4. Classificação de risco (ALTO/MÉDIO/BAIXO)\n`;
    context += `Responda em português brasileiro.`;

    // 4. Chamar IA
    if (!GROQ_API_KEY) {
      return res.json({
        answer: formatWithoutAI(query, uniqueNews, wikiResults),
        sources: uniqueNews.slice(0, 5).map(n => ({ name: n.source, url: n.link })),
        newsCount: uniqueNews.length,
        aiPowered: false
      });
    }

    const aiResponse = await callGroq(context);

    res.json({
      answer: aiResponse,
      sources: uniqueNews.slice(0, 5).map(n => ({ name: n.source, url: n.link })),
      newsCount: uniqueNews.length,
      aiPowered: true,
      model: GROQ_MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ai-search:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai-status
app.get('/api/ai-status', (req, res) => {
  res.json({
    aiEnabled: !!GROQ_API_KEY,
    model: GROQ_MODEL,
    provider: 'Groq (Llama 3.1 8B)',
    limits: { rpm: 30, rpd: 14400, tpm: 6000, tpd: 500000 },
    setupUrl: 'https://console.groq.com'
  });
});

// ===================== AI =====================
async function callGroq(context) {
  const response = await axios.post(GROQ_BASE, {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'Você é um analista do Monitor BR, sistema de monitoramento de produtos irregulares no Brasil. Analise notícias reais e gere relatórios claros, objetivos, em português brasileiro. Cite sempre as fontes.'
      },
      { role: 'user', content: context }
    ],
    temperature: 0.3,
    max_tokens: 1500
  }, {
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 20000
  });
  return response.data.choices[0].message.content;
}

function formatWithoutAI(query, news, wiki) {
  let text = `📰 Resultados para: "${query}"\n\n`;
  if (news.length > 0) {
    text += `Notícias encontradas (${news.length}):\n`;
    news.forEach((n, i) => {
      text += `${i+1}. ${n.title}\n   Fonte: ${n.source} | ${n.pubDate.toISOString().split('T')[0]}\n\n`;
    });
  } else {
    text += 'Nenhuma notícia encontrada.\n\n';
  }
  if (wiki.length > 0) {
    text += `Referências:\n`;
    wiki.forEach(w => { text += `• ${w.title}: ${w.extract?.slice(0, 150)}...\n`; });
  }
  text += `\n⚙️ Para análises com IA, configure GROQ_API_KEY (gratuito em console.groq.com)`;
  return text;
}

function getFallbackIncidents() {
  return {
    incidents: [],
    total: 0,
    source: 'Indisponível',
    timestamp: new Date().toISOString(),
    fallback: true,
    note: 'Não foi possível buscar notícias. Verifique a conexão.'
  };
}

// ===================== START =====================
app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║   Monitor BR - Backend Rodando       ║`);
  console.log(`  ║   Porta: ${PORT}                        ║`);
  console.log(`  ║   http://localhost:${PORT}              ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
  console.log(`  Endpoints:`);
  console.log(`    GET  /api/incidents  - Incidentes (notícias reais)`);
  console.log(`    GET  /api/news       - Feed de notícias bruto`);
  console.log(`    GET  /api/stats      - Estatísticas`);
  console.log(`    GET  /api/states     - Ranking por estado`);
  console.log(`    GET  /api/search?q=  - Busca textual`);
  console.log(`    POST /api/ai-search  - Pesquisa com IA`);
  console.log(`    GET  /api/ai-status  - Status da IA`);
  console.log();
});

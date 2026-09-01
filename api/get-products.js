const PRODUCTS_API_URL = 'https://comercialsimonini.com.br/wp-json/wc/store/v1/products';

function textoSemHtml(texto = '') {
  return texto.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function precoEmReais(prices) {
  const casasDecimais = prices?.currency_minor_unit ?? 2;
  const precoEmCentavos = Number(prices?.price);
  return precoEmCentavos / (10 ** casasDecimais);
}

module.exports = async function handler(req, res) {
  // API Security Check
  const apiKey = req.headers['x-api-key'];
  const secret = process.env.API_SECRET;

  if (!secret) {
    console.error('ERRO: API_SECRET não configurada no ambiente da Vercel');
    return res.status(500).json({ success: false, message: 'Erro de configuração no servidor' });
  }

  if (apiKey !== secret) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  try {
    const termo = req.query.q?.trim();
    if (!termo) {
      return res.status(400).json({
        success: false,
        message: 'Digite o código ou nome do produto para pesquisar.'
      });
    }

    const parametros = new URLSearchParams({ per_page: '20' });
    if (/^\d{8,14}$/.test(termo)) {
      parametros.set('sku', termo);
    } else {
      parametros.set('search', termo);
    }
    const targetUrl = `${PRODUCTS_API_URL}?${parametros}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/plain,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao acessar o site: ${response.status} ${response.statusText}`);
    }

    const produtosDoSite = await response.json();
    const products = produtosDoSite
      .map(produto => ({
        nome: produto.name,
        preco: precoEmReais(produto.prices) / 1.1,
        link: produto.permalink,
        detalhe: textoSemHtml(produto.short_description || produto.description),
        codigo: produto.sku || `SITE-PRODUTO-${produto.id}`
      }))
      .filter(produto => Number.isFinite(produto.preco));

    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Erro no scraping:', error);
    return res.status(500).json({
      success: false,
      message: `Erro interno ao coletar produtos do site: ${error.message}`
    });
  }
}

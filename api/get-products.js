const cheerio = require('cheerio');
const PRODUCTS_URL = 'https://comercialsimonini.com.br/todos-os-produtos/';

function gerarCodigoProduto(nome, link, indice) {
  const codigoNoNome = nome.match(/^([a-z]+\d+[a-z0-9/-]*)\b/i);
  if (codigoNoNome) return codigoNoNome[1].toUpperCase();

  try {
    const partesDoLink = new URL(link).pathname.split('/').filter(Boolean);
    const identificador = partesDoLink.at(-1);
    if (identificador) return `SITE-${identificador}`.toUpperCase();
  } catch {
    // Usa um código alternativo quando o produto não tem link válido.
  }

  return `SITE-PRODUTO-${indice + 1}`;
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
    const { q } = req.query;
    const targetUrl = q
      ? `${PRODUCTS_URL}?s=${encodeURIComponent(q)}`
      : PRODUCTS_URL;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao acessar o site: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    $('.fusion-product-content').each((i, element) => {
      try {
        const titleElement = $(element).find('h3.product-title a');
        const priceElement = $(element).find('span.woocommerce-Price-amount.amount bdi');

        if (titleElement.length && priceElement.length) {
          const name = titleElement.text().trim();
          const priceStr = priceElement.text().trim();
          const link = titleElement.attr('href');

          const numericString = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
          const sitePrice = parseFloat(numericString);

          if (!isNaN(sitePrice)) {
            const physicalPrice = sitePrice / 1.1;

            products.push({
              nome: name,
              preco: physicalPrice,
              link: link,
              detalhe: '',
              codigo: gerarCodigoProduto(name, link, i)
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao processar produto ${i}:`, err);
      }
    });

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

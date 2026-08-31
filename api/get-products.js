import cheerio from 'cheerio';

export default async function handler(req, res) {
  // API Security Check
  if (req.headers['x-api-key'] !== process.env.API_SECRET) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  try {
    const targetUrl = 'https://comercialsimonini.com.br/shop/';
    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`Erro ao acessar o site: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const products = [];

    // Baseado na investigação, cada produto está dentro de .fusion-product-content ou similar
    // Vamos iterar sobre os containers de produtos
    $('.fusion-product-content').each((i, element) => {
      try {
        const titleElement = $(element).find('h3.product-title a');
        const priceElement = $(element).find('span.woocommerce-Price-amount.amount bdi');

        if (titleElement.length && priceElement.length) {
          const name = titleElement.text().trim();
          const priceStr = priceElement.text().trim();
          const link = titleElement.attr('href');

          // Lógica de correção de preço: Preço Loja Física = Preço do Site / 1.1
          // Remove tudo que não é dígito ou vírgula
          const numericString = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
          const sitePrice = parseFloat(numericString);

          if (!isNaN(sitePrice)) {
            const physicalPrice = sitePrice / 1.1;

            products.push({
              nome: name,
              preco: physicalPrice,
              link: link,
              codigo: `SCRAPE-${i + 1}` // Código temporário para o teste
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
      message: 'Erro interno ao coletar produtos do site'
    });
  }
}

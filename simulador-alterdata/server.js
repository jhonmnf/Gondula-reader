const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Banco de dados simulado
const catalogo = [
  { codigo: '7898541474111', nome: 'Cloro Gel Altolim', detalhe: '2 litros · Limpeza geral', preco: 12.99 },
  { codigo: '7896006731223', nome: 'Detergente Neutro Brilho', detalhe: '500 ml · Limpeza de louças', preco: 3.49 },
  { codigo: '7891024187543', nome: 'Saco para Lixo Reforçado', detalhe: '50 litros · Rolo com 10 unidades', preco: 16.9 },
  { codigo: '7890000074111', nome: 'Produto Teste Final 74111', detalhe: 'Teste de duplicidade', preco: 5.00 },
  { codigo: '1234567890123', nome: 'Produto Genérico A', detalhe: 'Teste A', preco: 10.00 },
  { codigo: '1234567890456', nome: 'Produto Genérico B', detalhe: 'Teste B', preco: 20.00 },
];

app.get('/api/product/:codigo', (req, res) => {
  const termo = req.params.codigo.trim().toLowerCase();
  console.log(`Busca recebida: ${termo}`);

  // 1. Busca exata
  const exato = catalogo.find(p => p.codigo === termo);
  if (exato) {
    console.log('Match exato encontrado!');
    return res.json({ success: true, data: exato });
  }

  // 2. Busca por sufixo (os últimos números)
  const matches = catalogo.filter(p => p.codigo.endsWith(termo));

  if (matches.length > 0) {
    console.log(`Encontrados ${matches.length} produtos terminando em ${termo}`);
    // Se houver apenas um, retorna o objeto. Se houver vários, retorna a lista.
    if (matches.length === 1) {
      return res.json({ success: true, data: matches[0] });
    } else {
      return res.json({ success: true, data: matches });
    }
  }

  console.log('Nenhum produto encontrado.');
  res.status(404).json({ success: false, message: 'Produto não encontrado' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor Alterdata Simulador rodando em http://localhost:${port}`);
  console.log(`Endpoint de teste: http://localhost:${port}/api/product/74111`);
});

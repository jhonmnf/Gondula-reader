const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: true, // In production, replace with specific allowed origins
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Banco de dados simulado
const catalogo = [
  { codigo: '7898541474111', nome: 'Cloro Gel Altolim', detalhe: '2 litros · Limpeza geral', preco: 12.99 },
  { codigo: '7896006731223', nome: 'Detergente Neutro Brilho', detalhe: '500 ml · Limpeza de louças', preco: 3.49 },
  { codigo: '7891024187543', nome: 'Saco para Lixo Reforçado', detalhe: '50 litros · Rolo com 10 unidades', preco: 16.9 },
  { codigo: '7890000074111', nome: 'Produto Teste Final 74111', detalhe: 'Teste de duplicidade', preco: 5.00 },
  { codigo: '1234567890123', nome: 'Produto Genérico A', detalhe: 'Teste A', preco: 10.00 },
  { codigo: '1234567890456', nome: 'Produto Genérico B', detalhe: 'Teste B', preco: 20.00 },
];

// Middleware de Autenticação (Simulando RLS/Access Control)
const authenticate = (req, res, next) => {
  const token = req.cookies.session_token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Não autenticado. Por favor, faça login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada.' });
  }
};

// Endpoint de Login (Server-side Auth + Encrypted Password)
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
  }

  if (usuario !== process.env.ADMIN_USER) {
    return res.status(401).json({ success: false, message: 'Credenciais incorretas.' });
  }

  const isPasswordValid = await bcrypt.compare(senha, process.env.ADMIN_PASSWORD_HASH);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Credenciais incorretas.' });
  }

  // Gerar Token JWT
  const token = jwt.sign(
    { user: usuario, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // Proteção de Cookies: httpOnly e secure
  res.cookie('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000 // 2 horas
  });

  res.json({ success: true, message: 'Login realizado com sucesso!' });
});

// Endpoint de Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('session_token');
  res.json({ success: true, message: 'Logout realizado com sucesso!' });
});

// Endpoint Protegido (RLS Simulation)
app.get('/api/product/:codigo', authenticate, (req, res) => {
  const termo = req.params.codigo.trim().toLowerCase();
  console.log(`Busca recebida por ${req.user.user}: ${termo}`);

  const exato = catalogo.find(p => p.codigo === termo);
  if (exato) {
    return res.json({ success: true, data: exato });
  }

  const matches = catalogo.filter(p => p.codigo.endsWith(termo));
  if (matches.length > 0) {
    if (matches.length === 1) {
      return res.json({ success: true, data: matches[0] });
    } else {
      return res.json({ success: true, data: matches });
    }
  }

  res.status(404).json({ success: false, message: 'Produto não encontrado' });
});

app.listen(port, () => {
  console.log(`🚀 Servidor Alterdata Hardened rodando em http://localhost:${port}`);
});

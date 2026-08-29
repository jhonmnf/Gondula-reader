export default async function handler(req, res) {
  // API Security Check
  if (req.headers['x-api-key'] !== process.env.API_SECRET) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { usuario, senha } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('ERRO DE CONFIGURAÇÃO: ADMIN_USER ou ADMIN_PASS não definidos nas variáveis de ambiente.');
    return res.status(500).json({ success: false, message: 'Erro de configuração no servidor. Contate o administrador.' });
  }

  if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, message: 'Credenciais incorretas' });
}

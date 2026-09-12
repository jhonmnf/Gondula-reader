const { compararComSeguranca, definirCookieDeSessao } = require('./_lib/auth');
const { bloquearTentativasDeLogin, registrarFalhaDeLogin, limparTentativasDeLogin } = require('./_lib/rate-limit');

module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  if (bloquearTentativasDeLogin(req, res)) return;

  const { usuario, senha } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS;

  if (!ADMIN_USER || !ADMIN_PASS) {
    console.error('ERRO DE CONFIGURAÇÃO: ADMIN_USER ou ADMIN_PASS não definidos nas variáveis de ambiente.');
    return res.status(500).json({ success: false, message: 'Erro de configuração no servidor. Contate o administrador.' });
  }

  if (typeof usuario === 'string' && typeof senha === 'string' && compararComSeguranca(usuario, ADMIN_USER) && compararComSeguranca(senha, ADMIN_PASS)) {
    limparTentativasDeLogin(req);
    definirCookieDeSessao(res, usuario);
    return res.status(200).json({ success: true });
  }

  registrarFalhaDeLogin(req);
  return res.status(401).json({ success: false, message: 'Credenciais incorretas' });
}

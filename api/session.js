const { validarSessao } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método não permitido.' });

  const sessao = validarSessao(req);
  if (!sessao) return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada.' });

  return res.status(200).json({ success: true });
};

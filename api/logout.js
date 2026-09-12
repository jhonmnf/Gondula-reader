const { limparCookieDeSessao } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Método não permitido.' });

  limparCookieDeSessao(res);
  return res.status(200).json({ success: true });
};

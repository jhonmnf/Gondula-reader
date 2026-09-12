const { supabase } = require('./_lib/supabase');
const { exigirSessao } = require('./_lib/auth');
const { validarFiltros, consultarConferencias } = require('./_lib/conferences');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método não permitido.' });
  if (!exigirSessao(req, res)) return;

  const filtros = validarFiltros(req.query);
  if (!filtros) return res.status(400).json({ success: false, message: 'Filtros de consulta inválidos.' });

  try {
    const resultado = await consultarConferencias(supabase, filtros);
    return res.status(200).json({ success: true, ...resultado });
  } catch (error) {
    console.error('Erro ao consultar conferências:', error);
    return res.status(500).json({ success: false, message: 'Não foi possível carregar as conferências. Tente novamente.' });
  }
};

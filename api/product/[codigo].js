const { supabase } = require('../_lib/supabase');
const { exigirSessao } = require('../_lib/auth');
const { validarTermoDeBusca } = require('../_lib/validation');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Método não permitido.' });
  if (!exigirSessao(req, res)) return;

  const termo = validarTermoDeBusca(req.query.codigo);
  if (!termo) return res.status(400).json({ success: false, message: 'Código ou nome inválido.' });

  try {
    // 1. Busca exata por código
    const { data: exactData } = await supabase
      .from('products')
      .select('codigo,nome,detalhe,preco')
      .eq('codigo', termo)
      .single();

    if (exactData) {
      return res.status(200).json({
        success: true,
        data: exactData
      });
    }

    // 2. Busca por código (sufixo) ou por nome (parcial)
    const { data: matches } = await supabase
      .from('products')
      .select('codigo,nome,detalhe,preco')
      .or(`codigo.ilike.%${termo},nome.ilike.%${termo}%`)
      .limit(20);

    if (matches && matches.length > 0) {
      if (matches.length === 1) {
        return res.status(200).json({
          success: true,
          data: matches[0]
        });
      } else {
        return res.status(200).json({
          success: true,
          data: matches
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });

  } catch (error) {
    console.error('Erro no Supabase:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

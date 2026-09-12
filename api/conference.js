const { supabase } = require('./_lib/supabase');
const { exigirSessao } = require('./_lib/auth');
const { validarConferencia } = require('./_lib/validation');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  if (!exigirSessao(req, res)) return;

  const resultadoDaValidacao = validarConferencia(req.body || {});
  if (resultadoDaValidacao.error) {
    return res.status(400).json({ success: false, message: resultadoDaValidacao.error });
  }

  const { codigo, nome, detalhe, preco, status, em, operator } = resultadoDaValidacao.data;

  try {
    const { data: produtoExistente, error: erroAoBuscarProduto } = await supabase
      .from('products')
      .select('codigo')
      .eq('codigo', codigo)
      .maybeSingle();

    if (erroAoBuscarProduto) throw erroAoBuscarProduto;

    if (!produtoExistente) {
      if (!nome) {
        return res.status(400).json({
          success: false,
          message: 'Não foi possível cadastrar o produto antes da conferência.'
        });
      }

      const { error: erroAoCadastrarProduto } = await supabase
        .from('products')
        .insert([{ codigo, nome, detalhe: detalhe || '', preco }]);

      if (erroAoCadastrarProduto) throw erroAoCadastrarProduto;
    }

    const { error } = await supabase
      .from('conferences')
      .insert([
        {
          product_codigo: codigo,
          status: status,
          timestamp: em || new Date().toISOString(),
          operator: operator || 'system'
        }
      ]);

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Conferência registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar conferência no Supabase:', error);
    return res.status(500).json({
      success: false,
      message: 'Não foi possível registrar a conferência.'
    });
  }
}

import { supabase } from './_lib/supabase';

export default async function handler(req, res) {
  const { codigo } = req.query;
  const termo = codigo.trim().toLowerCase();

  try {
    // 1. Busca exata por código
    const { data: exactData } = await supabase
      .from('products')
      .select('*')
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
      .select('*')
      .or(`codigo.ilike.%${termo},nome.ilike.%${termo}%`);

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

import { supabase } from './_lib/supabase';

export default async function handler(req, res) {
  const { codigo } = req.query;
  const termo = codigo.trim().toLowerCase();

  try {
    // 1. Busca exata
    const { data: exactData, error: exactError } = await supabase
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

    // 2. Busca por sufixo (os últimos números)
    // Supabase (Postgres) usa .ilike() para buscas parciais case-insensitive
    const { data: matches, error: matchesError } = await supabase
      .from('products')
      .select('*')
      .ilike('codigo', `%${termo}`);

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

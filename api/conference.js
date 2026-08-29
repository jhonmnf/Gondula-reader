import { supabase } from './_lib/supabase';

export default async function handler(req, res) {
  // API Security Check
  if (req.headers['x-api-key'] !== process.env.API_SECRET) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  const { codigo, nome, status, em, operator } = req.body;

  if (!codigo || !status) {
    return res.status(400).json({ success: false, message: 'Dados insuficientes' });
  }

  try {
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
      message: 'Erro interno do servidor'
    });
  }
}

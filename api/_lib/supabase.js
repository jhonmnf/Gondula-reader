const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem ser configuradas nas variáveis de ambiente.');
}

// Esta chave fica apenas no servidor da Vercel. Ela permite salvar as conferências
// mesmo com a proteção da tabela ativada no Supabase.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = { supabase };

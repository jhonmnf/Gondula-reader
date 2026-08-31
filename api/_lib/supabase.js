const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY devem ser configuradas nas variáveis de ambiente.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };

const TAMANHO_PAGINA = 20;
const STATUS_PERMITIDOS = new Set(['correta', 'divergente', 'ausente']);

function validarFiltros(query = {}) {
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina);
  const status = query.status || '';

  if (!Number.isSafeInteger(pagina) || pagina < 1 || pagina > 10000 || (status && !STATUS_PERMITIDOS.has(status))) {
    return null;
  }

  return { pagina, status };
}

async function consultarConferencias(cliente, { pagina, status }) {
  const inicio = (pagina - 1) * TAMANHO_PAGINA;
  let consulta = cliente.from('conferences')
    .select('product_codigo,status,timestamp,operator', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (status) consulta = consulta.eq('status', status);
  const { data: conferencias, count, error } = await consulta.range(inicio, inicio + TAMANHO_PAGINA - 1);
  if (error) throw error;

  const codigos = [...new Set((conferencias || []).map(item => item.product_codigo))];
  const nomes = new Map();
  if (codigos.length > 0) {
    const { data: produtos, error: erroProdutos } = await cliente.from('products').select('codigo,nome').in('codigo', codigos);
    if (erroProdutos) throw erroProdutos;
    for (const produto of produtos || []) nomes.set(produto.codigo, produto.nome);
  }

  return {
    data: (conferencias || []).map(item => ({ ...item, nome: nomes.get(item.product_codigo) || 'Produto não disponível' })),
    pagina,
    total: count || 0,
    paginas: Math.max(1, Math.ceil((count || 0) / TAMANHO_PAGINA))
  };
}

module.exports = { validarFiltros, consultarConferencias };

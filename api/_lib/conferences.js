const TAMANHO_PAGINA = 20;
const STATUS_PERMITIDOS = new Set(['correta', 'divergente', 'ausente']);
const PERIODOS_PERMITIDOS = new Set(['hoje', 'ontem', '7dias', '30dias']);
const FUSO_HORARIO = 'America/Sao_Paulo';

function meiaNoiteLocal(diaUtc) {
  let instante = diaUtc;
  const formatador = new Intl.DateTimeFormat('en-US', { timeZone: FUSO_HORARIO, timeZoneName: 'longOffset' });
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const fuso = formatador.formatToParts(new Date(instante)).find(parte => parte.type === 'timeZoneName').value;
    const partes = fuso.match(/GMT([+-])(\d{2}):(\d{2})/);
    const minutos = partes ? (Number(partes[2]) * 60 + Number(partes[3])) * (partes[1] === '+' ? 1 : -1) : 0;
    instante = diaUtc - minutos * 60_000;
  }
  return new Date(instante).toISOString();
}

function obterIntervaloPeriodo(periodo, agora = new Date()) {
  if (!periodo) return null;
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_HORARIO, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(agora);
  const valor = tipo => Number(partes.find(parte => parte.type === tipo).value);
  const hoje = Date.UTC(valor('year'), valor('month') - 1, valor('day'));
  const dia = 86_400_000;
  const diasAnteriores = { hoje: 0, ontem: 1, '7dias': 6, '30dias': 29 }[periodo];
  return {
    inicio: meiaNoiteLocal(hoje - diasAnteriores * dia),
    fim: meiaNoiteLocal(hoje + (periodo === 'ontem' ? 0 : dia))
  };
}

function validarFiltros(query = {}) {
  const pagina = query.pagina === undefined ? 1 : Number(query.pagina);
  const status = query.status || '';
  const periodo = query.periodo || '';

  if (!Number.isSafeInteger(pagina) || pagina < 1 || pagina > 10000 || (status && !STATUS_PERMITIDOS.has(status)) || (periodo && !PERIODOS_PERMITIDOS.has(periodo))) {
    return null;
  }

  return { pagina, status, periodo };
}

async function consultarConferencias(cliente, { pagina, status, periodo = '' }, agora = new Date()) {
  const inicio = (pagina - 1) * TAMANHO_PAGINA;
  let consulta = cliente.from('conferences')
    .select('product_codigo,status,timestamp,operator', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (status) consulta = consulta.eq('status', status);
  const intervalo = obterIntervaloPeriodo(periodo, agora);
  if (intervalo) consulta = consulta.gte('timestamp', intervalo.inicio).lt('timestamp', intervalo.fim);
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

module.exports = { validarFiltros, consultarConferencias, obterIntervaloPeriodo };

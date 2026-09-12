const STATUS_PERMITIDOS = new Set(['correta', 'divergente', 'ausente']);

function textoLimpo(valor, limite) {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim().replace(/\s+/g, ' ');
  return texto.length > 0 && texto.length <= limite ? texto : null;
}

function validarConferencia(corpo) {
  const codigo = textoLimpo(corpo.codigo, 80);
  const status = textoLimpo(corpo.status, 20);
  const operador = textoLimpo(corpo.operator, 100);
  const nome = textoLimpo(corpo.nome, 180);
  const detalhe = typeof corpo.detalhe === 'string' ? corpo.detalhe.trim().slice(0, 1200) : '';
  const preco = Number(corpo.preco);
  const data = corpo.em ? new Date(corpo.em) : new Date();

  if (!codigo || !STATUS_PERMITIDOS.has(status) || !operador || !Number.isFinite(preco) || preco < 0 || preco > 1_000_000 || Number.isNaN(data.getTime())) {
    return { error: 'Dados da conferência inválidos.' };
  }

  return {
    data: {
      codigo,
      nome,
      detalhe,
      preco,
      status,
      operator: operador,
      em: data.toISOString()
    }
  };
}

function validarTermoDeBusca(valor) {
  const termo = textoLimpo(valor, 80);
  if (!termo || !/^[\p{L}\p{N} .-]+$/u.test(termo)) return null;
  return termo;
}

module.exports = { validarConferencia, validarTermoDeBusca };

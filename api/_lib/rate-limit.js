const TENTATIVAS_MAXIMAS = 5;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map();

function identificarCliente(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'desconhecido').split(',')[0].trim();
}

function limparExpiradas(agora) {
  for (const [chave, registro] of tentativas) {
    if (registro.expiraEm <= agora) tentativas.delete(chave);
  }
}

function bloquearTentativasDeLogin(req, res) {
  const agora = Date.now();
  limparExpiradas(agora);
  const chave = identificarCliente(req);
  const registro = tentativas.get(chave);

  if (!registro || registro.expiraEm <= agora || registro.quantidade < TENTATIVAS_MAXIMAS) return false;

  const segundosRestantes = Math.ceil((registro.expiraEm - agora) / 1000);
  res.setHeader('Retry-After', String(segundosRestantes));
  res.status(429).json({ success: false, message: 'Muitas tentativas. Aguarde alguns minutos.' });
  return true;
}

function registrarFalhaDeLogin(req) {
  const agora = Date.now();
  const chave = identificarCliente(req);
  const registro = tentativas.get(chave);

  if (!registro || registro.expiraEm <= agora) {
    tentativas.set(chave, { quantidade: 1, expiraEm: agora + JANELA_MS });
    return;
  }

  registro.quantidade += 1;
}

function limparTentativasDeLogin(req) {
  tentativas.delete(identificarCliente(req));
}

module.exports = { bloquearTentativasDeLogin, registrarFalhaDeLogin, limparTentativasDeLogin };

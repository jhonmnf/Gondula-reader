const crypto = require('crypto');

const NOME_COOKIE = 'gondola_session';
const DURACAO_SESSAO_SEGUNDOS = 8 * 60 * 60;

function obterSegredoSessao() {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo) throw new Error('SESSION_SECRET não configurada.');
  return segredo;
}

function assinar(conteudo) {
  return crypto.createHmac('sha256', obterSegredoSessao()).update(conteudo).digest('base64url');
}

function compararComSeguranca(valorA, valorB) {
  const bufferA = Buffer.from(valorA || '');
  const bufferB = Buffer.from(valorB || '');
  return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);
}

function lerCookies(req) {
  return Object.fromEntries((req.headers.cookie || '')
    .split(';')
    .map(parte => parte.trim().split('='))
    .filter(([nome, valor]) => nome && valor));
}

function criarSessao(usuario) {
  const conteudo = Buffer.from(JSON.stringify({
    sub: 'admin',
    usuario,
    exp: Math.floor(Date.now() / 1000) + DURACAO_SESSAO_SEGUNDOS
  })).toString('base64url');

  return `${conteudo}.${assinar(conteudo)}`;
}

function validarSessao(req) {
  try {
    const token = lerCookies(req)[NOME_COOKIE];
    if (!token) return null;

    const [conteudo, assinatura] = token.split('.');
    if (!conteudo || !assinatura || !compararComSeguranca(assinatura, assinar(conteudo))) return null;

    const sessao = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'));
    if (sessao.sub !== 'admin' || !Number.isInteger(sessao.exp) || sessao.exp <= Math.floor(Date.now() / 1000)) return null;

    return sessao;
  } catch {
    return null;
  }
}

function definirCookieDeSessao(res, usuario) {
  const seguro = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=${criarSessao(usuario)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${DURACAO_SESSAO_SEGUNDOS}${seguro}`);
}

function limparCookieDeSessao(res) {
  const seguro = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${NOME_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${seguro}`);
}

function exigirSessao(req, res) {
  const sessao = validarSessao(req);
  if (sessao) return sessao;

  res.status(401).json({ success: false, message: 'Sessão inválida ou expirada.' });
  return null;
}

module.exports = {
  compararComSeguranca,
  definirCookieDeSessao,
  limparCookieDeSessao,
  exigirSessao,
  validarSessao
};

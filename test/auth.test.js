const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SESSION_SECRET = 'segredo-de-teste-com-tamanho-suficiente';
const { compararComSeguranca, definirCookieDeSessao, validarSessao } = require('../api/_lib/auth');

test('compara credenciais sem aceitar valores diferentes', () => {
  assert.equal(compararComSeguranca('igual', 'igual'), true);
  assert.equal(compararComSeguranca('igual', 'diferente'), false);
});

test('aceita somente cookie de sessão assinado', () => {
  const resposta = { setHeader: (_nome, valor) => { resposta.cookie = valor; } };
  definirCookieDeSessao(resposta, 'admin');
  const cookie = resposta.cookie.split(';')[0];

  assert.equal(validarSessao({ headers: { cookie } }).usuario, 'admin');
  assert.equal(validarSessao({ headers: { cookie: `${cookie}alterado` } }), null);
});

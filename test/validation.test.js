const test = require('node:test');
const assert = require('node:assert/strict');
const { validarConferencia, validarTermoDeBusca } = require('../api/_lib/validation');

test('aceita uma conferência com dados esperados', () => {
  const resultado = validarConferencia({
    codigo: '7891234567890',
    nome: 'Produto de teste',
    detalhe: 'Descrição',
    preco: 12.5,
    status: 'correta',
    operator: 'Operador',
    em: '2026-09-12T12:00:00.000Z'
  });

  assert.equal(resultado.error, undefined);
  assert.equal(resultado.data.status, 'correta');
  assert.equal(resultado.data.preco, 12.5);
});

test('rejeita status, preço e operador inválidos', () => {
  assert.ok(validarConferencia({ codigo: '123', status: 'ignorar', preco: 1, operator: 'Ana' }).error);
  assert.ok(validarConferencia({ codigo: '123', status: 'correta', preco: -1, operator: 'Ana' }).error);
  assert.ok(validarConferencia({ codigo: '123', status: 'correta', preco: 1, operator: '' }).error);
});

test('restringe o termo de busca a caracteres seguros', () => {
  assert.equal(validarTermoDeBusca('Café 500ml'), 'Café 500ml');
  assert.equal(validarTermoDeBusca('teste,malicioso'), null);
});

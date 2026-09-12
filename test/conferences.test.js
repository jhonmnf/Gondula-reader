const test = require('node:test');
const assert = require('node:assert/strict');
const { validarFiltros, consultarConferencias } = require('../api/_lib/conferences');

test('rejeita filtros e páginas inválidos', () => {
  assert.deepEqual(validarFiltros({}), { pagina: 1, status: '' });
  for (const pagina of ['0', '-1', '1.5', 'abc', '10001']) assert.equal(validarFiltros({ pagina }), null);
  assert.equal(validarFiltros({ status: 'desconhecido' }), null);
});

test('pagina e filtra o histórico, associando nomes sem depender de relacionamento no banco', async () => {
  const chamadas = [];
  const consulta = {
    select(colunas, opcoes) { chamadas.push(['select', colunas, opcoes]); return this; },
    order(coluna, opcoes) { chamadas.push(['order', coluna, opcoes]); return this; },
    eq(coluna, valor) { chamadas.push(['eq', coluna, valor]); return this; },
    async range(inicio, fim) {
      chamadas.push(['range', inicio, fim]);
      return { data: [
        { product_codigo: '123', status: 'divergente', operator: 'Ana', timestamp: '2026-09-12T12:00:00Z' },
        { product_codigo: '456', status: 'divergente', operator: 'Pedro', timestamp: '2026-09-12T11:00:00Z' }
      ], count: 41, error: null };
    }
  };
  const cliente = {
    from(tabela) {
      if (tabela === 'conferences') return consulta;
      return { select() { return this; }, async in(coluna, codigos) {
        assert.equal(coluna, 'codigo');
        assert.deepEqual(codigos, ['123', '456']);
        return { data: [{ codigo: '123', nome: 'Produto de teste' }], error: null };
      } };
    }
  };

  const resultado = await consultarConferencias(cliente, { pagina: 2, status: 'divergente' });
  assert.ok(chamadas.some(chamada => chamada[0] === 'eq' && chamada[2] === 'divergente'));
  assert.deepEqual(chamadas.find(chamada => chamada[0] === 'range'), ['range', 20, 39]);
  assert.deepEqual(chamadas.find(chamada => chamada[0] === 'order'), ['order', 'timestamp', { ascending: false }]);
  assert.equal(resultado.paginas, 3);
  assert.equal(resultado.total, 41);
  assert.equal(resultado.data[0].nome, 'Produto de teste');
  assert.equal(resultado.data[1].nome, 'Produto não disponível');
});

test('retorna estado vazio sem consultar produtos', async () => {
  const consulta = { select() { return this; }, order() { return this; }, async range() { return { data: [], count: 0 }; } };
  const cliente = { from(tabela) { assert.equal(tabela, 'conferences'); return consulta; } };
  const resultado = await consultarConferencias(cliente, { pagina: 1, status: '' });
  assert.deepEqual(resultado.data, []);
  assert.equal(resultado.paginas, 1);
});

test('propaga erro do banco sem apresentar sucesso falso', async () => {
  const consulta = { select() { return this; }, order() { return this; }, async range() { return { error: new Error('falha de teste') }; } };
  await assert.rejects(consultarConferencias({ from() { return consulta; } }, { pagina: 1, status: '' }), /falha de teste/);
});

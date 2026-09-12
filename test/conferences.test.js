const test = require('node:test');
const assert = require('node:assert/strict');
const { validarFiltros, consultarConferencias, obterIntervaloPeriodo } = require('../api/_lib/conferences');

test('rejeita filtros e páginas inválidos', () => {
  assert.deepEqual(validarFiltros({}), { pagina: 1, status: '', periodo: '' });
  for (const pagina of ['0', '-1', '1.5', 'abc', '10001']) assert.equal(validarFiltros({ pagina }), null);
  assert.equal(validarFiltros({ status: 'desconhecido' }), null);
  assert.equal(validarFiltros({ periodo: 'desconhecido' }), null);
  for (const periodo of ['hoje', 'ontem', '7dias', '30dias']) assert.equal(validarFiltros({ periodo }).periodo, periodo);
});

test('calcula os períodos em Brasília, inclusive antes da meia-noite local e na virada do ano', () => {
  const agora = new Date('2026-01-01T02:30:00Z');
  assert.equal(obterIntervaloPeriodo('', agora), null);
  assert.deepEqual(obterIntervaloPeriodo('hoje', agora), { inicio: '2025-12-31T03:00:00.000Z', fim: '2026-01-01T03:00:00.000Z' });
  assert.deepEqual(obterIntervaloPeriodo('ontem', agora), { inicio: '2025-12-30T03:00:00.000Z', fim: '2025-12-31T03:00:00.000Z' });
  assert.deepEqual(obterIntervaloPeriodo('7dias', agora), { inicio: '2025-12-25T03:00:00.000Z', fim: '2026-01-01T03:00:00.000Z' });
  assert.deepEqual(obterIntervaloPeriodo('30dias', agora), { inicio: '2025-12-02T03:00:00.000Z', fim: '2026-01-01T03:00:00.000Z' });
  assert.equal(obterIntervaloPeriodo('hoje', new Date('2026-01-01T03:00:00Z')).inicio, '2026-01-01T03:00:00.000Z');
});

test('aplica período e resultado no banco antes de contar e paginar', async () => {
  const chamadas = [];
  const consulta = {
    select() { return this; }, order() { return this; },
    eq(...args) { chamadas.push(['eq', ...args]); return this; },
    gte(...args) { chamadas.push(['gte', ...args]); return this; },
    lt(...args) { chamadas.push(['lt', ...args]); return this; },
    async range(...args) { chamadas.push(['range', ...args]); return { data: [], count: 0 }; }
  };
  await consultarConferencias({ from() { return consulta; } }, { pagina: 2, status: 'divergente', periodo: 'ontem' }, new Date('2026-09-12T14:00:00Z'));
  assert.deepEqual(chamadas, [
    ['eq', 'status', 'divergente'],
    ['gte', 'timestamp', '2026-09-11T03:00:00.000Z'],
    ['lt', 'timestamp', '2026-09-12T03:00:00.000Z'],
    ['range', 20, 39]
  ]);
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

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const fonte = fs.readFileSync(path.join(__dirname, '../js/foto.js'), 'utf8');
const arquivo = { size: 1024, type: 'image/jpeg' };

function preparar(extras = {}) {
  const imagem = { width: 6000, height: 4000, fechada: false, close() { this.fechada = true; } };
  const desenhos = [];
  const contextoCanvas = { drawImage: (...args) => desenhos.push(args), translate() {}, rotate() {} };
  const canvas = { getContext: () => contextoCanvas };
  const contexto = vm.createContext({
    createImageBitmap: async () => imagem,
    document: { createElement: () => canvas },
    ...extras
  });
  const funcoes = vm.runInContext(fonte.replaceAll('export ', '') + '\n({ lerCodigoDaFoto, configurarLeituraPorFoto });', contexto);
  return { ...funcoes, imagem, canvas, desenhos };
}

test('lê foto com detector nativo, limita resolução e libera a imagem', async () => {
  const BarcodeDetector = class {
    static async getSupportedFormats() { return ['ean_13']; }
    constructor({ formats }) { assert.equal(formats.join(','), 'ean_13'); }
    async detect(canvas) {
      assert.equal(canvas.width, 3072);
      assert.equal(canvas.height, 2048);
      return [{ rawValue: '7891234567890' }];
    }
  };
  const leitor = preparar({ BarcodeDetector });
  assert.equal(await leitor.lerCodigoDaFoto(arquivo), '7891234567890');
  assert.equal(leitor.imagem.fechada, true);
  assert.equal(leitor.canvas.width, 0);
});

test('usa ZXing quando detector nativo rejeita a foto e tenta orientação vertical', async () => {
  const BarcodeDetector = class { async detect() { throw new Error('Falha nativa'); } };
  let tentativas = 0;
  const BrowserMultiFormatReader = class {
    decodeFromCanvas(canvas) {
      tentativas++;
      if (tentativas === 1) throw new Error('Não encontrado');
      assert.equal(canvas.width, 2048);
      assert.equal(canvas.height, 3072);
      return { getText: () => '12345678' };
    }
  };
  const leitor = preparar({ BarcodeDetector, ZXingBrowser: { BrowserMultiFormatReader } });
  assert.equal(await leitor.lerCodigoDaFoto(arquivo), '12345678');
  assert.equal(tentativas, 2);
});

test('usa ZXing quando não há formato nativo compatível', async () => {
  const BarcodeDetector = class {
    static async getSupportedFormats() { return ['qr_code']; }
    constructor() { assert.fail('Não deve instanciar detector sem formatos compatíveis'); }
  };
  const BrowserMultiFormatReader = class { decodeFromCanvas() { return { getText: () => '1234' }; } };
  const leitor = preparar({ BarcodeDetector, ZXingBrowser: { BrowserMultiFormatReader } });
  assert.equal(await leitor.lerCodigoDaFoto(arquivo), '1234');
});

test('foto sem código orienta nova tentativa e libera memória', async () => {
  const BarcodeDetector = class { async detect() { return []; } };
  const leitor = preparar({ BarcodeDetector });
  await assert.rejects(leitor.lerCodigoDaFoto(arquivo), /Não encontrei um código/);
  assert.equal(leitor.imagem.fechada, true);
  assert.equal(leitor.canvas.height, 0);
});

test('arquivo vazio, tipo inválido e foto excessiva são recusados antes da decodificação', async () => {
  const leitor = preparar({ createImageBitmap: () => assert.fail('Não deve decodificar') });
  await assert.rejects(leitor.lerCodigoDaFoto(null), /foto válida/);
  await assert.rejects(leitor.lerCodigoDaFoto({ size: 0, type: 'image/jpeg' }), /foto válida/);
  await assert.rejects(leitor.lerCodigoDaFoto({ size: 10, type: 'text/plain' }), /foto válida/);
  await assert.rejects(leitor.lerCodigoDaFoto({ size: 41 * 1024 * 1024, type: 'image/jpeg' }), /muito grande/);
});

test('foto corrompida e leitor indisponível apresentam mensagens distintas', async () => {
  const corrompido = preparar({ createImageBitmap: async () => { throw new Error(); } });
  await assert.rejects(corrompido.lerCodigoDaFoto(arquivo), /Não foi possível abrir a foto/);
  const indisponivel = preparar();
  await assert.rejects(indisponivel.lerCodigoDaFoto(arquivo), /Leitor de fotos indisponível/);
  assert.equal(indisponivel.imagem.fechada, true);
});

test('carrega a foto por data URL quando createImageBitmap não existe', async () => {
  const FileReader = class {
    readAsDataURL() { this.result = 'data:image/jpeg;base64,teste'; this.onload(); }
  };
  const Image = class {
    naturalWidth = 800;
    naturalHeight = 600;
    set src(valor) { assert.ok(valor.startsWith('data:')); this.onload(); }
  };
  const BarcodeDetector = class { async detect() { return [{ rawValue: '1234' }]; } };
  const leitor = preparar({ createImageBitmap: undefined, FileReader, Image, BarcodeDetector });
  assert.equal(await leitor.lerCodigoDaFoto(arquivo), '1234');
});

function elemento(textContent = '') {
  return {
    textContent, value: 'anterior', disabled: false, eventos: {},
    addEventListener(nome, funcao) { this.eventos[nome] = funcao; },
    click() { return this.eventos.click?.(); }
  };
}

function prepararControles(extras = {}) {
  const leitor = preparar(extras);
  const botao = elemento('Fotografar código');
  const campoFoto = elemento();
  const botaoCamera = elemento();
  const busca = elemento();
  const mensagens = [];
  const codigos = [];
  const ordem = [];
  campoFoto.click = () => ordem.push('captura');
  leitor.configurarLeituraPorFoto({
    botao, campoFoto, botaoCamera, formulario: { elements: [busca] },
    fecharCamera: () => ordem.push('fechar'),
    onCodigo: async codigo => codigos.push(codigo),
    mensagem: (texto, tipo) => mensagens.push({ texto, tipo })
  });
  return { botao, campoFoto, botaoCamera, busca, mensagens, codigos, ordem };
}

test('libera câmera no clique antes de abrir captura e permite cancelar', async () => {
  const ui = prepararControles();
  ui.botao.click();
  assert.deepEqual(ui.ordem, ['fechar', 'captura']);
  assert.equal(ui.campoFoto.value, '');
  ui.campoFoto.eventos.cancel();
  await ui.campoFoto.eventos.change();
  assert.equal(ui.codigos.length, 0);
  assert.equal(ui.botao.disabled, false);
  assert.match(ui.mensagens.at(-1).texto, /cancelada/);
});

test('bloqueia consultas concorrentes e aceita repetir a mesma foto depois de concluir', { timeout: 2000 }, async () => {
  let resolver;
  const BarcodeDetector = class { detect() { return new Promise(resolve => { resolver = resolve; }); } };
  const ui = prepararControles({ BarcodeDetector });
  ui.campoFoto.files = [arquivo];
  const leitura = ui.campoFoto.eventos.change();
  assert.equal(ui.botao.disabled, true);
  assert.equal(ui.botaoCamera.disabled, true);
  assert.equal(ui.busca.disabled, true);
  await ui.campoFoto.eventos.change();
  await new Promise(setImmediate);
  resolver([{ rawValue: '1234' }]);
  await leitura;
  assert.deepEqual(ui.codigos, ['1234']);
  assert.equal(ui.botao.disabled, false);
  assert.equal(ui.busca.disabled, false);
  assert.equal(ui.campoFoto.value, '');
  const repeticao = ui.campoFoto.eventos.change();
  await new Promise(setImmediate);
  resolver([{ rawValue: '1234' }]);
  await repeticao;
  assert.deepEqual(ui.codigos, ['1234', '1234']);
});

test('falha de leitura restaura os controles e permite nova tentativa', async () => {
  const ui = prepararControles();
  ui.campoFoto.files = [arquivo];
  await ui.campoFoto.eventos.change();
  assert.equal(ui.codigos.length, 0);
  assert.equal(ui.botao.disabled, false);
  assert.equal(ui.botaoCamera.disabled, false);
  assert.equal(ui.botao.textContent, 'Fotografar código');
  assert.equal(ui.mensagens.at(-1).tipo, 'aviso');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.join(__dirname, '../js/camera.js'), 'utf8');

function criarTrilha(modos = ['continuous', 'single-shot'], deviceId = 'traseira') {
  const settings = { deviceId, zoom: 1, focusMode: 'manual' };
  return {
    chamadas: [],
    encerrada: false,
    getCapabilities: () => ({ focusMode: modos, zoom: { min: 1, max: 4, step: 0.1 } }),
    getSettings: () => ({ ...settings }),
    async applyConstraints(constraints) {
      this.chamadas.push(constraints);
      Object.assign(settings, constraints.advanced[0]);
    },
    stop() { this.encerrada = true; }
  };
}

function criarStream(trilha) {
  return { getVideoTracks: () => [trilha], getTracks: () => [trilha] };
}

function preparar(mediaDevices = {}, extras = {}) {
  const contexto = vm.createContext({
    navigator: { mediaDevices }, document: { querySelector: () => null },
    console, window: {}, requestAnimationFrame: () => {}, ...extras
  });
  const CameraManager = vm.runInContext(codigo.replace('export class', 'class') + '\nCameraManager;', contexto);
  const video = { srcObject: null, play: async () => {} };
  return new CameraManager(null, video);
}

function prepararComTrilha(trilha) {
  const camera = preparar();
  camera.streamCamera = criarStream(trilha);
  return camera;
}

test('solicita foco contínuo e refoca preservando o zoom', async () => {
  const trilha = criarTrilha();
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), true);
  assert.equal(trilha.getSettings().focusMode, 'continuous');
  await camera.ajustarZoom(2);
  assert.equal(await camera.ativarFocoContinuo(true), true);
  assert.equal(trilha.getSettings().focusMode, 'single-shot');
  assert.equal(trilha.chamadas.at(-1).advanced[0].zoom, 2);
});

test('usa foco pontual quando contínuo não está disponível', async () => {
  const trilha = criarTrilha(['single-shot']);
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), true);
  assert.equal(trilha.getSettings().focusMode, 'single-shot');
});

test('tenta foco pontual quando o navegador rejeita o contínuo', async () => {
  const trilha = criarTrilha();
  const aplicar = trilha.applyConstraints.bind(trilha);
  trilha.applyConstraints = async ajustes => {
    if (ajustes.advanced[0].focusMode === 'continuous') throw new Error('Sem suporte');
    return aplicar(ajustes);
  };
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), true);
  assert.equal(trilha.getSettings().focusMode, 'single-shot');
});

test('informa falta de controle de foco sem impedir o uso da câmera', async () => {
  const trilha = criarTrilha([]);
  const camera = preparar({ getUserMedia: async () => criarStream(trilha) });
  assert.equal(await camera.abrir(), true);
  assert.equal(camera.podeRefocar(), false);
  assert.match(camera.statusFoco, /não oferece controle/);
  assert.equal(trilha.encerrada, false);
});

test('suporta navegadores sem getCapabilities', async () => {
  const trilha = criarTrilha();
  delete trilha.getCapabilities;
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), false);
  assert.equal(camera.podeRefocar(), false);
  assert.equal(camera.obterFaixaDeZoom(), null);
});

test('não anuncia sucesso quando o navegador ignora o modo solicitado', async () => {
  const trilha = criarTrilha();
  trilha.applyConstraints = async () => {};
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), false);
  assert.match(camera.statusFoco, /Não foi possível ajustar/);
});

test('distingue foco solicitado de modo confirmado', async () => {
  const trilha = criarTrilha();
  trilha.getSettings = () => ({});
  const camera = prepararComTrilha(trilha);
  assert.equal(await camera.ativarFocoContinuo(), true);
  assert.match(camera.statusFoco, /não confirmou/);
});

test('serializa ajustes simultâneos sem perder foco ou zoom', async () => {
  const trilha = criarTrilha();
  const camera = prepararComTrilha(trilha);
  await Promise.all([camera.ativarFocoContinuo(), camera.ajustarZoom(3)]);
  assert.equal(trilha.chamadas.at(-1).advanced[0].focusMode, 'continuous');
  assert.equal(trilha.chamadas.at(-1).advanced[0].zoom, 3);
  assert.equal(await camera.ajustarZoom(NaN), false);
  await camera.ajustarZoom(100);
  assert.equal(trilha.getSettings().zoom, 4);
});

test('reabre a câmera traseira automaticamente e libera a sessão anterior', async () => {
  const primeira = criarTrilha();
  const segunda = criarTrilha(['continuous'], 'outra');
  let constraints;
  const camera = preparar({ getUserMedia: async pedido => {
    constraints = pedido;
    assert.equal(primeira.encerrada, true);
    return criarStream(segunda);
  } });
  camera.streamCamera = criarStream(primeira);
  assert.equal(await camera.abrir(), true);
  assert.equal(constraints.video.deviceId, undefined);
  assert.equal(constraints.video.facingMode.exact, 'environment');
  assert.equal(camera.obterTrilha(), segunda);
});

test('mantém alternativa de câmera traseira sem repetir pedido de permissão negada', async () => {
  const trilha = criarTrilha();
  const pedidos = [];
  const camera = preparar({ getUserMedia: async pedido => {
    pedidos.push(pedido);
    if (pedidos.length === 1) throw Object.assign(new Error(), { name: 'OverconstrainedError' });
    return criarStream(trilha);
  } });
  await camera.abrir();
  assert.equal(pedidos[0].video.facingMode.exact, 'environment');
  assert.equal(pedidos[1].video.facingMode.ideal, 'environment');
  let chamadas = 0;
  const negada = preparar({ getUserMedia: async () => {
    chamadas++;
    throw Object.assign(new Error('Permissão negada'), { name: 'NotAllowedError' });
  } });
  await assert.rejects(negada.abrir(), /Permissão negada/);
  assert.equal(chamadas, 1);
});

test('encerra uma câmera que terminar de abrir após o usuário fechar', async () => {
  let resolver;
  const trilha = criarTrilha();
  const camera = preparar({ getUserMedia: () => new Promise(resolve => { resolver = resolve; }) });
  const abertura = camera.abrir();
  camera.encerrar();
  resolver(criarStream(trilha));
  assert.equal(await abertura, false);
  assert.equal(trilha.encerrada, true);
  assert.equal(camera.video.srcObject, null);
});

test('falha no vídeo libera a câmera para uma nova tentativa', async () => {
  const trilha = criarTrilha();
  const camera = preparar({ getUserMedia: async () => criarStream(trilha) });
  camera.video.play = async () => { throw new Error('Erro de vídeo'); };
  await assert.rejects(camera.abrir(), /Erro de vídeo/);
  assert.equal(trilha.encerrada, true);
  assert.equal(camera.video.srcObject, null);
});

test('descarta leitura pendente da câmera anterior depois da troca', async () => {
  let resolver;
  const BarcodeDetector = class {
    detect() { return new Promise(resolve => { resolver = resolve; }); }
  };
  const camera = preparar({}, { BarcodeDetector, window: { BarcodeDetector } });
  const encontrados = [];
  camera.onProductFound = codigo => encontrados.push(codigo);
  camera.iniciarLeituraNativa();
  camera.encerrar();
  camera.leituraAtiva = true;
  resolver([{ rawValue: '7891234567890' }]);
  await Promise.resolve();
  assert.equal(encontrados.length, 0);
});

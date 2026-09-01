const botaoAtivar = document.querySelector('#botao-ativar-camera');
const botaoFechar = document.querySelector('#botao-fechar-teste');
const camera = document.querySelector('#camera-teste');
const video = document.querySelector('#video-teste');
const status = document.querySelector('#status-camera');
const dados = document.querySelector('#dados-camera');
const controlesZoom = document.querySelector('#controles-zoom');
const controleZoom = document.querySelector('#controle-zoom');
const valorZoom = document.querySelector('#valor-zoom');

let stream = null;
let trilha = null;

function exibirStatus(mensagem) {
  status.textContent = mensagem;
}

function exibirDados() {
  const configuracao = trilha?.getSettings?.() || {};
  const capacidades = trilha?.getCapabilities?.() || {};
  const foco = capacidades.focusMode?.includes('continuous') ? 'contínuo disponível' : 'controlado pelo aparelho';
  const zoom = capacidades.zoom ? `${capacidades.zoom.min}× a ${capacidades.zoom.max}×` : 'não disponível';

  dados.innerHTML = `
    <div><dt>Resolução</dt><dd>${configuracao.width || '—'} × ${configuracao.height || '—'}</dd></div>
    <div><dt>Foco</dt><dd>${foco}</dd></div>
    <div><dt>Zoom</dt><dd>${zoom}</dd></div>
  `;
}

async function ativarFocoContinuo() {
  const capacidades = trilha?.getCapabilities?.() || {};
  if (!capacidades.focusMode?.includes('continuous')) return false;

  try {
    await trilha.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    return true;
  } catch {
    return false;
  }
}

function configurarZoom() {
  const capacidades = trilha?.getCapabilities?.() || {};
  if (!capacidades.zoom) return;

  const { min, max, step = 0.1 } = capacidades.zoom;
  controleZoom.min = min;
  controleZoom.max = max;
  controleZoom.step = step;
  controleZoom.value = trilha.getSettings().zoom || min;
  valorZoom.value = `${Number(controleZoom.value).toFixed(1)}×`;
  controlesZoom.hidden = false;
}

async function obterCameraTraseira() {
  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
    resizeMode: { ideal: 'none' }
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...videoConstraints, facingMode: { exact: 'environment' } },
      audio: false
    });
  } catch (erro) {
    if (!['OverconstrainedError', 'NotFoundError'].includes(erro.name)) throw erro;

    return navigator.mediaDevices.getUserMedia({
      video: { ...videoConstraints, facingMode: { ideal: 'environment' } },
      audio: false
    });
  }
}

async function abrirCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    exibirStatus('Este navegador não oferece acesso à câmera.');
    return;
  }

  try {
    exibirStatus('Solicitando acesso à câmera…');
    stream = await obterCameraTraseira();
    trilha = stream.getVideoTracks()[0];
    video.srcObject = stream;
    camera.hidden = false;
    botaoAtivar.hidden = true;
    await video.play();

    const focoAtivado = await ativarFocoContinuo();
    configurarZoom();
    exibirDados();
    exibirStatus(focoAtivado
      ? 'Foco contínuo ativo. Tente manter 15 a 25 cm de distância e use o zoom, se disponível.'
      : 'Use boa iluminação e mantenha 15 a 25 cm de distância. O foco é controlado pelo aparelho.');
  } catch (erro) {
    exibirStatus(`Não foi possível abrir a câmera: ${erro.message}`);
  }
}

async function atualizarZoom() {
  const zoom = Number(controleZoom.value);
  try {
    await trilha.applyConstraints({ advanced: [{ zoom }] });
    valorZoom.value = `${zoom.toFixed(1)}×`;
  } catch {
    exibirStatus('O aparelho não aceitou este nível de zoom.');
  }
}

function fecharCamera() {
  stream?.getTracks().forEach(trilhaAtual => trilhaAtual.stop());
  stream = null;
  trilha = null;
  video.srcObject = null;
  controlesZoom.hidden = true;
  dados.innerHTML = '';
  camera.hidden = true;
  botaoAtivar.hidden = false;
}

botaoAtivar.addEventListener('click', abrirCamera);
botaoFechar.addEventListener('click', fecharCamera);
controleZoom.addEventListener('input', atualizarZoom);
window.addEventListener('pagehide', fecharCamera);

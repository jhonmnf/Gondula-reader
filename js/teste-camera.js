import { CameraManager } from './camera.js';
import { criarControlesFoco } from './camera-controls.js';

const botaoAtivar = document.querySelector('#botao-ativar-camera');
const botaoFechar = document.querySelector('#botao-fechar-teste');
const camera = document.querySelector('#camera-teste');
const video = document.querySelector('#video-teste');
const status = document.querySelector('#status-camera');
const dados = document.querySelector('#dados-camera');
const controlesZoom = document.querySelector('#controles-zoom');
const controleZoom = document.querySelector('#controle-zoom');
const valorZoom = document.querySelector('#valor-zoom');
const gerenciador = new CameraManager(null, video);
const controlesFoco = criarControlesFoco(gerenciador, camera, abrirCamera, exibirDados);

function exibirDados() {
  const trilha = gerenciador.obterTrilha();
  const configuracao = trilha?.getSettings?.() || {};
  const capacidades = trilha?.getCapabilities?.() || {};
  const nomesFoco = { continuous: 'Contínuo', 'single-shot': 'Pontual', manual: 'Manual', none: 'Sem ajuste' };
  const itens = {
    Resolução: `${configuracao.width || '—'} × ${configuracao.height || '—'}`,
    Foco: nomesFoco[configuracao.focusMode] || 'Não informado',
    Zoom: capacidades.zoom ? `${capacidades.zoom.min}× a ${capacidades.zoom.max}×` : 'Não disponível'
  };
  dados.replaceChildren();
  Object.entries(itens).forEach(([titulo, valor]) => {
    const item = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = titulo;
    dd.textContent = valor;
    item.append(dt, dd);
    dados.append(item);
  });
}

function configurarZoom() {
  const faixa = gerenciador.obterFaixaDeZoom();
  controlesZoom.hidden = !faixa;
  if (!faixa) return;
  controleZoom.min = faixa.min;
  controleZoom.max = faixa.max;
  controleZoom.step = faixa.step;
  controleZoom.value = faixa.atual;
  valorZoom.value = `${Number(faixa.atual).toFixed(1)}×`;
}

async function abrirCamera(deviceId) {
  botaoAtivar.disabled = true;
  controlesFoco.definirOcupado(true);
  controlesZoom.hidden = true;
  dados.replaceChildren();
  camera.hidden = false;
  try {
    status.textContent = 'Solicitando acesso à câmera…';
    if (!await gerenciador.abrir(deviceId)) return;
    botaoAtivar.hidden = true;
    configurarZoom();
    exibirDados();
    await controlesFoco.atualizar();
    if (gerenciador.obterTrilha()) {
      status.textContent = 'Centralize o código. Se continuar embaçado, teste outra câmera da lista e use Refocar quando disponível.';
    }
  } catch (erro) {
    fecharCamera();
    status.textContent = `Não foi possível abrir a câmera: ${erro.message}`;
  } finally {
    botaoAtivar.disabled = false;
    controlesFoco.definirOcupado(false);
  }
}

async function atualizarZoom() {
  const sessao = gerenciador.sessao;
  controleZoom.disabled = true;
  try {
    if (await gerenciador.ajustarZoom(controleZoom.value)) configurarZoom();
  } catch {
    if (sessao === gerenciador.sessao) status.textContent = 'O aparelho não aceitou este nível de zoom.';
  } finally {
    controleZoom.disabled = false;
  }
}

function fecharCamera() {
  gerenciador.encerrar();
  controlesFoco.definirOcupado(false);
  controlesZoom.hidden = true;
  dados.replaceChildren();
  camera.hidden = true;
  botaoAtivar.hidden = false;
  status.textContent = '';
}

botaoAtivar.addEventListener('click', () => abrirCamera());
botaoFechar.addEventListener('click', fecharCamera);
controleZoom.addEventListener('change', atualizarZoom);
window.addEventListener('pagehide', fecharCamera);

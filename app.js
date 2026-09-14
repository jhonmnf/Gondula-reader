import * as API from './js/api.js';
import * as UI from './js/ui.js';
import { CameraManager } from './js/camera.js';
import { criarControlesFoco } from './js/camera-controls.js';
import { configurarLeituraPorFoto } from './js/foto.js';
import * as Auth from './js/auth.js';

if (!(await Auth.isUserLoggedIn())) {
  window.location.replace('login.html');
}

let produtoAtual = null;
let statusPendente = null;
let registroEmAndamento = false;
const controlesZoomCamera = document.querySelector('#controles-zoom-camera');
const controleZoomCamera = document.querySelector('#controle-zoom-camera');
const valorZoomCamera = document.querySelector('#valor-zoom-camera');
const camera = new CameraManager(async (codigo) => {
  document.querySelector('#campo-busca').value = codigo;
  await handleBuscarProduto(codigo);
});
const controlesFoco = criarControlesFoco(camera, document.querySelector('#camera'));
const botaoFoto = document.querySelector('#botao-foto');
configurarLeituraPorFoto({
  botao: botaoFoto,
  campoFoto: document.querySelector('#arquivo-foto'),
  botaoCamera: document.querySelector('#botao-camera'),
  formulario: document.querySelector('#formulario-busca'),
  fecharCamera,
  onCodigo: async codigo => {
    document.querySelector('#campo-busca').value = codigo;
    await handleBuscarProduto(codigo);
  },
  mensagem: UI.mensagem
});

async function handleBuscarProduto(termo) {
  UI.mensagem('Consultando servidor...');
  const result = await API.buscarProduto(termo);

  if (result.error) {
    UI.setHidden('#produto', true);
    UI.setHidden('#lista-resultados', true);
    UI.mensagem(result.error, 'erro');
    return;
  }

  if (Array.isArray(result.data)) {
    camera.encerrar();
    if (result.data.length === 0) {
      UI.setHidden('#lista-resultados', true);
      UI.setHidden('#leitura', false);
      UI.mensagem('Nenhum produto encontrado. Tente outro código ou nome.', 'aviso');
      return;
    }
    UI.mensagem('Produtos encontrados.', 'sucesso');
    UI.exibirListaProdutos(result.data);
  } else {
    UI.mensagem('Produto encontrado.', 'sucesso');
    UI.exibirProduto(result.data);
    produtoAtual = result.data;
    camera.encerrar();
  }
}

function configurarZoomDaCamera() {
  const faixa = camera.obterFaixaDeZoom();
  if (!faixa) {
    controlesZoomCamera.hidden = true;
    return;
  }

  controleZoomCamera.min = faixa.min;
  controleZoomCamera.max = faixa.max;
  controleZoomCamera.step = faixa.step;
  controleZoomCamera.value = faixa.atual;
  valorZoomCamera.value = `${Number(faixa.atual).toFixed(1)}×`;
  controlesZoomCamera.hidden = false;
}

async function registrarConferencia(status) {
  if (!produtoAtual) return;
  statusPendente = status;
  const modal = document.querySelector('#modal-operador');
  modal.showModal();
  requestAnimationFrame(() => document.querySelector('#nome-operador').focus());
}

async function efetuarRegistro(operator) {
  if (!produtoAtual || !statusPendente) return;

  const payload = {
    codigo: produtoAtual.codigo,
    nome: produtoAtual.nome,
    detalhe: produtoAtual.detalhe || '',
    preco: produtoAtual.preco,
    status: statusPendente,
    operator: operator,
    em: new Date().toISOString()
  };

  const rotulos = { correta: 'Resultado: Correta', divergente: 'Resultado: Divergente', ausente: 'Resultado: Ausente' };

  try {
    const result = await API.registrarConferencia(payload);
    if (result.success) {
      UI.mensagem(`${rotulos[statusPendente]}. Registro salvo no servidor.`, 'sucesso');
    } else {
      throw new Error(result.error);
    }
  } catch (err) {
    console.error('Erro na API, salvando localmente:', err);
    const registros = JSON.parse(localStorage.getItem('conferencias') || '[]');
    registros.push(payload);
    localStorage.setItem('conferencias', JSON.stringify(registros));
    UI.mensagem(`${rotulos[statusPendente]}. Salvo localmente (offline).`, 'erro');
  } finally {
    statusPendente = null;
  }
}

// Event Listeners
document.querySelector('#botao-voltar-busca').addEventListener('click', () => {
  UI.setHidden('#lista-resultados', true);
  UI.setHidden('#leitura', false);
  UI.setHidden('#produto', true);
  UI.mensagem('Busca reiniciada.');
});

document.querySelector('#botao-voltar-produto').addEventListener('click', () => {
  const grade = document.querySelector('#resultados-grade');
  if (grade && grade.children.length > 0) {
    UI.setHidden('#produto', true);
    UI.setHidden('#lista-resultados', false);
    UI.setHidden('#leitura', true);
  } else {
    UI.setHidden('#produto', true);
    UI.setHidden('#leitura', false);
    UI.setHidden('#lista-resultados', true);
  }
});

document.querySelector('#formulario-busca').addEventListener('submit', evento => {
  evento.preventDefault();
  handleBuscarProduto(document.querySelector('#campo-busca').value);
});

async function abrirCamera() {
  const botaoAbrir = document.querySelector('#botao-camera');
  botaoAbrir.disabled = true;
  botaoFoto.disabled = true;
  controlesFoco.definirOcupado(true);
  controlesZoomCamera.hidden = true;
  UI.setHidden('#camera', false);
  UI.mensagem('Ativando câmera...');
  try {
    if (!await camera.abrir()) return;
    configurarZoomDaCamera();
    controlesFoco.atualizar();
    if (camera.obterTrilha()) UI.mensagem('Câmera ativada.');
  } catch (err) {
    UI.mensagem(err.message, 'erro');
    camera.encerrar();
    UI.setHidden('#camera', true);
  } finally {
    botaoAbrir.disabled = false;
    botaoFoto.disabled = false;
    controlesFoco.definirOcupado(false);
  }
}

document.querySelector('#botao-camera').addEventListener('click', () => abrirCamera());

function fecharCamera() {
  camera.encerrar();
  controlesFoco.definirOcupado(false);
  controlesZoomCamera.hidden = true;
  UI.setHidden('#camera', true);
}

document.querySelector('#botao-fechar-camera').addEventListener('click', fecharCamera);

window.addEventListener('pagehide', () => camera.encerrar());

controleZoomCamera.addEventListener('change', async evento => {
  const sessao = camera.sessao;
  controleZoomCamera.disabled = true;
  try {
    const zoom = Number(evento.currentTarget.value);
    if (await camera.ajustarZoom(zoom)) configurarZoomDaCamera();
  } catch {
    if (sessao === camera.sessao) UI.mensagem('O aparelho não aceitou este nível de zoom.', 'aviso');
  } finally {
    controleZoomCamera.disabled = false;
  }
});

document.querySelectorAll('[data-status]').forEach(botao =>
  botao.addEventListener('click', () => registrarConferencia(botao.dataset.status))
);

document.querySelector('#formulario-operador').addEventListener('submit', async evento => {
  evento.preventDefault();
  if (registroEmAndamento) return;

  registroEmAndamento = true;
  const botao = evento.currentTarget.querySelector('button[type="submit"]');
  botao.disabled = true;
  const nome = document.querySelector('#nome-operador').value;
  Auth.setOperator(nome);
  try {
    await efetuarRegistro(nome);
    document.querySelector('#modal-operador').close();
    document.querySelector('#nome-operador').value = '';
  } finally {
    registroEmAndamento = false;
    botao.disabled = false;
  }
});

const modalOperador = document.querySelector('#modal-operador');

function cancelarRegistroPendente() {
  statusPendente = null;
  document.querySelector('#nome-operador').value = '';
}

document.querySelector('#botao-fechar-operador').addEventListener('click', () => {
  cancelarRegistroPendente();
  modalOperador.close();
});

modalOperador.addEventListener('cancel', cancelarRegistroPendente);

document.querySelector('#botao-sair').addEventListener('click', () => {
  document.querySelector('#modal-admin').showModal();
  requestAnimationFrame(() => document.querySelector('#usuario-admin').focus());
});

document.querySelector('#botao-fechar-admin').addEventListener('click', () => {
  document.querySelector('#modal-admin').close();
  document.querySelector('#erro-admin').textContent = '';
});

const campoSenhaAdmin = document.querySelector('#senha-admin');
const botaoMostrarSenha = document.querySelector('#botao-mostrar-senha');

function ocultarSenhaAdmin() {
  campoSenhaAdmin.type = 'password';
  botaoMostrarSenha.querySelector('span').textContent = '👁';
  botaoMostrarSenha.setAttribute('aria-label', 'Mostrar senha');
  botaoMostrarSenha.setAttribute('aria-pressed', 'false');
}

botaoMostrarSenha.addEventListener('click', evento => {
  const senha = campoSenhaAdmin;
  const senhaEstaVisivel = senha.type === 'text';

  senha.type = senhaEstaVisivel ? 'password' : 'text';
  evento.currentTarget.querySelector('span').textContent = senhaEstaVisivel ? '👁' : '🙈';
  evento.currentTarget.setAttribute('aria-label', senhaEstaVisivel ? 'Mostrar senha' : 'Ocultar senha');
  evento.currentTarget.setAttribute('aria-pressed', String(!senhaEstaVisivel));
});

document.querySelector('#modal-admin').addEventListener('close', ocultarSenhaAdmin);

function tentarSairDoKiosk() {
  if (window.fully) {
    try { window.fully.executeCommand('exit_kiosk_mode'); } catch (e) {}
  }
}

document.querySelector('#formulario-admin').addEventListener('submit', async evento => {
  evento.preventDefault();
  const usuario = document.querySelector('#usuario-admin').value;
  const senha = document.querySelector('#senha-admin').value;

  UI.mensagem('Validando credenciais...');
  const isValid = await API.validarAdmin(usuario, senha);

  if (isValid) {
    await Auth.logoutUser();
    document.querySelector('#modal-admin').close();
    document.querySelector('#tela-encerrada').hidden = false;
    tentarSairDoKiosk();
  } else {
    document.querySelector('#erro-admin').textContent = 'Credenciais incorretas.';
    UI.mensagem('Erro de autenticação.', 'erro');
  }
});

document.querySelector('#botao-retomar').addEventListener('click', () => {
  window.location.reload();
});

window.addEventListener('produto-selecionado', (e) => {
  produtoAtual = e.detail;
  UI.exibirProduto(produtoAtual);
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');

window.addEventListener('load', async () => {
  const pendencias = document.querySelector('#pendencias-offline');
  const quantidadePendente = API.quantidadeDeRegistrosOffline();
  if (quantidadePendente > 0) {
    pendencias.hidden = false;
    pendencias.textContent = `${quantidadePendente} conferência(s) pendente(s) de sincronização.`;
  }

  const syncResult = await API.sincronizarDadosOffline();
  if (syncResult?.success) {
    pendencias.hidden = true;
    UI.mensagem(`Sincronizados ${syncResult.count} registros offline.`, 'sucesso');
  } else if (syncResult?.remaining) {
    pendencias.hidden = false;
    pendencias.textContent = `${syncResult.remaining} conferência(s) aguardando conexão para sincronizar.`;
  }
});

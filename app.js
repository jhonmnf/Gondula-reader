import * as API from './js/api.js';
import * as UI from './js/ui.js';
import { CameraManager } from './js/camera.js';
import * as Auth from './js/auth.js';

if (!Auth.isUserLoggedIn()) {
  window.location.href = 'login.html';
}

let produtoAtual = null;
let statusPendente = null;
const camera = new CameraManager(async (codigo) => {
  document.querySelector('#campo-busca').value = codigo;
  await handleBuscarProduto(codigo);
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
    UI.mensagem('Produtos encontrados.', 'sucesso');
    UI.exibirListaProdutos(result.data);
  } else {
    UI.mensagem('Produto encontrado.', 'sucesso');
    UI.exibirProduto(result.data);
    produtoAtual = result.data;
    camera.encerrar();
  }
}

async function registrarConferencia(status) {
  if (!produtoAtual) return;
  statusPendente = status;
  document.querySelector('#modal-operador').showModal();
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

document.querySelector('#botao-camera').addEventListener('click', async () => {
  UI.setHidden('#camera', false);
  UI.mensagem('Ativando câmera...');
  try {
    await camera.abrir();
  } catch (err) {
    UI.mensagem(err.message, 'erro');
    camera.encerrar();
  }
});

document.querySelector('#botao-fechar-camera').addEventListener('click', () => {
  camera.encerrar();
  UI.setHidden('#camera', true);
});

document.querySelectorAll('[data-status]').forEach(botao =>
  botao.addEventListener('click', () => registrarConferencia(botao.dataset.status))
);

document.querySelector('#formulario-operador').addEventListener('submit', evento => {
  evento.preventDefault();
  const nome = document.querySelector('#nome-operador').value;
  Auth.setOperator(nome);
  efetuarRegistro(nome);
  document.querySelector('#modal-operador').close();
  document.querySelector('#nome-operador').value = '';
});

document.querySelector('#botao-sair').addEventListener('click', () => {
  document.querySelector('#modal-admin').showModal();
});

document.querySelector('#botao-fechar-admin').addEventListener('click', () => {
  document.querySelector('#modal-admin').close();
  document.querySelector('#erro-admin').textContent = '';
});

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
    Auth.logoutUser();
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
  const syncResult = await API.sincronizarDadosOffline();
  if (syncResult?.success) {
    UI.mensagem(`Sincronizados ${syncResult.count} registros offline.`, 'sucesso');
  }
});

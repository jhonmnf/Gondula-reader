if (localStorage.getItem('isLoggedIn') !== 'true') {
  window.location.href = 'login.html';
}

const SERVER_URL = 'http://localhost:5000'; // Altere para a URL de produção fornecida pela Alterdata

const formatarPreco = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const setHidden = (id, value) => {
  const el = document.querySelector(id);
  if (!el) return;
  el.hidden = value;
};

const mensagem = (texto, tipo = 'info') => {
  const el = document.querySelector('#mensagem');
  if (!el) return;
  el.textContent = texto;

  if (tipo === 'erro') {
    el.classList.add('mensagem--erro');
    setTimeout(() => el.classList.remove('mensagem--erro'), 500);
  } else {
    el.classList.remove('mensagem--erro');
  }
};

async function buscarProduto(termo) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) {
    setHidden('#produto', true);
    setHidden('#lista-resultados', true);
    setHidden('#leitura', false);
    mensagem('Informe o código ou nome do produto.', 'erro');
    return;
  }

  mensagem('Consultando servidor...');

  try {
    const response = await fetch(`${SERVER_URL}/api/product/${termoLimpo}`, {
        mode: 'cors',
        cache: 'no-cache'
    });

    if (response.ok) {
      const resultado = await response.json();
      if (resultado.success) {
        if (Array.isArray(resultado.data)) {
          mensagem('Produtos encontrados.');
          exibirListaProdutos(resultado.data);
        } else {
          mensagem('Produto encontrado.');
          exibirProduto(resultado.data);
        }
        return;
      }
    }
  } catch (err) {
    console.error('Erro de conexão:', err);
    mensagem('Erro de conexão com o servidor.', 'erro');
  }

  setHidden('#produto', true);
  setHidden('#lista-resultados', true);
  mensagem('Produto não encontrado.', 'erro');
}

function exibirListaProdutos(produtos) {
  setHidden('#estado-inicial', true);
  setHidden('#produto', true);
  setHidden('#leitura', true);

  const container = document.querySelector('#resultados-grade');
  container.innerHTML = '';

  produtos.forEach(p => {
    const item = document.createElement('div');
    item.className = 'produto-item';
    item.innerHTML = `
      <span class="nome">${p.nome}</span>
      <div class="info">
        <span>${p.codigo}</span>
        <span class="preco">${formatarPreco(p.preco)}</span>
      </div>
    `;
    item.onclick = () => exibirProduto(p);
    container.appendChild(item);
  });

  document.querySelector('#lista-resultados').hidden = false;
}

function exibirProduto(produto) {
  produtoAtual = produto;

  setHidden('#estado-inicial', true);
  setHidden('#lista-resultados', true);
  setHidden('#leitura', true);

  document.querySelector('#codigo-produto').textContent = produto.codigo;
  document.querySelector('#nome-produto').textContent = produto.nome;
  document.querySelector('#detalhe-produto').textContent = produto.detalhe;
  document.querySelector('#preco-produto').textContent = formatarPreco(produto.preco);

  const elProduto = document.querySelector('#produto');
  elProduto.hidden = false;
  elProduto.style.display = 'block';

  elProduto.classList.remove('produto--animar');
  void elProduto.offsetWidth;
  elProduto.classList.add('produto--animar');
  elProduto.scrollIntoView({ behavior: 'smooth', block: 'start' });

  mensagem('Produto localizado.');
  encerrarCamera();
}

let produtoAtual = null;
let streamCamera = null;
let leituraAtiva = false;
let leitorZxing = null;
let controlesZxing = null;

async function abrirCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    mensagem('Câmera não suportada neste navegador.');
    return;
  }
  setHidden('#camera', false);
  const video = document.querySelector('#video');

  mensagem('Ativando câmera...');

  try {
    const constraints = {
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    };

    streamCamera = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = streamCamera;
    await video.play();

    if ('BarcodeDetector' in window) {
      iniciarLeituraNativa();
      return;
    }

    if (window.ZXingBrowser?.BrowserMultiFormatReader) {
      iniciarLeituraZxing(video);
      return;
    }

    mensagem('Leitor não suportado. Use a busca manual.');
    encerrarCamera();
  } catch (err) {
    mensagem('Erro ao abrir câmera. Verifique as permissões.');
    encerrarCamera();
  }
}

async function iniciarLeituraNativa() {
  try {
    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a'] });
    const video = document.querySelector('#video');
    const trackingBox = document.querySelector('#tracking-box');

    const ler = async () => {
      if (!leituraAtiva) return;
      try {
        const codigos = await detector.detect(video);
        if (codigos.length > 0) {
          const codigo = codigos[0];
          if (trackingBox) {
            const { x, y, width, height } = codigo.boundingBox;
            trackingBox.style.left = `${x}px`;
            trackingBox.style.top = `${y}px`;
            trackingBox.style.width = `${width}px`;
            trackingBox.style.height = `${height}px`;
            trackingBox.hidden = false;
          }
          if (codigo.rawValue) {
            document.querySelector('#campo-busca').value = codigo.rawValue;
            buscarProduto(codigo.rawValue);
            return;
          }
        } else if (trackingBox) {
          trackingBox.hidden = true;
        }
      } catch (e) {}
      requestAnimationFrame(ler);
    };
    leituraAtiva = true;
    ler();
  } catch (e) {}
}

async function iniciarLeituraZxing(video) {
  try {
    leitorZxing = new ZXingBrowser.BrowserMultiFormatReader();
    leituraAtiva = true;

    const ler = async () => {
      if (!leituraAtiva) return;
      try {
        const resultado = await leitorZxing.decodeFromVideoElement(video);
        if (resultado?.getText()) {
          document.querySelector('#campo-busca').value = resultado.getText();
          buscarProduto(resultado.getText());
          return;
        }
      } catch (e) {}
      requestAnimationFrame(ler);
    };
    ler();
  } catch (e) {}
}

function encerrarCamera() {
  leituraAtiva = false;
  if (controlesZxing) {
    controlesZxing.stop();
    controlesZxing = null;
  }
  leitorZxing = null;
  const trackingBox = document.querySelector('#tracking-box');
  if (trackingBox) trackingBox.hidden = true;
  if (streamCamera) {
    streamCamera.getTracks().forEach(track => track.stop());
    streamCamera = null;
  }
  const video = document.querySelector('#video');
  if (video) video.srcObject = null;
  setHidden('#camera', true);
}

document.querySelector('#botao-voltar-busca').addEventListener('click', () => {
  setHidden('#lista-resultados', true);
  setHidden('#leitura', false);
  setHidden('#produto', true);
  mensagem('Busca reiniciada.');
});

document.querySelector('#botao-voltar-produto').addEventListener('click', () => {
  const grade = document.querySelector('#resultados-grade');
  if (grade && grade.children.length > 0) {
    setHidden('#produto', true);
    setHidden('#lista-resultados', false);
    setHidden('#leitura', true);
  } else {
    setHidden('#produto', true);
    setHidden('#leitura', false);
    setHidden('#lista-resultados', true);
  }
});

document.querySelector('#formulario-busca').addEventListener('submit', evento => {
  evento.preventDefault();
  buscarProduto(document.querySelector('#campo-busca').value);
});
document.querySelector('#botao-camera').addEventListener('click', abrirCamera);
document.querySelector('#botao-fechar-camera').addEventListener('click', encerrarCamera);
document.querySelectorAll('[data-status]').forEach(botao => botao.addEventListener('click', () => registrarConferencia(botao.dataset.status)));

const modalAdmin = document.querySelector('#modal-admin');
document.querySelector('#botao-sair').addEventListener('click', () => modalAdmin.showModal());
document.querySelector('#botao-fechar-admin').addEventListener('click', () => {
  modalAdmin.close();
  document.querySelector('#erro-admin').textContent = '';
});

function tentarSairDoKiosk() {
  if (window.fully) {
    try { window.fully.executeCommand('exit_kiosk_mode'); } catch (e) {}
  }
}

document.querySelector('#formulario-admin').addEventListener('submit', evento => {
  evento.preventDefault();
  const usuario = document.querySelector('#usuario-admin').value;
  const senha = document.querySelector('#senha-admin').value;
  if (usuario === 'admin' && senha === 'admin') {
    localStorage.removeItem('isLoggedIn');
    modalAdmin.close();
    document.querySelector('#tela-encerrada').hidden = false;
    tentarSairDoKiosk();
    return;
  }
  document.querySelector('#erro-admin').textContent = 'Credenciais incorretas.';
});

document.querySelector('#botao-retomar').addEventListener('click', () => {
  window.location.reload();
});

function registrarConferencia(status) {
  if (!produtoAtual) return;
  const registros = JSON.parse(localStorage.getItem('conferencias') || '[]');
  registros.push({ codigo: produtoAtual.codigo, nome: produtoAtual.nome, status, em: new Date().toISOString() });
  localStorage.setItem('conferencias', JSON.stringify(registros));
  const rotulos = { correta: 'Resultado: Correta', divergente: 'Resultado: Divergente', ausente: 'Resultado: Ausente' };
  mensagem(`${rotulos[status]}. Registro salvo.`);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');

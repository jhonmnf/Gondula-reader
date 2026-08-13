const catalogo = [
  { codigo: '7898541474111', nome: 'Cloro Gel Altolim', detalhe: '2 litros · Limpeza geral', preco: 12.99 },
  { codigo: '7896006731223', nome: 'Detergente Neutro Brilho', detalhe: '500 ml · Limpeza de louças', preco: 3.49 },
  { codigo: '7891024187543', nome: 'Saco para Lixo Reforçado', detalhe: '50 litros · Rolo com 10 unidades', preco: 16.9 }
];
let produtoAtual = null;
let streamCamera = null;
let leituraAtiva = false;
let leitorZxing = null;
let controlesZxing = null;

const formatarPreco = valor => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const mensagem = texto => { document.querySelector('#mensagem').textContent = texto; };

function encontrarProduto(termo) {
  const busca = termo.trim().toLowerCase();
  if (!busca) return null;
  return catalogo.find(item => item.codigo === busca || item.nome.toLowerCase().includes(busca));
}

function exibirProduto(produto) {
  produtoAtual = produto;
  document.querySelector('#estado-inicial').hidden = true;
  document.querySelector('#codigo-produto').textContent = produto.codigo;
  document.querySelector('#nome-produto').textContent = produto.nome;
  document.querySelector('#detalhe-produto').textContent = produto.detalhe;
  document.querySelector('#preco-produto').textContent = formatarPreco(produto.preco);
  document.querySelector('#produto').hidden = false;
  mensagem('Produto encontrado. Compare a etiqueta e registre o resultado.');
  encerrarCamera();
}

async function buscarProduto(termo) {
  if (!termo.trim()) {
    document.querySelector('#produto').hidden = true;
    mensagem('Informe o código ou nome de um produto para buscar.');
    return;
  }

  mensagem('Buscando produto...');

  try {
    // Tenta buscar no simulador Alterdata (API)
    const response = await fetch(`http://localhost:5000/api/product/${termo.trim()}`);

    if (response.ok) {
      const resultado = await response.json();
      if (resultado.success) {
        console.log('Produto encontrado via API:', resultado.data);
        exibirProduto(resultado.data);
        return;
      }
    }
  } catch (err) {
    console.log('Servidor offline ou erro na API, usando catálogo local...');
  }

  // Fallback: Busca no catálogo local caso a API falhe ou não encontre
  const produto = encontrarProduto(termo);
  if (!produto) {
    document.querySelector('#produto').hidden = true;
    mensagem('Produto não encontrado. Tente 7898541474111.');
    return;
  }
  exibirProduto(produto);
}

function registrarConferencia(status) {
  if (!produtoAtual) return;
  const registros = JSON.parse(localStorage.getItem('conferencias') || '[]');
  registros.push({ codigo: produtoAtual.codigo, nome: produtoAtual.nome, status, em: new Date().toISOString() });
  localStorage.setItem('conferencias', JSON.stringify(registros));
  const rotulos = { correta: 'Etiqueta marcada como correta.', divergente: 'Divergência registrada para troca.', ausente: 'Etiqueta ausente registrada para impressão.' };
  mensagem(`${rotulos[status]} Registro salvo neste aparelho.`);
}

async function abrirCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    mensagem('Este navegador não permite usar a câmera. Use a busca manual.');
    return;
  }
  document.querySelector('#camera').hidden = false;
  const video = document.querySelector('#video');

  mensagem('Ativando câmera...');

  try {
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    streamCamera = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = streamCamera;
    await video.play();

    if ('BarcodeDetector' in window) {
      mensagem('Leitor nativo ativo. Aponte para o código.');
      iniciarLeituraNativa();
      return;
    }

    if (window.ZXingBrowser?.BrowserMultiFormatReader) {
      mensagem('Leitor ZXing ativo. Aponte para o código.');
      iniciarLeituraZxing(video);
      return;
    }

    mensagem('Leitor de código não suportado. Use a busca manual.');
    encerrarCamera();
  } catch (err) {
    console.error(err);
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

          // Atualiza a caixa de rastreamento visual
          if (trackingBox) {
            const { x, y, width, height } = codigo.boundingBox;
            trackingBox.style.left = `${x}px`;
            trackingBox.style.top = `${y}px`;
            trackingBox.style.width = `${width}px`;
            trackingBox.style.height = `${height}px`;
            trackingBox.hidden = false;
          }

          if (codigo.rawValue) {
            console.log('Código detectado nativamente:', codigo.rawValue);
            document.querySelector('#campo-busca').value = codigo.rawValue;
            buscarProduto(codigo.rawValue);
            return;
          }
        } else if (trackingBox) {
          trackingBox.hidden = true;
        }
      } catch (e) {
        console.error('Erro durante a detecção nativa:', e);
      }
      requestAnimationFrame(ler);
    };

    leituraAtiva = true;
    ler();
  } catch (e) {
    console.error('Erro no detector nativo:', e);
    mensagem('Erro ao iniciar leitor nativo. Tentando fallback...');
  }
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
  } catch (e) {
    console.error('Erro no ZXing:', e);
  }
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

  document.querySelector('#camera').hidden = true;
}

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
    console.log('Comunicando com Fully Kiosk...');
    try {
      // Tenta disparar o comando de saída do modo Kiosk
      // Nota: Isso requer a opção "Allow JS to exit Kiosk Mode" ativa nas configurações do Fully Kiosk
      window.fully.executeCommand('exit_kiosk_mode');
    } catch (e) {
      console.error('Erro ao tentar sair do modo kiosk via API:', e);
    }
  } else {
    console.log('API do Fully Kiosk não detectada (rodando em navegador comum).');
  }
}

document.querySelector('#formulario-admin').addEventListener('submit', evento => {
  evento.preventDefault();
  const usuario = document.querySelector('#usuario-admin').value;
  const senha = document.querySelector('#senha-admin').value;
  if (usuario === 'admin' && senha === 'admin') {
    modalAdmin.close();
    document.querySelector('#tela-encerrada').hidden = false;
    tentarSairDoKiosk();
    return;
  }
  document.querySelector('#erro-admin').textContent = 'Usuário ou senha incorretos.';
});
document.querySelector('#botao-retomar').addEventListener('click', () => {
  document.querySelector('#tela-encerrada').hidden = true;
  document.querySelector('#formulario-admin').reset();
  document.querySelector('#erro-admin').textContent = '';
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');

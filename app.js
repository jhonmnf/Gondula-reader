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

function buscarProduto(termo) {
  if (!termo.trim()) {
    document.querySelector('#produto').hidden = true;
    mensagem('Informe o código ou nome de um produto para buscar.');
    return;
  }
  const produto = encontrarProduto(termo);
  if (!produto) {
    document.querySelector('#produto').hidden = true;
    mensagem('Produto não encontrado no catálogo de demonstração. Tente 7898541474111.');
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

  if (window.ZXingBrowser?.BrowserMultiFormatReader) {
    try {
      leitorZxing = new ZXingBrowser.BrowserMultiFormatReader();
      controlesZxing = await leitorZxing.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        video,
        resultado => {
          if (!resultado?.getText()) return;
          document.querySelector('#campo-busca').value = resultado.getText();
          buscarProduto(resultado.getText());
        }
      );
      mensagem('Câmera ativa. Aponte para o código de barras.');
      return;
    } catch (err) {
      console.error(err);
      mensagem('Erro ao iniciar leitor ZXing. Tentando modo nativo...');
    }
  }

  if (!('BarcodeDetector' in window)) {
    mensagem('Leitor de código indisponível neste navegador. Use a busca manual.');
    encerrarCamera();
    return;
  }

  try {
    streamCamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = streamCamera;
    await video.play();
    iniciarLeituraPorCamera();
    mensagem('Câmera ativa. Aponte para o código de barras.');
  } catch {
    mensagem('Não foi possível abrir a câmera. Verifique a permissão.');
    encerrarCamera();
  }
}

async function iniciarLeituraPorCamera() {
  if (leituraAtiva) return;
  leituraAtiva = true;
  const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a'] });
  const video = document.querySelector('#video');
  const ler = async () => {
    if (!leituraAtiva) return;
    try {
      const codigos = await detector.detect(video);
      if (codigos[0]?.rawValue) {
        document.querySelector('#campo-busca').value = codigos[0].rawValue;
        buscarProduto(codigos[0].rawValue);
        return;
      }
    } catch { /* mantém a alternativa de digitação */ }
    requestAnimationFrame(ler);
  };
  ler();
}

function encerrarCamera() {
  leituraAtiva = false;
  if (controlesZxing) {
    controlesZxing.stop();
    controlesZxing = null;
  }
  leitorZxing = null;

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
document.querySelector('#formulario-admin').addEventListener('submit', evento => {
  evento.preventDefault();
  const usuario = document.querySelector('#usuario-admin').value;
  const senha = document.querySelector('#senha-admin').value;
  if (usuario === 'admin' && senha === 'admin') {
    modalAdmin.close();
    document.querySelector('#tela-encerrada').hidden = false;
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

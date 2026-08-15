const SERVER_URL = 'http://localhost:5000'; // Altere para 'http://192.168.0.122:5000' quando for usar o servidor real

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
const mensagem = (texto, tipo = 'info') => {
  const el = document.querySelector('#mensagem');
  el.textContent = texto;

  if (tipo === 'erro') {
    el.classList.add('mensagem--erro');
    setTimeout(() => el.classList.remove('mensagem--erro'), 500);
  } else {
    el.classList.remove('mensagem--erro');
  }
};

function filtrarProdutos(termo) {
  const busca = termo.trim().toLowerCase();
  if (!busca) return [];

  return catalogo.filter(item => {
    const codigo = item.codigo.toLowerCase();
    const nome = item.nome.toLowerCase();
    return codigo.endsWith(busca) || codigo.includes(busca) || nome.includes(busca);
  }).sort((a, b) => {
    const aEnds = a.codigo.endsWith(busca);
    const bEnds = b.codigo.endsWith(busca);
    return bEnds - aEnds; // Prioritize those that end with the search term
  });
}

function exibirListaProdutos(produtos) {
  document.querySelector('#estado-inicial').hidden = true;
  document.querySelector('#produto').hidden = true;
  document.querySelector('#leitura').hidden = true; // Oculta a busca para focar na lista

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
  mensagem(`${produtos.length} produto(s) encontrado(s). Selecione o correto.`);
}

function exibirProduto(produto) {
  produtoAtual = produto;
  document.querySelector('#estado-inicial').hidden = true;
  document.querySelector('#lista-resultados').hidden = true;
  document.querySelector('#leitura').hidden = true;
  document.querySelector('#codigo-produto').textContent = produto.codigo;
  document.querySelector('#nome-produto').textContent = produto.nome;
  document.querySelector('#detalhe-produto').textContent = produto.detalhe;
  document.querySelector('#preco-produto').textContent = formatarPreco(produto.preco);

  const elProduto = document.querySelector('#produto');
  elProduto.hidden = false;

  // Adiciona animação de entrada e rola a tela suavemente
  elProduto.classList.remove('produto--animar');
  void elProduto.offsetWidth; // Trigger reflow
  elProduto.classList.add('produto--animar');
  elProduto.scrollIntoView({ behavior: 'smooth', block: 'start' });

  mensagem('Produto encontrado. Compare a etiqueta e registre o resultado.');
  encerrarCamera();
}

async function buscarProduto(termo) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) {
    document.querySelector('#produto').hidden = true;
    document.querySelector('#lista-resultados').hidden = true;
    document.querySelector('#leitura').hidden = false;
    mensagem('Informe o código ou nome de um produto para buscar.', 'erro');
    return;
  }

  console.log('--- INICIANDO BUSCA ---');
  console.log('Termo digitado:', termoLimpo);
  mensagem('🔄 Conectando ao servidor Alterdata...');

  try {
    console.log(`Tentando fetch em: ${SERVER_URL}/api/product/${termoLimpo}`);
    const response = await fetch(`${SERVER_URL}/api/product/${termoLimpo}`, {
        mode: 'cors',
        cache: 'no-cache'
    });

    console.log('Resposta do servidor status:', response.status);

    if (response.ok) {
      const resultado = await response.json();
      console.log('JSON recebido:', resultado);
      if (resultado.success) {
        if (Array.isArray(resultado.data)) {
          mensagem('✅ Produtos encontrados no servidor!');
          exibirListaProdutos(resultado.data);
        } else {
          mensagem('✅ Produto encontrado no servidor!');
          exibirProduto(resultado.data);
        }
        return;
      }
    } else {
      console.log(`Servidor respondeu ${response.status}. Prosseguindo para busca local...`);
    }
  } catch (err) {
    console.error('ERRO CRÍTICO NO FETCH:', err);
    mensagem('🔌 Servidor offline. Usando catálogo local...', 'erro');
  }

  // Fallback: Busca no catálogo local
  console.log('Buscando no catálogo local...');
  const produtos = filtrarProdutos(termoLimpo);

  if (produtos.length === 0) {
    document.querySelector('#produto').hidden = true;
    document.querySelector('#lista-resultados').hidden = true;
    mensagem('❌ Produto não encontrado em lugar nenhum.', 'erro');
    return;
  }

  if (produtos.length === 1) {
    mensagem('📦 Produto encontrado no catálogo local.');
    exibirProduto(produtos[0]);
  } else {
    exibirListaProdutos(produtos);
  }
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

document.querySelector('#botao-voltar-busca').addEventListener('click', () => {
  document.querySelector('#lista-resultados').hidden = true;
  document.querySelector('#leitura').hidden = false;
  document.querySelector('#produto').hidden = true;
  mensagem('Busque novamente por outro produto.');
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

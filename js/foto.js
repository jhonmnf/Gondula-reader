const FORMATOS = ['ean_13', 'ean_8', 'code_128', 'upc_a'];

async function carregarFoto(arquivo) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(arquivo);
  }
  // O caminho alternativo usa data: para respeitar a política de imagens do app.
  const dados = await new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error('Falha ao abrir a foto.'));
    leitor.readAsDataURL(arquivo);
  });
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('Formato de imagem não suportado.'));
    imagem.src = dados;
  });
}

export async function lerCodigoDaFoto(arquivo) {
  if (!arquivo || !arquivo.size || (arquivo.type && !arquivo.type.startsWith('image/'))) {
    throw new Error('Escolha uma foto válida do código de barras.');
  }
  if (arquivo.size > 40 * 1024 * 1024) {
    throw new Error('A foto é muito grande. Fotografe em resolução padrão e tente novamente.');
  }

  let imagem;
  try {
    imagem = await carregarFoto(arquivo);
  } catch {
    throw new Error('Não foi possível abrir a foto. Tire outra foto e tente novamente.');
  }

  const canvas = document.createElement('canvas');
  try {
    const largura = imagem.naturalWidth || imagem.width;
    const altura = imagem.naturalHeight || imagem.height;
    if (!largura || !altura) throw new Error('A foto está vazia. Tire outra foto.');
    const escala = Math.min(1, 3072 / Math.max(largura, altura));
    const larguraLeitura = Math.max(1, Math.round(largura * escala));
    const alturaLeitura = Math.max(1, Math.round(altura * escala));
    canvas.width = larguraLeitura;
    canvas.height = alturaLeitura;
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    if (!contexto) throw new Error('Não foi possível processar a foto neste navegador.');
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

    let detector;
    if (typeof BarcodeDetector === 'function') {
      try {
        const suportados = typeof BarcodeDetector.getSupportedFormats === 'function'
          ? await BarcodeDetector.getSupportedFormats() : FORMATOS;
        const formatos = FORMATOS.filter(formato => suportados.includes(formato));
        if (formatos.length) detector = new BarcodeDetector({ formats: formatos });
      } catch { /* A foto ainda pode ser lida pelo ZXing. */ }
    }

    if (detector) {
      try {
        const codigos = await detector.detect(canvas);
        const codigo = codigos.find(item => item.rawValue)?.rawValue;
        if (codigo) return codigo;
      } catch { /* Tenta o leitor alternativo abaixo. */ }
    }

    const Leitor = globalThis.ZXingBrowser?.BrowserMultiFormatReader;
    if (Leitor) {
      const leitor = new Leitor();
      // Códigos de barras podem estar deitados ou em pé na foto.
      for (const girar of [false, true]) {
        if (girar) {
          canvas.width = alturaLeitura;
          canvas.height = larguraLeitura;
          contexto.translate(canvas.width, 0);
          contexto.rotate(Math.PI / 2);
          contexto.drawImage(imagem, 0, 0, larguraLeitura, alturaLeitura);
        }
        try {
          const resultado = leitor.decodeFromCanvas(canvas);
          const codigo = resultado?.getText();
          if (codigo) return codigo;
        } catch { /* Tenta a outra orientação antes de solicitar nova foto. */ }
      }
    } else if (!detector) {
      throw new Error('Leitor de fotos indisponível. Recarregue o app com internet ou digite o código.');
    }
    throw new Error('Não encontrei um código na foto. Fotografe apenas uma etiqueta, com as barras nítidas e completas, ou digite o código.');
  } finally {
    imagem.close?.();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function configurarLeituraPorFoto({ botao, campoFoto, botaoCamera, formulario, fecharCamera, onCodigo, mensagem }) {
  let processando = false;
  botao.addEventListener('click', () => {
    if (processando) return;
    // Libera o sensor antes de solicitar a câmera do Android, no próprio clique.
    fecharCamera();
    campoFoto.value = '';
    campoFoto.click();
  });
  campoFoto.addEventListener('cancel', () => {
    if (!processando) mensagem('Captura cancelada. Você pode tentar novamente ou usar a leitura ao vivo.');
  });
  campoFoto.addEventListener('change', async () => {
    const arquivo = campoFoto.files?.[0];
    if (!arquivo || processando) return;
    processando = true;
    const controles = [botao, botaoCamera, ...formulario.elements];
    const estados = controles.map(controle => controle.disabled);
    controles.forEach(controle => { controle.disabled = true; });
    const textoOriginal = botao.textContent;
    botao.textContent = 'Lendo foto…';
    mensagem('Lendo o código da foto…');
    try {
      const codigo = await lerCodigoDaFoto(arquivo);
      await onCodigo(codigo);
    } catch (erro) {
      mensagem(erro.message || 'Não foi possível ler a foto. Tente novamente.', 'aviso');
    } finally {
      campoFoto.value = '';
      botao.textContent = textoOriginal;
      controles.forEach((controle, indice) => { controle.disabled = estados[indice]; });
      processando = false;
    }
  });
}

export class CameraManager {
  constructor(onProductFound, video = document.querySelector('#video')) {
    this.onProductFound = onProductFound;
    this.streamCamera = null;
    this.leituraAtiva = false;
    this.leitorZxing = null;
    this.controlesZxing = null;
    this.video = video;
    this.sessao = 0;
    this.ajustes = {};
    this.filaAjustes = Promise.resolve();
    this.statusFoco = '';
  }

  async abrir(deviceId) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Câmera não suportada neste navegador.');
    }

    this.encerrar();
    const sessao = this.sessao;
    const video = this.video;
    try {
      const stream = await this.obterCameraParaLeitura(deviceId);
      if (sessao !== this.sessao) {
        stream.getTracks().forEach(trilha => trilha.stop());
        return false;
      }
      this.streamCamera = stream;
      video.srcObject = this.streamCamera;
      await video.play();
      if (sessao !== this.sessao) return false;
      await this.ativarFocoContinuo();
      if (sessao !== this.sessao) return false;

      // A página de diagnóstico usa a mesma câmera sem iniciar a leitura.
      if (!this.onProductFound) return true;

      if ('BarcodeDetector' in window) {
        this.iniciarLeituraNativa();
      } else if (window.ZXingBrowser?.BrowserMultiFormatReader) {
        this.iniciarLeituraZxing(video);
      } else {
        throw new Error('Leitor de código de barras não suportado.');
      }
      return true;
    } catch (err) {
      if (sessao !== this.sessao) return false;
      this.encerrar();
      throw err;
    }
  }

  async obterCameraParaLeitura(deviceId) {
    const video = {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      resizeMode: { ideal: 'none' }
    };

    if (deviceId) {
      return navigator.mediaDevices.getUserMedia({
        video: { ...video, deviceId: { exact: deviceId } },
        audio: false
      });
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...video, facingMode: { exact: 'environment' } },
        audio: false
      });
    } catch (err) {
      if (!['OverconstrainedError', 'NotFoundError'].includes(err.name)) throw err;

      return navigator.mediaDevices.getUserMedia({
        video: { ...video, facingMode: { ideal: 'environment' } },
        audio: false
      });
    }
  }

  obterTrilha() {
    return this.streamCamera?.getVideoTracks()[0];
  }

  async listarCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      return dispositivos.filter(dispositivo => dispositivo.kind === 'videoinput' && dispositivo.deviceId);
    } catch {
      return [];
    }
  }

  podeRefocar() {
    const modos = this.obterTrilha()?.getCapabilities?.().focusMode || [];
    return modos.includes('continuous') || modos.includes('single-shot');
  }

  aplicarAjustes(ajustes) {
    const trilha = this.obterTrilha();
    const aplicar = async () => {
      if (!trilha || trilha !== this.obterTrilha()) return false;
      const novosAjustes = { ...this.ajustes, ...ajustes };
      await trilha.applyConstraints({ advanced: [novosAjustes] });
      if (trilha !== this.obterTrilha()) return false;
      this.ajustes = novosAjustes;
      return true;
    };
    const resultado = this.filaAjustes.then(aplicar);
    this.filaAjustes = resultado.catch(() => {});
    return resultado;
  }

  async ativarFocoContinuo(refocar = false) {
    const trilha = this.obterTrilha();
    const modos = trilha?.getCapabilities?.().focusMode || [];
    const preferencia = refocar ? ['single-shot', 'continuous'] : ['continuous', 'single-shot'];
    const disponiveis = preferencia.filter(modo => modos.includes(modo));
    this.statusFoco = disponiveis.length
      ? 'Não foi possível ajustar o foco. Tente outra câmera.'
      : 'O navegador não oferece controle de foco nesta câmera. Tente outra câmera.';

    for (const focusMode of disponiveis) {
      try {
        if (!await this.aplicarAjustes({ focusMode })) return false;
        const atual = trilha.getSettings?.().focusMode;
        // Restrições opcionais podem ser ignoradas sem gerar erro.
        if (atual && atual !== focusMode) continue;
        this.statusFoco = atual === focusMode
          ? (focusMode === 'continuous'
            ? 'Modo de foco contínuo informado pela câmera. Verifique a nitidez das barras.'
            : 'Foco automático pontual solicitado. Aguarde e verifique a nitidez das barras.')
          : 'Ajuste de foco solicitado; o navegador não confirmou o modo aplicado.';
        return true;
      } catch {
        if (trilha !== this.obterTrilha()) return false;
      }
    }
    return false;
  }

  obterFaixaDeZoom() {
    const [trilha] = this.streamCamera?.getVideoTracks() || [];
    const zoom = trilha?.getCapabilities?.().zoom;
    if (!zoom) return null;

    return {
      min: zoom.min,
      max: zoom.max,
      step: zoom.step || 0.1,
      atual: trilha.getSettings().zoom || zoom.min
    };
  }

  async ajustarZoom(valor) {
    const [trilha] = this.streamCamera?.getVideoTracks() || [];
    const faixa = this.obterFaixaDeZoom();
    if (!trilha || !faixa) return false;

    if (!Number.isFinite(Number(valor))) return false;
    const zoom = Math.min(faixa.max, Math.max(faixa.min, Number(valor)));
    return this.aplicarAjustes({ zoom });
  }

  async iniciarLeituraNativa() {
    try {
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a'] });
      const video = this.video;
      const sessao = this.sessao;
      const trackingBox = document.querySelector('#tracking-box');

      const ler = async () => {
        if (!this.leituraAtiva || sessao !== this.sessao) return;
        try {
          const codigos = await detector.detect(video);
          if (!this.leituraAtiva || sessao !== this.sessao) return;
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
              this.onProductFound(codigo.rawValue);
              return;
            }
          } else if (trackingBox) {
            trackingBox.hidden = true;
          }
        } catch (e) {}
        requestAnimationFrame(ler);
      };
      this.leituraAtiva = true;
      ler();
    } catch (e) {
      console.error('Erro leitura nativa:', e);
    }
  }

  async iniciarLeituraZxing(video) {
    try {
      this.leitorZxing = new ZXingBrowser.BrowserMultiFormatReader();
      const leitor = this.leitorZxing;
      const sessao = this.sessao;
      this.leituraAtiva = true;

      const ler = async () => {
        if (!this.leituraAtiva || sessao !== this.sessao) return;
        try {
          const resultado = await leitor.decodeFromVideoElement(video);
          if (!this.leituraAtiva || sessao !== this.sessao) return;
          if (resultado?.getText()) {
            this.onProductFound(resultado.getText());
            return;
          }
        } catch (e) {}
        requestAnimationFrame(ler);
      };
      ler();
    } catch (e) {
      console.error('Erro leitura ZXing:', e);
    }
  }

  encerrar() {
    this.sessao += 1;
    this.ajustes = {};
    this.filaAjustes = Promise.resolve();
    this.statusFoco = '';
    this.leituraAtiva = false;
    if (this.controlesZxing) {
      this.controlesZxing.stop();
      this.controlesZxing = null;
    }
    this.leitorZxing = null;
    const trackingBox = document.querySelector('#tracking-box');
    if (trackingBox) trackingBox.hidden = true;
    if (this.streamCamera) {
      this.streamCamera.getTracks().forEach(track => track.stop());
      this.streamCamera = null;
    }
    const video = this.video;
    if (video) video.srcObject = null;
  }
}

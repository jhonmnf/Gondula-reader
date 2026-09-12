export class CameraManager {
  constructor(onProductFound) {
    this.onProductFound = onProductFound;
    this.streamCamera = null;
    this.leituraAtiva = false;
    this.leitorZxing = null;
    this.controlesZxing = null;
  }

  async abrir() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Câmera não suportada neste navegador.');
    }

    const video = document.querySelector('#video');
    try {
      this.streamCamera = await this.obterCameraParaLeitura();
      video.srcObject = this.streamCamera;
      await video.play();
      await this.ativarFocoContinuo();

      if ('BarcodeDetector' in window) {
        this.iniciarLeituraNativa();
      } else if (window.ZXingBrowser?.BrowserMultiFormatReader) {
        this.iniciarLeituraZxing(video);
      } else {
        throw new Error('Leitor de código de barras não suportado.');
      }
    } catch (err) {
      this.encerrar();
      throw err;
    }
  }

  async obterCameraParaLeitura() {
    const video = {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
      resizeMode: { ideal: 'none' }
    };

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

  async ativarFocoContinuo() {
    const [trilha] = this.streamCamera?.getVideoTracks() || [];
    const capacidades = trilha?.getCapabilities?.();

    if (!capacidades?.focusMode?.includes('continuous')) return;

    try {
      await trilha.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    } catch (err) {
      console.warn('Não foi possível ativar o foco contínuo da câmera.', err);
    }
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

    const zoom = Math.min(faixa.max, Math.max(faixa.min, Number(valor)));
    await trilha.applyConstraints({ advanced: [{ zoom }] });
    return true;
  }

  async iniciarLeituraNativa() {
    try {
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'upc_a'] });
      const video = document.querySelector('#video');
      const trackingBox = document.querySelector('#tracking-box');

      const ler = async () => {
        if (!this.leituraAtiva) return;
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
      this.leituraAtiva = true;

      const ler = async () => {
        if (!this.leituraAtiva) return;
        try {
          const resultado = await this.leitorZxing.decodeFromVideoElement(video);
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
    const video = document.querySelector('#video');
    if (video) video.srcObject = null;
  }
}

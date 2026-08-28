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
      const constraints = {
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };

      this.streamCamera = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = this.streamCamera;
      await video.play();

      if ('BarcodeDetector' in window) {
        this.iniciarLeituraNativa();
      } else if (window.ZXingBrowser?.BrowserMultiFormatReader) {
        this.iniciarLeituraZxing(video);
      } else {
        throw new Error('Leitor de código de barras não suportado.');
      }
    } catch (err) {
      throw err;
    }
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

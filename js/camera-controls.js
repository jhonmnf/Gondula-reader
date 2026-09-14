// Controles compartilhados pelo leitor e pela página de diagnóstico.
export function criarControlesFoco(camera, container, abrirCamera, atualizarDados = () => {}) {
  const selecao = container.querySelector('[data-camera-selecao]');
  const campo = container.querySelector('[data-camera-campo]');
  const refocar = container.querySelector('[data-camera-refocar]');
  const status = container.querySelector('[data-camera-status]');

  function definirOcupado(ocupado) {
    selecao.disabled = ocupado || !camera.obterTrilha();
    refocar.disabled = ocupado || !camera.podeRefocar();
  }

  async function atualizar() {
    const trilha = camera.obterTrilha();
    const cameras = await camera.listarCameras();
    if (!trilha || trilha !== camera.obterTrilha()) return;
    selecao.replaceChildren();
    const atual = trilha.getSettings?.().deviceId;
    // Sem identificação da câmera atual, não indique uma lente arbitrária.
    if (!cameras.some(item => item.deviceId === atual)) {
      const opcao = new Option(trilha.label || 'Câmera atual', '', true, true);
      opcao.disabled = true;
      selecao.add(opcao);
    }
    cameras.forEach((item, indice) => {
      selecao.add(new Option(item.label || `Câmera ${indice + 1}`, item.deviceId, false, item.deviceId === atual));
    });
    campo.hidden = cameras.length < 2;
    status.textContent = camera.statusFoco;
    definirOcupado(false);
  }

  selecao.addEventListener('change', () => abrirCamera(selecao.value));
  refocar.addEventListener('click', async () => {
    const trilha = camera.obterTrilha();
    definirOcupado(true);
    status.textContent = 'Solicitando foco…';
    try {
      await camera.ativarFocoContinuo(true);
      if (trilha === camera.obterTrilha()) {
        status.textContent = camera.statusFoco;
        atualizarDados();
      }
    } finally {
      definirOcupado(false);
    }
  });

  definirOcupado(false);
  return { atualizar, definirOcupado };
}

// Controles compartilhados pelo leitor e pela página de diagnóstico.
export function criarControlesFoco(camera, container, atualizarDados = () => {}) {
  const refocar = container.querySelector('[data-camera-refocar]');
  const status = container.querySelector('[data-camera-status]');

  function definirOcupado(ocupado) {
    refocar.disabled = ocupado || !camera.podeRefocar();
  }

  function atualizar() {
    status.textContent = camera.statusFoco;
    definirOcupado(false);
  }

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

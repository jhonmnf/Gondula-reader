const SERVER_URL = ''; // Relative paths for Vercel Functions

export async function buscarProduto(termo) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) return { error: 'Informe o código ou nome do produto.' };

  try {
    const response = await fetch(`${SERVER_URL}/api/product/${termoLimpo}`, {
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!response.ok) throw new Error('Erro na resposta do servidor');

    const resultado = await response.json();
    if (!resultado.success) throw new Error('Produto não encontrado');

    return { data: resultado.data };
  } catch (err) {
    console.error('Erro de conexão:', err);
    return { error: err.message || 'Erro de conexão com o servidor.' };
  }
}

export async function registrarConferencia(payload) {
  try {
    const response = await fetch(`${SERVER_URL}/api/conference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Erro no servidor');

    return { success: true };
  } catch (err) {
    console.error('Erro na API:', err);
    return { success: false, error: err.message };
  }
}

export async function sincronizarDadosOffline() {
  const registros = JSON.parse(localStorage.getItem('conferencias') || '[]');
  if (registros.length === 0) return;

  console.log(`Sincronizando ${registros.length} registros offline...`);

  const restantes = [];
  for (const payload of registros) {
    try {
      const response = await fetch(`${SERVER_URL}/api/conference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error();
    } catch (err) {
      restantes.push(payload);
    }
  }

  if (restantes.length === 0) {
    localStorage.removeItem('conferencias');
    return { success: true, count: registros.length };
  } else {
    localStorage.setItem('conferencias', JSON.stringify(restantes));
    return { success: false, remaining: restantes.length };
  }
}

export async function validarAdmin(usuario, senha) {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

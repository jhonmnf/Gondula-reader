const SERVER_URL = ''; // Relative paths for Vercel Functions
const API_KEY = 'gondula-secret-key'; // This should match the API_SECRET environment variable

async function authenticatedFetch(url, options = {}) {
  const defaultHeaders = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  };

  const mergedHeaders = {
    ...defaultHeaders,
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers: mergedHeaders
  });
}

async function mensagemDoErro(response, padrao) {
  try {
    const resultado = await response.json();
    return resultado.message || padrao;
  } catch {
    return padrao;
  }
}

export async function buscarProduto(termo) {
  const termoLimpo = termo.trim();
  if (!termoLimpo) return { error: 'Informe o código ou nome do produto.' };

  try {
    const response = await authenticatedFetch(`${SERVER_URL}/api/get-products?q=${encodeURIComponent(termoLimpo)}`, {
      mode: 'cors',
      cache: 'no-cache'
    });

    if (!response.ok) throw new Error(await mensagemDoErro(response, 'Não foi possível buscar o produto.'));

    const resultado = await response.json();
    if (!resultado.success) throw new Error('Erro ao processar busca');

    return { data: resultado.data };
  } catch (err) {
    console.error('Erro de conexão (busca site):', err);
    return { error: err.message || 'Erro de conexão com o servidor de busca.' };
  }
}

export async function registrarConferencia(payload) {
  try {
    const response = await authenticatedFetch(`${SERVER_URL}/api/conference`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await mensagemDoErro(response, 'Não foi possível salvar a conferência.'));

    return { success: true };
  } catch (err) {
    console.error('Erro na API:', err);
    return { success: false, error: err.message };
  }
}

export async function sincronizarDadosOffline() {
  const registros = JSON.parse(localStorage.getItem('conferencias') || '[]');
  if (registros.length === 0) return;

  console.log(`[Sincronização] Iniciando envio de ${registros.length} registros offline...`);

  const restantes = [];
  for (const [index, payload] of registros.entries()) {
    try {
      const response = await authenticatedFetch(`${SERVER_URL}/api/conference`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await mensagemDoErro(response, `Erro no servidor (${response.status})`));
      }
      console.log(`[Sincronização] Registro ${index + 1}/${registros.length} enviado com sucesso.`);
    } catch (err) {
      console.error(`[Sincronização] Falha ao enviar registro ${index + 1}:`, err);
      restantes.push(payload);
    }
  }

  if (restantes.length === 0) {
    localStorage.removeItem('conferencias');
    console.log('[Sincronização] Todos os registros foram sincronizados!');
    return { success: true, count: registros.length };
  } else {
    localStorage.setItem('conferencias', JSON.stringify(restantes));
    console.warn(`[Sincronização] ${restantes.length} registros não puderam ser sincronizados e permanecem no local.`);
    return { success: false, remaining: restantes.length };
  }
}

export async function validarAdmin(usuario, senha) {
  try {
    const response = await authenticatedFetch(`${SERVER_URL}/api/auth-admin`, {
      method: 'POST',
      body: JSON.stringify({ usuario, senha })
    });
    return response.ok;
  } catch (err) {
    return false;
  }
}

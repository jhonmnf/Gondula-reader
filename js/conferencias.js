import { isUserLoggedIn } from './auth.js';
import { listarConferencias } from './api.js';

const lista = document.querySelector('#lista-conferencias');
const mensagem = document.querySelector('#mensagem-historico');
const total = document.querySelector('#total-historico');
const filtro = document.querySelector('#filtro-status');
const atualizar = document.querySelector('#atualizar-historico');
const anterior = document.querySelector('#pagina-anterior');
const proxima = document.querySelector('#pagina-proxima');
const paginacao = document.querySelector('#paginacao-historico');
let paginaAtual = 1;
let carregando = false;

const rotulos = { correta: '✓ Correta', divergente: '! Divergente', ausente: '⊘ Ausente' };
const formatadorData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function adicionarCampo(container, titulo, valor) {
  const campo = document.createElement('div');
  const label = document.createElement('dt');
  label.textContent = titulo;
  const conteudo = document.createElement('dd');
  conteudo.textContent = valor || 'Não informado';
  campo.append(label, conteudo);
  container.append(campo);
}

function exibirRegistros(registros) {
  lista.replaceChildren();
  for (const registro of registros) {
    const item = document.createElement('li');
    item.className = 'historico__registro';
    const resultado = document.createElement('span');
    resultado.className = 'historico__resultado';
    if (Object.hasOwn(rotulos, registro.status)) resultado.classList.add(`historico__resultado--${registro.status}`);
    resultado.textContent = rotulos[registro.status] || 'Resultado não informado';
    const nome = document.createElement('h2');
    nome.textContent = registro.nome;
    const dados = document.createElement('dl');
    adicionarCampo(dados, 'Código', registro.product_codigo);
    adicionarCampo(dados, 'Operador', registro.operator);
    const data = registro.timestamp ? new Date(registro.timestamp) : null;
    adicionarCampo(dados, 'Data e hora', data && !Number.isNaN(data.getTime()) ? formatadorData.format(data) : null);
    item.append(resultado, nome, dados);
    lista.append(item);
  }
}

async function carregar(pagina = 1) {
  if (carregando) return;
  carregando = true;
  atualizar.disabled = anterior.disabled = proxima.disabled = filtro.disabled = true;
  lista.setAttribute('aria-busy', 'true');
  mensagem.textContent = 'Carregando conferências…';
  total.hidden = paginacao.hidden = true;
  lista.replaceChildren();

  try {
    const resultado = await listarConferencias({ pagina, status: filtro.value });
    if (resultado.error) throw new Error(resultado.error);
    paginaAtual = resultado.pagina;
    exibirRegistros(resultado.data);
    total.textContent = `${resultado.total} conferência(s) encontrada(s).`;
    total.hidden = false;
    mensagem.textContent = resultado.data.length ? '' : 'Nenhuma conferência encontrada para este resultado.';
    document.querySelector('#pagina-historico').textContent = `Página ${paginaAtual} de ${resultado.paginas}`;
    paginacao.hidden = resultado.paginas <= 1;
    anterior.disabled = paginaAtual <= 1;
    proxima.disabled = paginaAtual >= resultado.paginas;
  } catch (error) {
    mensagem.textContent = error.message || 'Não foi possível carregar o histórico. Toque em Atualizar para tentar novamente.';
  } finally {
    carregando = false;
    atualizar.disabled = filtro.disabled = false;
    lista.setAttribute('aria-busy', 'false');
  }
}

document.querySelector('#filtros-historico').addEventListener('submit', evento => {
  evento.preventDefault();
  carregar();
});
filtro.addEventListener('change', () => carregar());
anterior.addEventListener('click', () => carregar(paginaAtual - 1));
proxima.addEventListener('click', () => carregar(paginaAtual + 1));

if (await isUserLoggedIn()) {
  await carregar();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js');
} else {
  window.location.replace('login.html');
}

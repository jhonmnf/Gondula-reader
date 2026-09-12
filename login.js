import { validarAdmin } from './js/api.js';
import { loginUser } from './js/auth.js';

const campoSenha = document.querySelector('#senha');
const botaoMostrarSenha = document.querySelector('#botao-mostrar-senha');

botaoMostrarSenha.addEventListener('click', () => {
  const mostrarSenha = campoSenha.type === 'password';
  campoSenha.type = mostrarSenha ? 'text' : 'password';
  botaoMostrarSenha.setAttribute('aria-pressed', String(mostrarSenha));
  botaoMostrarSenha.setAttribute('aria-label', mostrarSenha ? 'Esconder senha' : 'Mostrar senha');
  botaoMostrarSenha.querySelector('span').textContent = mostrarSenha ? '🙈' : '👁';
});

document.querySelector('#formulario-login').addEventListener('submit', async evento => {
  evento.preventDefault();

  const usuario = document.querySelector('#usuario').value;
  const senha = document.querySelector('#senha').value;
  const erroEl = document.querySelector('#erro-login');

  try {
    const isValid = await validarAdmin(usuario, senha);
    if (isValid) {
      loginUser();
      window.location.replace('index.html');
    } else {
      erroEl.textContent = 'Usuário ou senha incorretos.';
      erroEl.classList.add('mensagem--erro');
      setTimeout(() => erroEl.classList.remove('mensagem--erro'), 500);
    }
  } catch (err) {
    erroEl.textContent = 'Erro de conexão com o servidor.';
    erroEl.classList.add('mensagem--erro');
    setTimeout(() => erroEl.classList.remove('mensagem--erro'), 500);
  }
});

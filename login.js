document.querySelector('#formulario-login').addEventListener('submit', evento => {
  evento.preventDefault();

  const usuario = document.querySelector('#usuario').value;
  const senha = document.querySelector('#senha').value;
  const erroEl = document.querySelector('#erro-login');

  if (usuario === 'admin' && senha === 'admin') {
    localStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';
  } else {
    erroEl.textContent = 'Usuário ou senha incorretos.';
    erroEl.classList.add('mensagem--erro');
    setTimeout(() => erroEl.classList.remove('mensagem--erro'), 500);
  }
});

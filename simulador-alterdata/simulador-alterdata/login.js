document.querySelector('#formulario-login').addEventListener('submit', async evento => {
  evento.preventDefault();

  const usuario = document.querySelector('#usuario').value;
  const senha = document.querySelector('#senha').value;
  const erroEl = document.querySelector('#erro-login');

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
      // Importante para enviar/receber cookies
      credentials: 'include'
    });

    const resultado = await response.json();

    if (resultado.success) {
      localStorage.setItem('isLoggedIn', 'true');
      window.location.href = 'index.html';
    } else {
      erroEl.textContent = resultado.message || 'Usuário ou senha incorretos.';
      erroEl.classList.add('mensagem--erro');
      setTimeout(() => erroEl.classList.remove('mensagem--erro'), 500);
    }
  } catch (err) {
    erroEl.textContent = 'Erro de conexão com o servidor.';
    erroEl.classList.add('mensagem--erro');
    setTimeout(() => erroEl.classList.remove('mensagem--erro'), 500);
  }
});
